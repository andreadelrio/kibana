/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreStart } from '@kbn/core/public';
import type { EmbeddableApiContext } from '@kbn/presentation-publishing';
import { apiHasAppContext, apiIsPresentationContainer } from '@kbn/presentation-publishing';
import { ADD_PANEL_VISUALIZATION_GROUP } from '@kbn/embeddable-plugin/public';
import { IncompatibleActionError } from '@kbn/ui-actions-plugin/public';
import { i18n } from '@kbn/i18n';
import type { LensApi } from '@kbn/lens-common-2';
import type { LensSerializedState } from '@kbn/lens-common';
import { LENS_EMBEDDABLE_TYPE } from '@kbn/lens-common';
import type { LensPluginStartDependencies } from '../plugin';
import { lensVisTypeAlias } from '../vis_type_alias';
import { generateId } from '../id_generator';
import { createEmptyLensState } from '../react_embeddable/helper';
import { mountInlinePanel } from '../react_embeddable/mount';

/**
 * PROTOTYPE: builds an empty form-based stacked bar chart on the default data view,
 * so the inline editing flyout opens with the axis/breakdown dimensions ready to fill.
 */
async function getEmptyFormBasedAttributes(
  deps: LensPluginStartDependencies
): Promise<LensSerializedState['attributes'] | undefined> {
  const dataViewId = await deps.dataViews.getDefaultId();
  if (!dataViewId) {
    return;
  }
  const layerId = generateId();
  const { attributes } = createEmptyLensState('lnsXY');
  return {
    ...attributes,
    references: [
      {
        type: 'index-pattern',
        id: dataViewId,
        name: `indexpattern-datasource-layer-${layerId}`,
      },
    ],
    state: {
      ...attributes.state,
      datasourceStates: {
        formBased: { layers: { [layerId]: { columns: {}, columnOrder: [] } } },
      },
      visualization: {
        legend: { isVisible: true, position: 'right' },
        valueLabels: 'hide',
        preferredSeriesType: 'bar_stacked',
        layers: [
          {
            layerId,
            accessors: [],
            seriesType: 'bar_stacked',
            layerType: 'data',
          },
        ],
      },
    },
  } as LensSerializedState['attributes'];
}

export function getAddLensPanelAction(core: CoreStart, deps: LensPluginStartDependencies) {
  const navigateToLensEditor = (embeddable: unknown) => {
    const stateTransferService = deps.embeddable.getStateTransfer();
    stateTransferService.navigateToEditor(lensVisTypeAlias.alias!.app, {
      path: lensVisTypeAlias.alias!.path,
      state: {
        originatingApp: apiHasAppContext(embeddable) ? embeddable.getAppContext().currentAppId : '',
        originatingPath: apiHasAppContext(embeddable)
          ? embeddable.getAppContext().getCurrentPath?.()
          : undefined,
        searchSessionId: deps.data.search.session.getSessionId(),
      },
    });
  };

  return {
    id: 'addLensPanelAction',
    getIconType: () => 'chartBarVertical',
    order: lensVisTypeAlias.order,
    isCompatible: async () => true,
    execute: async ({ embeddable, returnFocus }: EmbeddableApiContext) => {
      const isDashboard =
        apiIsPresentationContainer(embeddable) &&
        apiHasAppContext(embeddable) &&
        embeddable.getAppContext().currentAppId === 'dashboards';
      const attributes = isDashboard ? await getEmptyFormBasedAttributes(deps) : undefined;

      // Outside dashboards, or without a data view to start from, keep the full-page editor
      if (!isDashboard || !attributes) {
        navigateToLensEditor(embeddable);
        return;
      }

      const uuid = generateId();
      mountInlinePanel({
        core,
        api: embeddable,
        loadContent: async ({ closeFlyout } = { closeFlyout: () => {} }) => {
          const panel = await embeddable.addNewPanel<object, LensApi>({
            maybePanelId: uuid,
            panelType: LENS_EMBEDDABLE_TYPE,
            serializedState: { id: uuid, isNewPanel: true, attributes },
          });
          if (!panel) {
            throw new IncompatibleActionError();
          }
          return panel.getEditPanel?.({ closeFlyout });
        },
        options: { uuid, returnFocus },
      });
    },
    grouping: [ADD_PANEL_VISUALIZATION_GROUP],
    getDisplayName: () =>
      i18n.translate('xpack.lens.app.createVisualizationTitle', {
        defaultMessage: 'Create visualization',
      }),
    getDisplayNameTooltip: () =>
      i18n.translate('xpack.lens.app.createVisualizationTooltip', {
        defaultMessage: 'Build with the point-and-click editor',
      }),
  };
}
