/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useMemo, useState, useCallback, ReactNode } from 'react';
import { i18n } from '@kbn/i18n';
import {
  EuiButtonToggle,
  EuiDataGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiIcon,
  EuiLink,
  EuiPortal,
  EuiTitle,
  useRenderToText,
  htmlIdGenerator,
  EuiButtonEmpty,
  EuiSpacer,
  EuiDataGridColumn,
  EuiDataGridCellValueElementProps,
} from '@elastic/eui';
import { DocViewer } from '../doc_viewer/doc_viewer';
import { IndexPattern } from '../../../kibana_services';
import { ElasticSearchHit, DocViewFilterFn } from '../../doc_views/doc_views_types';
import { shortenDottedString } from '../../../../../../../../plugins/data/common/utils/shorten_dotted_string';

type Direction = 'asc' | 'desc';
type SortArr = [string, Direction];
interface SortObj {
  id: string;
  direction: Direction;
}

interface Props {
  rows: ElasticSearchHit[];
  columns: string[];
  sort: SortArr[];
  ariaLabelledBy: string;
  indexPattern: IndexPattern;
  searchTitle?: string;
  searchDescription?: string;
  sampleSize: number;
  onFilter: DocViewFilterFn;
  useShortDots: boolean;
  onSort: Function;
  getContextAppHref: (id: string | number | Record<string, unknown>) => string;
  onRemoveColumn: (column: string) => void;
  onAddColumn: (column: string) => void;
}

const cellPopoverRenderer = (
  value: string | ReactNode,
  positiveFilterClick: () => void,
  negativeFilterClick: () => void
) => {
  return (
    <>
      {value}
      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="none">
        <EuiFlexItem>
          <EuiButtonEmpty
            iconType="magnifyWithPlus"
            aria-label={`Filter on ${value}`}
            onClick={positiveFilterClick}
          >
            Filter on value
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiButtonEmpty
            iconType="magnifyWithMinus"
            aria-label={`Filter without ${value}`}
            color="danger"
            onClick={negativeFilterClick}
          >
            Filter without value
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

export function DiscoverGrid({
  rows,
  columns,
  sort,
  indexPattern,
  ariaLabelledBy,
  searchTitle,
  searchDescription,
  useShortDots,
  onSort,
  sampleSize,
  onFilter,
  getContextAppHref,
  onRemoveColumn,
  onAddColumn,
}: Props) {
  const actionColumnId = 'uniqueString'; // TODO should be guaranteed unique...
  const lowestPageSize = 50;
  const timeNode = useMemo(
    () => (
      <span>
        {i18n.translate('kbn.discover.timeLabel', {
          defaultMessage: 'Time',
        })}
      </span>
    ),
    []
  );
  const timeString = useRenderToText(timeNode, 'Time');
  const [flyoutRow, setFlyoutRow] = useState<ElasticSearchHit | undefined>(undefined);

  const dataGridColumns = columns.map(
    (columnName, i): EuiDataGridColumn => {
      // Discover always injects a Time column as the first item (unless advance settings turned it off)
      // Have to guard against this to allow users to request the same column again later
      if (columnName === indexPattern.timeFieldName && i === 0) {
        return { id: timeString, schema: 'datetime' };
      }

      const column: EuiDataGridColumn = {
        id: columnName,
        schema: indexPattern.getFieldByName(columnName)?.type,
      };

      // Default DataGrid schemas: boolean, numeric, datetime, json, currency
      // Default indexPattern types: KBN_FIELD_TYPES in src/plugins/data/common/kbn_field_types/types.ts
      switch (column.schema) {
        case 'date':
          column.schema = 'datetime';
          break;
        case 'numeric':
          column.schema = 'number';
          break;
        case '_source':
        case 'object':
          column.schema = 'json';
          break;
      }

      if (useShortDots) {
        column.display = <>{shortenDottedString(columnName)}</>;
      }

      return column;
    }
  );

  dataGridColumns.unshift({ id: actionColumnId, isExpandable: false, display: <></> });

  /**
   * Pagination
   */
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: lowestPageSize });
  const onChangeItemsPerPage = useCallback(
    pageSize => setPagination(paginationData => ({ ...paginationData, pageSize })),
    [setPagination]
  );
  const onChangePage = useCallback(
    pageIndex => setPagination(paginationData => ({ ...paginationData, pageIndex })),
    [setPagination]
  );

  /**
   * Sorting
   */
  const sortingColumns = useMemo(() => sort.map(([id, direction]) => ({ id, direction })), [sort]);
  const onTableSort = useCallback(
    sortingColumnsData => {
      onSort(sortingColumnsData.map(({ id, direction }: SortObj) => [id, direction]));
    },
    [onSort]
  );

  /**
   * Visibility and order
   */
  const [visibleColumns, setVisibleColumns] = useState(dataGridColumns.map(obj => obj.id));

  /**
   * Cell rendering
   */
  const renderCellValue = useMemo(() => {
    const showFilterActions = (isDetails: boolean, fieldName: string) => {
      return isDetails && indexPattern.fields.getByName(fieldName)?.filterable;
    };
    const createFilter = (fieldName: string, row: any, type: '-' | '+') => {
      return onFilter(
        indexPattern.fields.getByName(fieldName),
        indexPattern.flattenHit(row)[fieldName],
        type
      );
    };
    const formattedField = function(row: any, columnId: string) {
      const formattedValue = indexPattern.formatField(row, columnId);

      // TODO Field formatters need to be fixed
      // eslint-disable-next-line react/no-danger
      return <span dangerouslySetInnerHTML={{ __html: formattedValue }} />;
    };

    return ({ rowIndex, columnId, isDetails }: EuiDataGridCellValueElementProps) => {
      const adjustedRowIndex = rowIndex - pagination.pageIndex * pagination.pageSize;
      const row = rows[adjustedRowIndex];
      let value: string | ReactNode;
      value = '-';

      if (typeof row === 'undefined') {
        return value;
      }

      if (columnId === actionColumnId) {
        const showFlyout = typeof flyoutRow === 'undefined';

        return (
          <EuiButtonToggle
            label="Toggle dialog with details"
            iconType={showFlyout ? 'eye' : 'eyeClosed'}
            onChange={() => setFlyoutRow(row)}
            isSelected={showFlyout}
            isEmpty
            isIconOnly
          />
        );
      }

      const fieldName = columnId === timeString ? indexPattern.timeFieldName! : columnId;
      value = formattedField(row, fieldName);

      if (showFilterActions(isDetails, fieldName)) {
        return cellPopoverRenderer(
          value,
          () => createFilter(fieldName, rows[rowIndex], '+'),
          () => createFilter(fieldName, rows[rowIndex], '-')
        );
      }

      return value;
    };
  }, [
    indexPattern,
    onFilter,
    pagination.pageIndex,
    pagination.pageSize,
    rows,
    timeString,
    flyoutRow,
  ]);

  /**
   * Render variables
   */
  const pageCount = Math.ceil(rows.length / pagination.pageSize);
  const isOnLastPage = pagination.pageIndex === pageCount - 1;
  const showDisclaimer = rows.length === sampleSize && isOnLastPage;
  const randomId = htmlIdGenerator()();
  let searchString: ReactNode = <></>;
  if (searchTitle) {
    if (searchDescription) {
      searchString = i18n.translate('kbn.discover.timeLabel', {
        defaultMessage: 'Table generated by search {searchTitle} ({searchDescription})',
        values: { searchTitle, searchDescription },
      });
    } else {
      searchString = i18n.translate('kbn.discover.timeLabel', {
        defaultMessage: 'Table generated by search {searchTitle}',
        values: { searchTitle },
      });
    }
  }

  return (
    <>
      <EuiDataGrid
        aria-labelledby={ariaLabelledBy}
        aria-describedby={randomId}
        inMemory={{ level: 'sorting' }}
        sorting={{ columns: sortingColumns, onSort: onTableSort }}
        rowCount={rows.length}
        columns={dataGridColumns}
        renderCellValue={renderCellValue}
        columnVisibility={{
          visibleColumns,
          setVisibleColumns,
        }}
        pagination={{
          ...pagination,
          onChangeItemsPerPage,
          onChangePage,
          pageSizeOptions: [lowestPageSize, 100, 500],
        }}
        // TODO - EUI feature: disable visibility but keep ability to reorder
        // toolbarVisibility={{
        //   showColumnSelector: false,
        // }}
        gridStyle={{
          border: 'horizontal',
        }}
      />
      {showDisclaimer && (
        <>
          <p className="dscTable__footer">
            {i18n.translate('kbn.discover.howToSeeOtherMatchingDocumentsDescription', {
              defaultMessage:
                'These are the first {sampleSize} documents matching your search, refine your search to see others. ',
              values: { sampleSize },
            })}
            <a href={`#${ariaLabelledBy}`}>
              {i18n.translate('kbn.discover.backToTopLinkText', {
                defaultMessage: 'Back to top.',
              })}
            </a>
          </p>
        </>
      )}
      {searchString && <p id={randomId}>{searchString}</p>}
      {typeof flyoutRow !== 'undefined' && (
        <EuiPortal>
          <EuiFlyout onClose={() => setFlyoutRow(undefined)} size="l" ownFocus>
            <EuiFlyoutHeader hasBorder>
              <EuiFlexGroup alignItems="baseline" justifyContent="spaceBetween">
                <EuiFlexItem>
                  <EuiFlexGroup alignItems="center" gutterSize="none">
                    <EuiFlexItem grow={false}>
                      <EuiIcon type="folderOpen" size="l" />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiTitle className="dscTable__flyoutHeader">
                        <h2>
                          {i18n.translate('kbn.docTable.tableRow.detailHeading', {
                            defaultMessage: 'Expanded document',
                          })}
                        </h2>
                      </EuiTitle>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiFlexGroup justifyContent="flexEnd">
                    {indexPattern.isTimeBased() && (
                      <EuiFlexItem grow={false}>
                        <EuiLink href={getContextAppHref(flyoutRow._id)}>
                          {i18n.translate(
                            'kbn.docTable.tableRow.viewSurroundingDocumentsLinkText',
                            {
                              defaultMessage: 'View surrounding documents',
                            }
                          )}
                        </EuiLink>
                      </EuiFlexItem>
                    )}
                    <EuiFlexItem grow={false}>
                      <EuiLink
                        href={`#/doc/${indexPattern.id}/${flyoutRow._index}?id=${encodeURIComponent(
                          flyoutRow._id as string
                        )}`}
                      >
                        {i18n.translate('kbn.docTable.tableRow.viewSingleDocumentLinkText', {
                          defaultMessage: 'View single document',
                        })}
                      </EuiLink>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlyoutHeader>
            <EuiFlyoutBody>
              <DocViewer
                hit={flyoutRow}
                columns={visibleColumns}
                indexPattern={indexPattern}
                filter={onFilter}
                onRemoveColumn={onRemoveColumn}
                onAddColumn={onAddColumn}
              />
            </EuiFlyoutBody>
          </EuiFlyout>
        </EuiPortal>
      )}
    </>
  );
}
