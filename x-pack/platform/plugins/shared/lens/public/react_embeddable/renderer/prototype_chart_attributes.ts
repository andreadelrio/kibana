/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { LensSerializedState } from '@kbn/lens-common';
import { createEmptyLensState } from '../helper';

/**
 * PROTOTYPE: hand-built, form-based Lens documents for the new-panel empty state directions.
 * Field names target the Kibana Sample Data Logs; in a real version these would come from
 * the suggestions API for the selected data view.
 */

type Attributes = LensSerializedState['attributes'];
type Column = Record<string, unknown>;

const dateHistogram = (timeField: string, includeEmptyRows = true): Column => ({
  label: timeField,
  dataType: 'date',
  operationType: 'date_histogram',
  sourceField: timeField,
  isBucketed: true,
  scale: 'interval',
  params: { interval: 'auto', includeEmptyRows, dropPartials: false },
});

const count = (extra: Column = {}): Column => ({
  label: 'Count of records',
  dataType: 'number',
  operationType: 'count',
  sourceField: '___records___',
  isBucketed: false,
  scale: 'ratio',
  // An empty time bucket has zero records, not a missing value
  params: { emptyAsNull: false },
  ...extra,
});

const averageBytes = (): Column => ({
  label: 'Average of bytes',
  dataType: 'number',
  operationType: 'average',
  sourceField: 'bytes',
  isBucketed: false,
  scale: 'ratio',
  params: { emptyAsNull: true, format: { id: 'bytes', params: { decimals: 0 } } },
});

const topValues = (field: string, size: number, orderByColumnId: string): Column => ({
  label: `Top ${size} values of ${field}`,
  dataType: 'string',
  operationType: 'terms',
  sourceField: field,
  isBucketed: true,
  scale: 'ordinal',
  params: {
    size,
    orderBy: { type: 'column', columnId: orderByColumnId },
    orderDirection: 'desc',
    otherBucket: false,
    missingBucket: false,
    parentFormat: { id: 'terms' },
  },
});

const formBasedDocument = ({
  dataViewId,
  visualizationType,
  columns,
  visualization,
}: {
  dataViewId: string;
  visualizationType: string;
  columns: Record<string, Column>;
  visualization: Record<string, unknown>;
}): Attributes => {
  const { attributes } = createEmptyLensState(visualizationType);
  return {
    ...attributes,
    references: [
      { type: 'index-pattern', id: dataViewId, name: 'indexpattern-datasource-layer-layer1' },
    ],
    state: {
      ...attributes.state,
      datasourceStates: {
        formBased: {
          layers: {
            // Lens expects bucketed columns (x axis, breakdown) before metrics
            layer1: {
              columns,
              columnOrder: Object.keys(columns).sort(
                (a, b) =>
                  Number(Boolean(columns[b].isBucketed)) - Number(Boolean(columns[a].isBucketed))
              ),
            },
          },
        },
      },
      visualization,
    },
  } as Attributes;
};

const HIDDEN_AXES = { x: false, yLeft: false, yRight: false };
const xyVisualization = (layer: Record<string, unknown>, thumbnail: boolean) => ({
  // Thumbnails drop the legend, axes, gridlines and titles; applied charts keep Lens defaults
  legend: { isVisible: !thumbnail && Boolean(layer.splitAccessor), position: 'right' },
  valueLabels: 'hide',
  preferredSeriesType: layer.seriesType,
  ...(thumbnail
    ? {
        gridlinesVisibilitySettings: HIDDEN_AXES,
        tickLabelsVisibilitySettings: HIDDEN_AXES,
        axisTitlesVisibilitySettings: HIDDEN_AXES,
      }
    : {}),
  layers: [{ layerId: 'layer1', layerType: 'data', ...layer }],
});

export type MiniChartId = 'requestsOverTime' | 'serverErrors' | 'responseSizeOverTime' | 'topUrls';

/**
 * The four suggested starter charts. `thumbnail` strips the chrome for the "Mini charts" card
 * previews; without it, they're the full charts applied to the panel when a card is clicked.
 */
export const getSuggestionAttributes = (
  dataViewId: string,
  timeField: string,
  { thumbnail }: { thumbnail: boolean }
): Record<MiniChartId, Attributes> => ({
  requestsOverTime: formBasedDocument({
    dataViewId,
    visualizationType: 'lnsXY',
    columns: {
      x: dateHistogram(timeField),
      y: count(),
      split: topValues('response.keyword', 3, 'y'),
    },
    visualization: xyVisualization(
      { seriesType: 'bar_stacked', xAccessor: 'x', accessors: ['y'], splitAccessor: 'split' },
      thumbnail
    ),
  }),
  serverErrors: formBasedDocument({
    dataViewId,
    visualizationType: 'lnsMetric',
    columns: {
      y: count({
        label: '5xx errors',
        customLabel: true,
        filter: { language: 'kuery', query: 'response.keyword >= 500' },
      }),
    },
    visualization: {
      layerId: 'layer1',
      layerType: 'data',
      metricAccessor: 'y',
    },
  }),
  responseSizeOverTime: formBasedDocument({
    dataViewId,
    visualizationType: 'lnsXY',
    // An average has no value for an empty bucket, so skip empty buckets instead of plotting nulls
    columns: { x: dateHistogram(timeField, false), y: averageBytes() },
    visualization: xyVisualization(
      { seriesType: 'area', xAccessor: 'x', accessors: ['y'] },
      thumbnail
    ),
  }),
  topUrls: formBasedDocument({
    dataViewId,
    visualizationType: 'lnsXY',
    columns: { x: topValues('url.keyword', 10, 'y'), y: count() },
    visualization: xyVisualization(
      { seriesType: 'bar_horizontal', xAccessor: 'x', accessors: ['y'] },
      thumbnail
    ),
  }),
});

/**
 * "Default time series" direction: a new panel starts as a real count-over-time chart, so the
 * dashboard shows data right away and the flyout opens with both axes filled in.
 */
export const getCountOverTimeAttributes = (dataViewId: string, timeField: string): Attributes =>
  formBasedDocument({
    dataViewId,
    visualizationType: 'lnsXY',
    columns: { x: dateHistogram(timeField), y: count() },
    visualization: {
      legend: { isVisible: true, position: 'right' },
      valueLabels: 'hide',
      preferredSeriesType: 'bar_stacked',
      layers: [
        {
          layerId: 'layer1',
          layerType: 'data',
          seriesType: 'bar_stacked',
          xAccessor: 'x',
          accessors: ['y'],
        },
      ],
    },
  });

/** Empty stacked bar chart, so the flyout opens with the axis and breakdown dimensions to fill. */
export const getEmptyStarterAttributes = (dataViewId: string): Attributes =>
  formBasedDocument({
    dataViewId,
    visualizationType: 'lnsXY',
    columns: {},
    visualization: {
      legend: { isVisible: true, position: 'right' },
      valueLabels: 'hide',
      preferredSeriesType: 'bar_stacked',
      layers: [{ layerId: 'layer1', layerType: 'data', seriesType: 'bar_stacked', accessors: [] }],
    },
  });

/**
 * Starter document for a new panel in the given direction: a count-over-time chart for
 * "Default time series", otherwise the empty starter chart. Undefined without a usable data view.
 */
export const getNewPanelStarterAttributes = (
  dataView: { id?: string; timeFieldName?: string } | null | undefined,
  variant: string
): Attributes | undefined => {
  if (!dataView?.id) {
    return;
  }
  return variant === 'defaultTimeSeries' && dataView.timeFieldName
    ? getCountOverTimeAttributes(dataView.id, dataView.timeFieldName)
    : getEmptyStarterAttributes(dataView.id);
};
