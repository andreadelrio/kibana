/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import './empty_state.scss';
import React from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import {
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiTitle,
  EuiPageContentBody,
  EuiPageContent,
  EuiIcon,
  EuiSpacer,
  EuiFlexItem,
  EuiDescriptionList,
  EuiFlexGrid,
  EuiCard,
  EuiLink,
  EuiText,
} from '@elastic/eui';

import { IndexPatternEditorContext } from '../../types';

import { useKibana } from '../../shared_imports';

export const EmptyState = ({
  onRefresh,
  closeFlyout,
  createAnyway,
}: {
  onRefresh: () => void;
  closeFlyout: () => void;
  createAnyway: () => void;
}) => {
  const {
    services: {
      docLinks,
      application: { navigateToApp, capabilities },
    },
  } = useKibana<IndexPatternEditorContext>();
  const mlCard = (
    <EuiFlexItem>
      <EuiCard
        onClick={() => {
          navigateToApp('ml', { path: '#/filedatavisualizer' });
          closeFlyout();
        }}
        className="inpEmptyState__card"
        betaBadgeLabel={
          // getMlCardState() === MlCardState.ENABLED
          //   ? undefined
          i18n.translate('indexPatternManagement.createIndexPattern.emptyState.basicLicenseLabel', {
            defaultMessage: 'Basic',
          })
        }
        betaBadgeTooltipContent={i18n.translate(
          'indexPatternManagement.createIndexPattern.emptyState.basicLicenseDescription',
          {
            defaultMessage: 'This feature requires a Basic license.',
          }
        )}
        // isDisabled={getMlCardState() === MlCardState.DISABLED}
        icon={<EuiIcon size="xl" type="document" color="subdued" />}
        title={
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.emptyState.uploadCardTitle"
            defaultMessage="Upload a file"
          />
        }
        description={
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.emptyState.uploadCardDescription"
            defaultMessage="Import a CSV, NDJSON, or log file."
          />
        }
      />
    </EuiFlexItem>
  );

  const createAnywayLink = (
    <EuiText color="subdued" textAlign="center" size="xs">
      <FormattedMessage
        id="indexPatternManagement.createIndexPattern.emptyState.createAnyway"
        defaultMessage="Some indices may be hidden. Try to {link} anyway."
        values={{
          link: (
            <EuiLink onClick={() => createAnyway()} data-test-subj="createAnyway">
              <FormattedMessage
                id="indexPatternManagement.createIndexPattern.emptyState.createAnywayLink"
                defaultMessage="create an index pattern"
              />
            </EuiLink>
          ),
        }}
      />
    </EuiText>
  );

  return (
    <>
      <EuiPageContent
        className="inpEmptyState"
        grow={false}
        horizontalPosition="center"
        data-test-subj="indexPatternEmptyState"
      >
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle>
              <h2>
                <FormattedMessage
                  id="indexPatternManagement.createIndexPattern.emptyState.noDataTitle"
                  defaultMessage="Ready to try Kibana? First, you need data."
                />
              </h2>
            </EuiTitle>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiSpacer size="m" />
        <EuiPageContentBody>
          <EuiFlexGrid className="inpEmptyState__cardGrid" columns={3} responsive={true}>
            <EuiFlexItem>
              <EuiCard
                className="inpEmptyState__card"
                onClick={() => {
                  navigateToApp('home', { path: '#/tutorial_directory' });
                  closeFlyout();
                }}
                icon={<EuiIcon size="xl" type="database" color="subdued" />}
                title={
                  <FormattedMessage
                    id="indexPatternManagement.createIndexPattern.emptyState.integrationCardTitle"
                    defaultMessage="Add integration"
                  />
                }
                description={
                  <FormattedMessage
                    id="indexPatternManagement.createIndexPattern.emptyState.integrationCardDescription"
                    defaultMessage="Add data from a variety of sources."
                  />
                }
              />
            </EuiFlexItem>
            {/* getMlCardState() !== MlCardState.HIDDEN ? mlCard : <></> */}
            {mlCard}
            <EuiFlexItem>
              <EuiCard
                className="inpEmptyState__card"
                onClick={() => {
                  navigateToApp('home', { path: '#/tutorial_directory/sampleData' });
                  closeFlyout();
                }}
                icon={<EuiIcon size="xl" type="heatmap" color="subdued" />}
                title={
                  <FormattedMessage
                    id="indexPatternManagement.createIndexPattern.emptyState.sampleDataCardTitle"
                    defaultMessage="Add sample data"
                  />
                }
                description={
                  <FormattedMessage
                    id="indexPatternManagement.createIndexPattern.emptyState.sampleDataCardDescription"
                    defaultMessage="Load a data set and a Kibana dashboard."
                  />
                }
              />
            </EuiFlexItem>
          </EuiFlexGrid>
          <EuiSpacer size="xxl" />
          <div className="inpEmptyState__footer">
            <EuiFlexGrid columns={3}>
              <EuiFlexItem className="inpEmptyState__footerFlexItem">
                <EuiDescriptionList
                  listItems={[
                    {
                      title: (
                        <FormattedMessage
                          id="indexPatternManagement.createIndexPattern.emptyState.learnMore"
                          defaultMessage="Want to learn more?"
                        />
                      ),
                      description: (
                        <EuiLink href={docLinks.links.addData} target="_blank" external>
                          <FormattedMessage
                            id="indexPatternManagement.createIndexPattern.emptyState.readDocs"
                            defaultMessage="Read documentation"
                          />
                        </EuiLink>
                      ),
                    },
                  ]}
                />
              </EuiFlexItem>
              <EuiFlexItem className="inpEmptyState__footerFlexItem">
                <EuiDescriptionList
                  listItems={[
                    {
                      title: (
                        <FormattedMessage
                          id="indexPatternManagement.createIndexPattern.emptyState.haveData"
                          defaultMessage="Think you already have data?"
                        />
                      ),
                      description: (
                        <EuiLink onClick={onRefresh} data-test-subj="refreshIndicesButton">
                          <FormattedMessage
                            id="indexPatternManagement.createIndexPattern.emptyState.checkDataButton"
                            defaultMessage="Check for new data"
                          />{' '}
                          <EuiIcon type="refresh" size="s" />
                        </EuiLink>
                      ),
                    },
                  ]}
                />
              </EuiFlexItem>
            </EuiFlexGrid>
          </div>
        </EuiPageContentBody>
      </EuiPageContent>
      <EuiSpacer />
      {capabilities.management.kibana.indexPatterns && createAnywayLink}
    </>
  );
};
