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
import React, { useState } from 'react';
import rison from 'rison-node';
// import { EuiResizableContainer } from '@elastic/eui';
import { FormattedMessage, I18nProvider } from '@kbn/i18n/react';
import { EuiFlexItem, EuiFlexGroup, EuiButtonToggle } from '@elastic/eui';
import { HitsCounter } from './hits_counter';
import { DiscoverGrid } from './discover_grid/discover_grid';
import { TimechartHeader } from './timechart_header';
import { getServices } from '../../kibana_services';

// @ts-ignore
import { DiscoverNoResults } from '../angular/directives/no_results';
import { DiscoverUninitialized } from '../angular/directives/uninitialized';
import { DiscoverHistogram } from '../angular/directives/histogram';
import { LoadingSpinner } from './loading_spinner/loading_spinner';
import './discover.scss';
import { esFilters, search } from '../../../../data/public';
import { DiscoverSidebarResponsive } from './sidebar';

export function Discover({
  addColumn,
  fetch,
  fetchCounter,
  fetchError,
  fieldCounts,
  histogramData,
  hits,
  indexPattern,
  onAddFilter,
  onChangeInterval,
  onRemoveColumn,
  onSetColumns,
  onSort,
  onResize,
  opts,
  resetQuery,
  resultState,
  rows,
  searchSource,
  setIndexPattern,
  showTimeCol,
  showSaveQuery,
  state,
  timefilterUpdateHandler,
  timeRange,
  topNavMenu,
  vis,
  updateQuery,
  updateSavedQueryId,
}: any) {
  const [toggleOn, toggleChart] = useState(true);
  if (!timeRange) {
    return <div>Loading</div>;
  }
  const { TopNavMenu } = getServices().navigation.ui;
  const enhanced = getServices().enhanced;

  const { savedSearch, filterManager, indexPatternList } = opts;
  const bucketAggConfig = vis?.data?.aggs?.aggs[1];
  const bucketInterval =
    bucketAggConfig && search.aggs.isDateHistogramBucketAggConfig(bucketAggConfig)
      ? bucketAggConfig.buckets?.getInterval()
      : undefined;

  const getContextAppHref = (anchorId: string) => {
    const path = `#/context/${encodeURIComponent(indexPattern.id)}/${encodeURIComponent(anchorId)}`;
    const urlSearchParams = new URLSearchParams();

    urlSearchParams.set(
      'g',
      rison.encode({
        filters: filterManager.getGlobalFilters() || [],
      })
    );

    urlSearchParams.set(
      '_a',
      rison.encode({
        columns: state.columns,
        filters: (filterManager.getAppFilters() || []).map(esFilters.disableFilter),
      })
    );
    return `${path}?${urlSearchParams.toString()}`;
  };

  return (
    <I18nProvider>
      <div className="dscApp" data-fetch-counter={fetchCounter}>
        <h1 className="euiScreenReaderOnly">{savedSearch.title}</h1>
        <TopNavMenu
          appName="discover"
          config={topNavMenu}
          indexPatterns={[indexPattern]}
          onQuerySubmit={updateQuery}
          onSavedQueryIdChange={updateSavedQueryId}
          query={state.query}
          setMenuMountPoint={opts.setHeaderActionMenu}
          savedQueryId={state.savedQuery}
          screenTitle={savedSearch.title}
          showDatePicker={indexPattern.isTimeBased()}
          showSaveQuery={showSaveQuery}
          showSearchBar={true}
          useDefaultBehaviors={true}
        />
        <main className="dscApp__frame">
          <>
            <DiscoverSidebarResponsive
              columns={state.columns}
              fieldCounts={fieldCounts}
              hits={rows}
              indexPatternList={indexPatternList}
              onAddField={addColumn}
              onAddFilter={onAddFilter}
              onRemoveField={onRemoveColumn}
              selectedIndexPattern={searchSource && searchSource.getField('index')}
              setIndexPattern={setIndexPattern}
            />
            <>
              <div className="dscWrapper__content">
                {resultState === 'none' && (
                  <DiscoverNoResults
                    timeFieldName={opts.timefield}
                    queryLanguage={state.query.language}
                  />
                )}
                {resultState === 'uninitialized' && <DiscoverUninitialized onRefresh={fetch} />}
                {resultState === 'loading' && <>{!fetchError && <LoadingSpinner />}</>}

                {resultState === 'ready' && (
                  <>
                    <div className="dscResultCount">
                      <EuiFlexGroup justifyContent="spaceBetween">
                        <EuiFlexItem
                          grow={false}
                          className="dscResuntCount__title eui-textTruncate eui-textNoWrap"
                        >
                          <HitsCounter
                            hits={hits > 0 ? hits : 0}
                            showResetButton={!!(savedSearch && savedSearch.id)}
                            onResetQuery={resetQuery}
                          />
                        </EuiFlexItem>
                        <EuiFlexItem className="dscResultCount__actions">
                          <TimechartHeader
                            dateFormat={opts.config.get('dateFormat')}
                            timeRange={timeRange}
                            options={search.aggs.intervalOptions}
                            onChangeInterval={onChangeInterval}
                            stateInterval={state.interval || ''}
                            bucketInterval={bucketInterval}
                          />
                        </EuiFlexItem>
                        <EuiFlexItem className="dscResultCount__toggle" grow={false}>
                          <EuiButtonToggle
                            label={toggleOn ? 'Hide chart' : 'Show chart'}
                            iconType={toggleOn ? 'eyeClosed' : 'eye'}
                            onChange={(e: any) => {
                              toggleChart(e.target.checked);
                            }}
                            isSelected={toggleOn}
                            isEmpty
                          />
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </div>

                    <div className="dscResults">
                      {opts.timefield && toggleOn && (
                        <section
                          aria-label="{{::'discover.histogramOfFoundDocumentsAriaLabel' | i18n: {defaultMessage: 'Histogram of found documents'} }}"
                          className="dscTimechart"
                        >
                          {vis && rows.length !== 0 && (
                            <div className="dscHistogramGrid" data-test-subj="discoverChart">
                              <DiscoverHistogram
                                chartData={histogramData}
                                timefilterUpdateHandler={timefilterUpdateHandler}
                              />
                            </div>
                          )}
                        </section>
                      )}
                      <section className="dscTable" aria-labelledby="documentsAriaLabel">
                        <h2 className="euiScreenReaderOnly" id="documentsAriaLabel">
                          <FormattedMessage
                            id="discover.documentsAriaLabel"
                            defaultMessage="Documents"
                          />
                        </h2>
                        {rows && rows.length && (
                          <div className="dscDiscoverGrid">
                            <DiscoverGrid
                              ariaLabelledBy="documentsAriaLabel"
                              columns={state.columns}
                              columnsWidth={state.columnsWidth}
                              indexPattern={indexPattern}
                              rows={rows}
                              sort={state.sort}
                              sampleSize={opts.sampleSize}
                              searchDescription={opts.savedSearch.description}
                              searchTitle={opts.savedSearch.lastSavedTitle}
                              showTimeCol={showTimeCol}
                              getContextAppHref={getContextAppHref}
                              onAddColumn={addColumn}
                              onFilter={onAddFilter}
                              onRemoveColumn={onRemoveColumn}
                              onSetColumns={onSetColumns}
                              onSort={onSort}
                              onResize={onResize}
                              useDocSelector={enhanced}
                            />
                          </div>
                        )}
                      </section>
                    </div>
                  </>
                )}
              </div>
            </>
          </>
        </main>
      </div>
    </I18nProvider>
  );
}
