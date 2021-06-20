/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useState, useEffect } from 'react';
import { i18n } from '@kbn/i18n';
import {
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiButton,
} from '@elastic/eui';

import { ensureMinimumTime, getIndices, extractTimeFields, getMatchedIndices } from '../lib';
import { AdvancedParametersSection } from './field_editor/advanced_parameters_section';

import {
  IndexPatternSpec,
  Form,
  UseField,
  useForm,
  TextField,
  useFormData,
  ToggleField,
  useKibana,
} from '../shared_imports';

import {
  MatchedItem,
  ResolveIndexResponseItemAlias,
  // IndexPatternTableItem,
  IndexPatternEditorContext,
} from '../types';

import { schema } from './form_schema';
import { TimestampField, TypeField, TitleField } from './form_fields';
import { EmptyState } from './empty_state';
import { EmptyIndexPatternPrompt } from './empty_index_pattern_prompt';
import { IndexPatternCreationConfig } from '../service';

export interface Props {
  /**
   * Handler for the "save" footer button
   */
  onSave: (indexPatternSpec: IndexPatternSpec) => void;
  /**
   * Handler for the "cancel" footer button
   */
  onCancel: () => void;

  // uiSettings: CoreStart['uiSettings'];
  isSaving: boolean;
  existingIndexPatterns: string[];
}

export interface IndexPatternConfig {
  title: string;
  timestampField?: string; // TimestampOption;
  allowHidden: boolean;
  id?: string;
  type: string;
}
export interface TimestampOption {
  display: string;
  fieldName?: string;
  isDisabled?: boolean;
}

export interface FormInternal extends Omit<IndexPatternConfig, 'timestampField'> {
  timestampField?: TimestampOption;
}

const geti18nTexts = () => {
  return {
    closeButtonLabel: i18n.translate('indexPatternEditor.editor.flyoutCloseButtonLabel', {
      defaultMessage: 'Close',
    }),
    saveButtonLabel: i18n.translate('indexPatternEditor.editor.flyoutSaveButtonLabel', {
      defaultMessage: 'Save',
    }),
  };
};

const IndexPatternEditorFlyoutContentComponent = ({ onSave, onCancel, isSaving }: Props) => {
  const {
    services: { http, indexPatternService, uiSettings, indexPatternCreateService },
  } = useKibana<IndexPatternEditorContext>();
  const i18nTexts = geti18nTexts();

  // return type, interal type
  const { form } = useForm<IndexPatternConfig, FormInternal>({
    defaultValue: { title: '' },
    schema,
  });

  const [{ title, allowHidden, type }] = useFormData<FormInternal>({ form });
  const [isLoadingSources, setIsLoadingSources] = useState<boolean>(true);

  const [formState, setFormState] = useState<{ isSubmitted: boolean; isValid: boolean }>({
    isSubmitted: false,
    isValid: false,
    /* isValid: field ? true : undefined,
    submit: field
      ? async () => ({ isValid: true, data: field })
      : async () => ({ isValid: false, data: {} as Field }),
      */
  });
  const [lastTitle, setLastTitle] = useState('');
  const [exactMatchedIndices, setExactMatchedIndices] = useState<MatchedItem[]>([]);
  const [partialMatchedIndices, setPartialMatchedIndices] = useState<MatchedItem[]>([]);
  const [timestampFields, setTimestampFields] = useState<TimestampOption[]>([]);
  const [sources, setSources] = useState<MatchedItem[]>([]);
  const [remoteClustersExist, setRemoteClustersExist] = useState<boolean>(false);
  const [isLoadingIndexPatterns, setIsLoadingIndexPatterns] = useState<boolean>(true);
  const [goToForm, setGoToForm] = useState<boolean>(false);

  // const [indexPatterns, setIndexPatterns] = useState<IndexPatternTableItem[]>([]);
  const [
    indexPatternCreationType,
    setIndexPatternCreationType,
  ] = useState<IndexPatternCreationConfig>(indexPatternCreateService.creation.getType('default'));

  const [existingIndexPatterns, setExistingIndexPatterns] = useState<string[]>([]);

  const removeAliases = (item: MatchedItem) =>
    !((item as unknown) as ResolveIndexResponseItemAlias).indices;

  const loadSources = () => {
    getIndices(http, () => [], '*', false).then((dataSources) =>
      setSources(dataSources.filter(removeAliases))
    );
    getIndices(http, () => [], '*:*', false).then((dataSources) =>
      setRemoteClustersExist(!!dataSources.filter(removeAliases).length)
    );
  };

  useEffect(() => {
    let isMounted = true;
    getIndices(http, () => [], '*', false).then(async (dataSources) => {
      if (isMounted) {
        setSources(dataSources.filter(removeAliases));
        setIsLoadingSources(false);
      }
    });
    getIndices(http, () => [], '*:*', false).then((dataSources) => {
      if (isMounted) {
        setRemoteClustersExist(!!dataSources.filter(removeAliases).length);
      }
    });

    const getTitles = async () => {
      const indexPatternTitles = await indexPatternService.getTitles();
      if (isMounted) {
        setExistingIndexPatterns(indexPatternTitles);
        setIsLoadingIndexPatterns(false);
      }
    };
    getTitles();
    return () => {
      isMounted = false;
    };
  }, [http, indexPatternService]);

  /*
  useEffect(() => {
    const getTitles = async () => {
      const indexPatternTitles = await indexPatternService.getTitles();
      setExistingIndexPatterns(indexPatternTitles);
      setIsLoadingIndexPatterns(false);
    };
    getTitles();
  }, [indexPatternService]);
  */

  useEffect(() => {
    const updatedCreationType = indexPatternCreateService.creation.getType(type);
    setIndexPatternCreationType(updatedCreationType);
    if (type === 'rollup') {
      form.setFieldValue('allowHidden', false);
    }
  }, [type, indexPatternCreateService.creation, form]);

  useEffect(() => {
    const fetchIndices = async (query: string = '') => {
      if (!query) {
        setExactMatchedIndices([]);
        setPartialMatchedIndices([]);
        setTimestampFields([]);
        return;
      }
      // const { indexPatternCreationType } = this.props;

      // this.setState({ isLoadingIndices: true, indexPatternExists: false });
      const indexRequests = [];

      if (query?.endsWith('*')) {
        const exactMatchedQuery = getIndices(
          http,
          (indexName: string) => indexPatternCreationType.getIndexTags(indexName),
          query,
          allowHidden
        );
        indexRequests.push(exactMatchedQuery);
        indexRequests.push(Promise.resolve([]));
      } else {
        const exactMatchQuery = getIndices(
          http,
          (indexName: string) => indexPatternCreationType.getIndexTags(indexName),
          query,
          allowHidden
        );
        const partialMatchQuery = getIndices(
          http,
          (indexName: string) => indexPatternCreationType.getIndexTags(indexName),
          `${query}*`,
          allowHidden
        );

        indexRequests.push(exactMatchQuery);
        indexRequests.push(partialMatchQuery);
      }

      if (query !== lastTitle) {
        return;
      }
      const [exactMatched, partialMatched] = (await ensureMinimumTime(
        indexRequests
      )) as MatchedItem[][];

      // If the search changed, discard this state

      // if (query !== this.lastQuery) {
      //  return;
      // }

      // this.setState({
      //  partialMatchedIndices,
      //  exactMatchedIndices,
      // isLoadingIndices: false,
      // });
      const isValidResult =
        !!title?.length && !existingIndexPatterns.includes(title) && exactMatched.length > 0;

      setFormState({
        isSubmitted: false,
        isValid: isValidResult, // todo show error when index pattern already exists
      });
      const matchedIndices = getMatchedIndices(
        [], // allIndices,
        partialMatched,
        exactMatched,
        allowHidden
      );
      setExactMatchedIndices(matchedIndices.exactMatchedIndices);
      setPartialMatchedIndices(matchedIndices.partialMatchedIndices);

      if (isValidResult) {
        const fields = await ensureMinimumTime(
          indexPatternService.getFieldsForWildcard({
            pattern: query,
            ...indexPatternCreationType.getFetchForWildcardOptions(),
          })
        );
        const timeFields = extractTimeFields(fields);
        setTimestampFields(timeFields);
      } else {
        setTimestampFields([]);
      }
    };

    // Whenever the field "type" changes we clear any possible painless syntax
    // error as it is possibly stale.
    setLastTitle(title);

    fetchIndices(title);
  }, [
    title,
    existingIndexPatterns,
    http,
    indexPatternService,
    allowHidden,
    lastTitle,
    indexPatternCreationType,
  ]);

  const { isValid } = formState;
  const onClickSave = async () => {
    // todo display result
    indexPatternCreationType.checkIndicesForErrors(exactMatchedIndices);
    const formData = form.getFormData();
    await onSave({
      title: formData.title,
      timeFieldName: formData.timestampField,
      id: formData.id,
      ...indexPatternCreationType.getIndexPatternMappings(),
    });
  };

  // todo

  if (isLoadingSources || isLoadingIndexPatterns) {
    return <>loading</>;
  }

  const hasDataIndices = sources.some(({ name }: MatchedItem) => !name.startsWith('.'));

  if (!existingIndexPatterns.length && !goToForm) {
    if (!hasDataIndices && !remoteClustersExist) {
      // load data
      return (
        <EmptyState
          onRefresh={loadSources}
          closeFlyout={onCancel}
          createAnyway={() => setGoToForm(true)}
        />
      );
    } else {
      // first time
      return <EmptyIndexPatternPrompt goToCreate={() => setGoToForm(true)} />;
    }
  }

  const showIndexPatternTypeSelect = () =>
    uiSettings.isDeclared('rollups:enableIndexPatterns') &&
    uiSettings.get('rollups:enableIndexPatterns');

  const indexPatternTypeSelect = showIndexPatternTypeSelect() ? (
    <EuiFlexGroup>
      <EuiFlexItem>
        <TypeField />
      </EuiFlexItem>
    </EuiFlexGroup>
  ) : (
    <></>
  );

  return (
    <>
      <EuiFlyoutHeader>
        <EuiTitle data-test-subj="flyoutTitle">
          <h2>Create index pattern</h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        {/*
          possibly break out into own component
        */}
        <Form form={form} className="indexPatternEditor__form">
          {indexPatternTypeSelect}
          <EuiFlexGroup>
            {/* Name */}
            <EuiFlexItem>
              <TitleField />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <TimestampField options={timestampFields} />
            </EuiFlexItem>
          </EuiFlexGroup>

          <div>{exactMatchedIndices.map((item) => item.name).join(', ')}</div>
          <AdvancedParametersSection>
            <EuiFlexGroup>
              <EuiFlexItem>
                <UseField<boolean, IndexPatternConfig>
                  path={'allowHidden'}
                  component={ToggleField}
                  data-test-subj="allowHiddenField"
                  componentProps={{
                    euiFieldProps: {
                      'aria-label': i18n.translate('indexPatternEditor.form.allowHiddenAriaLabel', {
                        defaultMessage: 'Allow hidden and system indices',
                      }),
                    },
                  }}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                <UseField<string, IndexPatternConfig>
                  path={'id'}
                  component={TextField}
                  data-test-subj="savedObjectIdField"
                  componentProps={{
                    euiFieldProps: {
                      'aria-label': i18n.translate(
                        'indexPatternEditor.form.customIndexPatternIdLabel',
                        {
                          defaultMessage: 'Custom index pattern ID',
                        }
                      ),
                    },
                  }}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </AdvancedParametersSection>
        </Form>
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="cross"
              flush="left"
              onClick={onCancel}
              data-test-subj="closeFlyoutButton"
            >
              {i18nTexts.closeButtonLabel}
            </EuiButtonEmpty>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiButton
              color="primary"
              onClick={onClickSave}
              data-test-subj="saveIndexPatternButton"
              fill
              disabled={
                !isValid ||
                !exactMatchedIndices.length ||
                !!indexPatternCreationType.checkIndicesForErrors(exactMatchedIndices) // todo display errors
              }
              // isLoading={isSavingField || isValidating}
            >
              {i18nTexts.saveButtonLabel}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
      {/* modal */}
    </>
  );
};

export const IndexPatternEditorFlyoutContent = React.memo(IndexPatternEditorFlyoutContentComponent);
