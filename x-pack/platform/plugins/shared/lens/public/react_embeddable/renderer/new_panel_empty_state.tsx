/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { css } from '@emotion/react';
import {
  EuiEmptyPrompt,
  EuiIllustration,
  EuiText,
  EuiTitle,
  euiCanAnimate,
  euiFocusRing,
  useEuiShadow,
  useEuiTheme,
  type UseEuiTheme,
} from '@elastic/eui';
// eslint-disable-next-line @kbn/eslint/no_viz_naming -- export name from @elastic/eui-illustrations
import { searchAnalyticsDataviz } from '@elastic/eui-illustrations';
import { i18n } from '@kbn/i18n';
import type { DataView } from '@kbn/data-views-plugin/public';
import type { LensRendererProps, LensSerializedState } from '@kbn/lens-common';
import type { TimeRange } from '@kbn/es-query';
import { LensRenderer } from './lens_custom_renderer_component';
import {
  newPanelEmptyStateVariant$,
  newPanelStarterRequest$,
} from './new_panel_empty_state_variant';
import {
  getGenericSuggestionAttributes,
  getSuggestionAttributes,
  type GenericSuggestionId,
  type MiniChartId,
} from './prototype_chart_attributes';

type PreviewProps = Pick<UseEuiTheme['euiTheme']['colors'], 'vis'>;

// Small, static previews. Each draws in a 64x40 box and only uses the theme's vis palette.
const StackedBarsOverTimePreview = ({ vis }: PreviewProps) => {
  const stacks = [
    [9, 3, 1],
    [12, 4, 2],
    [8, 3, 1],
    [15, 5, 3],
    [11, 6, 2],
    [17, 4, 4],
    [13, 5, 2],
  ];
  const colors = [vis.euiColorVis0, vis.euiColorVis1, vis.euiColorVis2];
  return (
    <>
      {stacks.map((stack, i) => {
        let y = 36;
        return stack.map((h, j) => {
          y -= h;
          return (
            <rect key={`${i}-${j}`} x={5 + i * 8} y={y} width={6} height={h} fill={colors[j]} />
          );
        });
      })}
    </>
  );
};

const MetricPreview = ({ vis }: PreviewProps) => (
  <>
    <text
      x={32}
      y={27}
      textAnchor="middle"
      fontSize={22}
      fontWeight={700}
      fill={vis.euiColorVis0}
      fontFamily="inherit"
    >
      42
    </text>
    <rect x={22} y={32} width={20} height={3} rx={1.5} fill={vis.euiColorVis0} opacity={0.35} />
  </>
);

const TablePreview = ({ vis }: PreviewProps) => {
  const rows = [0, 1, 2, 3];
  return (
    <>
      <rect x={4} y={4} width={56} height={7} rx={1.5} fill={vis.euiColorVis0} opacity={0.35} />
      {rows.map((row) => {
        const y = 15 + row * 6.5;
        return (
          <React.Fragment key={row}>
            <rect x={6} y={y} width={22 - row * 3} height={3} rx={1} fill={vis.euiColorVis0} />
            <rect x={36} y={y} width={8} height={3} rx={1} fill={vis.euiColorVis0} opacity={0.6} />
            <rect x={48} y={y} width={10} height={3} rx={1} fill={vis.euiColorVis0} opacity={0.6} />
            <rect
              x={4}
              y={y + 4.75}
              width={56}
              height={0.5}
              fill={vis.euiColorVis0}
              opacity={0.2}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

const TopValuesPreview = ({ vis }: PreviewProps) => {
  const widths = [52, 40, 31, 22, 14];
  return (
    <>
      {widths.map((w, i) => (
        <rect key={i} x={6} y={5 + i * 6.5} width={w} height={4.5} rx={1} fill={vis.euiColorVis0} />
      ))}
    </>
  );
};

// PROTOTYPE "Suggestions v1" previews: miniature panels drawn to look like the real Lens chart
// (same layout, text colors and borders), in a 120x60 box. The numbers are made up.
type PanelPreviewProps = PreviewProps & { colors: UseEuiTheme['euiTheme']['colors'] };

const PLOT = { left: 16, right: 116, top: 6, bottom: 48 };

const PanelAxes = ({ colors }: PanelPreviewProps) => {
  const gridYs = [PLOT.top, 20, 34];
  return (
    <>
      {gridYs.map((y) => (
        <React.Fragment key={y}>
          <line
            x1={PLOT.left}
            x2={PLOT.right}
            y1={y}
            y2={y}
            stroke={colors.borderBaseSubdued}
            strokeWidth={0.5}
          />
          <rect
            x={4}
            y={y - 1.25}
            width={8}
            height={2}
            rx={1}
            fill={colors.textDisabled}
            opacity={0.5}
          />
        </React.Fragment>
      ))}
      <rect
        x={4}
        y={PLOT.bottom - 1.25}
        width={8}
        height={2}
        rx={1}
        fill={colors.textDisabled}
        opacity={0.5}
      />
      <line
        x1={PLOT.left}
        x2={PLOT.right}
        y1={PLOT.bottom}
        y2={PLOT.bottom}
        stroke={colors.borderBasePlain}
        strokeWidth={0.75}
      />
      {[24, 50, 76, 102].map((x) => (
        <rect
          key={x}
          x={x - 7}
          y={52.5}
          width={14}
          height={2}
          rx={1}
          fill={colors.textDisabled}
          opacity={0.5}
        />
      ))}
    </>
  );
};

const COUNT_SERIES = [18, 24, 21, 30, 26, 34, 29, 22, 31, 38, 33, 27];

const toPlotY = (value: number) => PLOT.bottom - (value / 42) * (PLOT.bottom - PLOT.top);

const LinePanelPreview = (props: PanelPreviewProps) => {
  const step = (PLOT.right - PLOT.left - 4) / (COUNT_SERIES.length - 1);
  const points = COUNT_SERIES.map((v, i) => `${PLOT.left + 2 + i * step},${toPlotY(v)}`).join(' ');
  return (
    <>
      <PanelAxes {...props} />
      <polyline
        points={points}
        fill="none"
        stroke={props.vis.euiColorVis0}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </>
  );
};

const BarPanelPreview = (props: PanelPreviewProps) => {
  const slot = (PLOT.right - PLOT.left) / COUNT_SERIES.length;
  return (
    <>
      <PanelAxes {...props} />
      {COUNT_SERIES.map((v, i) => (
        <rect
          key={i}
          x={PLOT.left + i * slot + slot * 0.15}
          y={toPlotY(v)}
          width={slot * 0.7}
          height={PLOT.bottom - toPlotY(v)}
          fill={props.vis.euiColorVis0}
        />
      ))}
    </>
  );
};

// Lens metric: title top left, large value bottom right, both in the default text color
const MetricPanelPreview = ({ colors }: PanelPreviewProps) => (
  <>
    <text x={5} y={11} fontSize={7} fontWeight={600} fill={colors.textHeading} fontFamily="inherit">
      Total requests
    </text>
    <text
      x={115}
      y={54}
      textAnchor="end"
      fontSize={24}
      fontWeight={500}
      fill={colors.textHeading}
      fontFamily="inherit"
    >
      14,074
    </text>
  </>
);

// Lens datatable: shaded header, a row per date, counts right aligned
const TablePanelPreview = ({ colors }: PanelPreviewProps) => {
  const rows = [
    ['Nov 10, 12:00', '1,284'],
    ['Nov 10, 13:00', '967'],
    ['Nov 10, 14:00', '1,412'],
    ['Nov 10, 15:00', '1,108'],
  ];
  const headerHeight = 11;
  const rowHeight = 12;
  return (
    <>
      <rect x={0} y={0} width={120} height={headerHeight} fill={colors.backgroundBaseSubdued} />
      <g fontSize={5.5} fontWeight={600} fill={colors.textHeading} fontFamily="inherit">
        <text x={4} y={7.5}>
          timestamp per hour
        </text>
        <text x={116} y={7.5} textAnchor="end">
          Count of records
        </text>
      </g>
      {rows.map(([date, count], i) => {
        const top = headerHeight + i * rowHeight;
        return (
          <React.Fragment key={date}>
            <line
              x1={0}
              x2={120}
              y1={top + rowHeight}
              y2={top + rowHeight}
              stroke={colors.borderBaseSubdued}
              strokeWidth={0.5}
            />
            <g fontSize={5.5} fill={colors.textParagraph} fontFamily="inherit">
              <text x={4} y={top + 7.75}>
                {date}
              </text>
              <text x={116} y={top + 7.75} textAnchor="end">
                {count}
              </text>
            </g>
          </React.Fragment>
        );
      })}
    </>
  );
};

interface SuggestionCard<Id extends string = string> {
  id: Id;
  label: string;
  Preview: (props: PanelPreviewProps) => React.JSX.Element;
  /** Draw the preview as a miniature panel (plain background, border, fills the card) */
  panel?: boolean;
}

// PROTOTYPE: hardcoded for the Kibana Sample Data Logs, ordered by how often observability users
// reach for each chart. They should come from the suggestions API for the selected data view.
const SUGGESTIONS: Array<SuggestionCard<MiniChartId>> = [
  {
    id: 'requestsOverTime',
    label: i18n.translate('xpack.lens.newPanelEmptyState.requestsOverTime', {
      defaultMessage: 'Requests by response code',
    }),
    Preview: StackedBarsOverTimePreview,
  },
  {
    id: 'serverErrors',
    label: i18n.translate('xpack.lens.newPanelEmptyState.serverErrors', {
      defaultMessage: '5xx errors',
    }),
    Preview: MetricPreview,
  },
  {
    id: 'trafficByHost',
    label: i18n.translate('xpack.lens.newPanelEmptyState.trafficByHost', {
      defaultMessage: 'Traffic by host',
    }),
    Preview: TablePreview,
  },
  {
    id: 'topUrls',
    label: i18n.translate('xpack.lens.newPanelEmptyState.topUrls', {
      defaultMessage: 'Top 10 URLs',
    }),
    Preview: TopValuesPreview,
  },
];

// PROTOTYPE "Suggestions v1" direction: generic starters built only from the time field and the
// record count, which every time-based data view has
const GENERIC_SUGGESTIONS: Array<SuggestionCard<GenericSuggestionId>> = [
  {
    id: 'countOverTime',
    label: i18n.translate('xpack.lens.newPanelEmptyState.generic.countOverTime', {
      defaultMessage: 'Requests over time',
    }),
    Preview: LinePanelPreview,
    panel: true,
  },
  {
    id: 'totalCount',
    label: i18n.translate('xpack.lens.newPanelEmptyState.generic.totalCount', {
      defaultMessage: 'Total requests',
    }),
    Preview: MetricPanelPreview,
    panel: true,
  },
  {
    id: 'countTable',
    label: i18n.translate('xpack.lens.newPanelEmptyState.generic.countTable', {
      defaultMessage: 'Requests by date',
    }),
    Preview: TablePanelPreview,
    panel: true,
  },
  {
    id: 'countBars',
    label: i18n.translate('xpack.lens.newPanelEmptyState.generic.countBars', {
      defaultMessage: 'Request volume',
    }),
    Preview: BarPanelPreview,
    panel: true,
  },
];

// PROTOTYPE "Mini charts" direction: a real, non-interactive Lens chart as the card thumbnail
const MiniChart = ({
  id,
  attributes,
  timeRange,
}: {
  id: string;
  attributes: LensSerializedState['attributes'];
  timeRange?: TimeRange;
}) => (
  <span css={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none' }}>
    <LensRenderer
      id={`lnsNewPanelMiniChart-${id}`}
      attributes={attributes as LensRendererProps['attributes']}
      timeRange={timeRange}
      viewMode="view"
      disableTriggers
      hidePanelTitles
      withDefaultActions={false}
      syncTooltips={false}
      syncCursor={false}
      noPadding
      style={{ height: '100%' }}
    />
  </span>
);

// PROTOTYPE "Empty prompt" direction: no suggestions, just an illustration and a pointer to the editor
const EmptyPromptDirection = () => {
  const { euiTheme } = useEuiTheme();
  return (
    <div
      css={{ display: 'flex', width: '100%', height: '100%', overflow: 'auto' }}
      data-test-subj="lnsNewPanelEmptyState"
    >
      <EuiEmptyPrompt
        icon={
          <EuiIllustration
            // eslint-disable-next-line @kbn/eslint/no_viz_naming -- export name from @elastic/eui-illustrations
            type={searchAnalyticsDataviz}
            alt=""
            fullWidth={false}
            css={{ inlineSize: euiTheme.base * 8 }}
          />
        }
        title={
          <h2>
            {i18n.translate('xpack.lens.newPanelEmptyState.emptyPrompt.title', {
              defaultMessage: 'Start building your visualization',
            })}
          </h2>
        }
        titleSize="xs"
        body={
          <p css={{ textWrap: 'balance' }}>
            {i18n.translate('xpack.lens.newPanelEmptyState.emptyPrompt.body', {
              defaultMessage: 'Add fields in the editor and your chart will appear here.',
            })}
          </p>
        }
      />
    </div>
  );
};

export function NewPanelEmptyState({
  panelId,
  dataView,
  timeRange,
}: {
  panelId: string;
  dataView?: DataView;
  timeRange?: TimeRange;
}) {
  const variant = useObservable(newPanelEmptyStateVariant$, newPanelEmptyStateVariant$.getValue());
  const dataViewId = dataView?.id;
  const timeField = dataView?.timeFieldName;
  const miniCharts = useMemo(
    () =>
      variant === 'miniCharts' && dataViewId && timeField
        ? getSuggestionAttributes(dataViewId, timeField, { thumbnail: true })
        : undefined,
    [variant, dataViewId, timeField]
  );
  const isGeneric = variant === 'suggestionsV1';
  // PROTOTYPE: clicking a card applies its full chart to this panel's open flyout
  const onSelect = useMemo(() => {
    if (!dataViewId || !timeField) {
      return undefined;
    }
    const suggestions: Record<string, LensSerializedState['attributes']> = isGeneric
      ? getGenericSuggestionAttributes(dataViewId, timeField)
      : getSuggestionAttributes(dataViewId, timeField, { thumbnail: false });
    return (id: string) => newPanelStarterRequest$.next({ panelId, attributes: suggestions[id] });
  }, [panelId, dataViewId, timeField, isGeneric]);

  if (variant === 'emptyPrompt') {
    return <EmptyPromptDirection />;
  }

  return (
    <SuggestionsDirection
      suggestions={isGeneric ? GENERIC_SUGGESTIONS : SUGGESTIONS}
      miniCharts={miniCharts}
      timeRange={timeRange}
      onSelect={onSelect}
    />
  );
}

function SuggestionsDirection({
  suggestions,
  miniCharts,
  timeRange,
  onSelect,
}: {
  suggestions: SuggestionCard[];
  miniCharts?: Record<string, LensSerializedState['attributes']>;
  timeRange?: TimeRange;
  onSelect?: (id: string) => void;
}) {
  const euiThemeContext = useEuiTheme();
  const { euiTheme } = euiThemeContext;
  const hoverShadow = useEuiShadow('s');

  const styles = {
    container: css`
      container-type: inline-size;
      display: flex;
      width: 100%;
      height: 100%;
      overflow: auto;
      padding: ${euiTheme.size.l};
    `,
    content: css`
      margin: auto;
      max-width: 600px;
      width: 100%;
    `,
    grid: css`
      list-style: none;
      margin: ${euiTheme.size.l} 0 0;
      padding: 0;
      display: grid;
      gap: ${euiTheme.size.s};
      grid-template-columns: repeat(2, minmax(0, 1fr));

      @container (min-width: 640px) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    `,
    card: css`
      display: flex;
      flex-direction: column;
      gap: ${euiTheme.size.s};
      width: 100%;
      height: 100%;
      padding: ${euiTheme.size.s};
      background: ${euiTheme.colors.backgroundBasePlain};
      border: ${euiTheme.border.thin};
      border-radius: ${euiTheme.border.radius.medium};
      text-align: center;
      cursor: pointer;

      ${euiCanAnimate} {
        transition: border-color ${euiTheme.animation.fast} ease-out,
          box-shadow ${euiTheme.animation.fast} ease-out,
          transform ${euiTheme.animation.fast} ease-out;
      }

      &:hover {
        border-color: ${euiTheme.colors.borderStrongPrimary};
        ${hoverShadow};
        ${euiCanAnimate} {
          transform: translateY(-1px);
        }
      }

      &:active {
        transform: none;
      }

      &:focus-visible {
        ${euiFocusRing(euiThemeContext, 'outset')};
        border-color: ${euiTheme.colors.borderStrongPrimary};
      }
    `,
    label: css`
      width: 100%;
      padding: 0 ${euiTheme.size.xs} ${euiTheme.size.xxs};
      text-wrap: balance;
    `,
    // Real charts need more room than the static thumbnails, and a plain background like a panel
    miniChartPreview: css`
      height: ${euiTheme.base * 6}px;
      padding: ${euiTheme.size.xs};
      background: ${euiTheme.colors.backgroundBasePlain};
      border: ${euiTheme.border.thin};
      overflow: hidden;
    `,
    // Miniature panel: keeps the 2:1 drawing undistorted at any card width
    panelPreview: css`
      height: auto;
      aspect-ratio: 2 / 1;
      background: ${euiTheme.colors.backgroundBasePlain};
      border: ${euiTheme.border.thin};
      overflow: hidden;
    `,
    preview: css`
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      height: ${euiTheme.size.xxxxl};
      background: ${euiTheme.colors.backgroundBaseSubdued};
      border-radius: ${euiTheme.border.radius.small};
    `,
  };

  return (
    <div css={styles.container} data-test-subj="lnsNewPanelEmptyState">
      <div css={styles.content}>
        <EuiTitle size="xs">
          <h2 css={{ textAlign: 'center' }}>
            {i18n.translate('xpack.lens.newPanelEmptyState.title', {
              defaultMessage: 'What do you want to visualize?',
            })}
          </h2>
        </EuiTitle>
        <EuiText
          size="s"
          color="subdued"
          textAlign="center"
          css={{ marginTop: euiTheme.size.xs, textWrap: 'balance' }}
        >
          <p>
            {i18n.translate('xpack.lens.newPanelEmptyState.description', {
              defaultMessage: 'Pick a suggested chart, or build your own in the editor.',
            })}
          </p>
        </EuiText>
        <ul css={styles.grid}>
          {suggestions.map(({ id, label, Preview, panel }) => (
            <li key={id}>
              <button
                type="button"
                css={styles.card}
                onClick={() => onSelect?.(id)}
                data-test-subj={`lnsNewPanelSuggestion-${id}`}
              >
                <span
                  css={[
                    styles.preview,
                    miniCharts && styles.miniChartPreview,
                    panel && styles.panelPreview,
                  ]}
                >
                  {miniCharts ? (
                    <MiniChart id={id} attributes={miniCharts[id]} timeRange={timeRange} />
                  ) : panel ? (
                    <svg viewBox="0 0 120 60" width="100%" height="100%" aria-hidden="true">
                      <Preview vis={euiTheme.colors.vis} colors={euiTheme.colors} />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 64 40" width={72} height={45} aria-hidden="true">
                      <Preview vis={euiTheme.colors.vis} colors={euiTheme.colors} />
                    </svg>
                  )}
                </span>
                <EuiText size="xs" css={styles.label}>
                  <strong>{label}</strong>
                </EuiText>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
