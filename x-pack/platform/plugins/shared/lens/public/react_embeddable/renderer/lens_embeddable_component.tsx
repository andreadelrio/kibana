/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  apiPublishesTimeRange,
  useBatchedPublishingSubjects,
  useStateFromPublishingSubject,
} from '@kbn/presentation-publishing';
import React, { useEffect } from 'react';
import { BehaviorSubject } from 'rxjs';
import type { TimeRange } from '@kbn/es-query';
import type { LensInternalApi, LensRuntimeState } from '@kbn/lens-common';
import type { LensApi } from '@kbn/lens-common-2';
import { ExpressionWrapper } from '../expression_wrapper';
import { UserMessages } from '../user_messages/container';
import { useMessages } from './hooks';
import { getViewMode } from '../helper';
import { addLog } from '../logger';
import { NewPanelEmptyState } from './new_panel_empty_state';

// PROTOTYPE: true once any form-based layer has a column, i.e. the user (or a starter) added a field
const hasAnyColumns = (attributes: LensRuntimeState['attributes'] | undefined) => {
  const layers = (
    attributes?.state?.datasourceStates?.formBased as
      | { layers?: Record<string, { columnOrder?: string[] }> }
      | undefined
  )?.layers;
  // Only form-based charts can start empty; anything else counts as configured
  return layers ? Object.values(layers).some((layer) => layer.columnOrder?.length) : true;
};

const NO_TIME_RANGE$ = new BehaviorSubject<TimeRange | undefined>(undefined);

export function LensEmbeddableComponent({
  internalApi,
  api,
  onUnmount,
}: {
  internalApi: LensInternalApi;
  api: LensApi;
  onUnmount: () => void;
}) {
  const [
    // Pick up updated params from the observable
    expressionParams,
    // these are blocking errors that can be shown in a badge
    // without replacing the entire panel
    blockingErrors,
    hideTitle,
    panelTitle,
    isNewlyCreated,
    dataViews,
    attributes,
  ] = useBatchedPublishingSubjects(
    internalApi.expressionParams$,
    internalApi.validationMessages$,
    api.hideTitle$,
    api.title$,
    internalApi.isNewlyCreated$,
    internalApi.dataViews$,
    internalApi.attributes$,
    // listen to view change mode but do not use its actual value
    // just call the Lens API to know whether it's in edit mode
    api.viewMode$
  );
  // PROTOTYPE: the "Mini charts" empty state renders real charts over the dashboard's time range
  const timeRange = useStateFromPublishingSubject(
    apiPublishesTimeRange(api.parentApi) ? api.parentApi.timeRange$ : NO_TIME_RANGE$
  );
  const canEdit = Boolean(api.isEditingEnabled?.() && getViewMode(api) === 'edit');

  const [warningOrErrors, infoMessages] = useMessages(internalApi);

  // On unmount call all the cleanups
  useEffect(() => {
    addLog(`Mounting Lens Embeddable component: ${api.defaultTitle$?.getValue()}`);
    return onUnmount;
  }, [api, onUnmount]);

  // A brand-new panel that can't render yet shows starter suggestions instead of validation errors.
  // Checking for columns too covers a panel emptied after it rendered: the data loader keeps the
  // last chart's expression when the new state has none.
  if (
    isNewlyCreated &&
    canEdit &&
    (expressionParams?.expression == null || blockingErrors.length || !hasAnyColumns(attributes))
  ) {
    return (
      <NewPanelEmptyState panelId={api.uuid} dataView={dataViews?.[0]} timeRange={timeRange} />
    );
  }

  return (
    <div css={{ width: '100%', height: '100%', position: 'relative' }}>
      {expressionParams == null || blockingErrors.length ? null : (
        <ExpressionWrapper {...expressionParams} paddingTop={hideTitle || !panelTitle?.length} />
      )}
      <UserMessages
        blockingErrors={blockingErrors}
        warningOrErrors={warningOrErrors}
        infoMessages={infoMessages}
        canEdit={canEdit}
      />
    </div>
  );
}
