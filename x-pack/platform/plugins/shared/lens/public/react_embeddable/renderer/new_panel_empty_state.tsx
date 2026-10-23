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
import type { LensRendererProps } from '@kbn/lens-common';
import type { TimeRange } from '@kbn/es-query';
import { LensRenderer } from './lens_custom_renderer_component';
import {
  newPanelEmptyStateVariant$,
  newPanelStarterRequest$,
} from './new_panel_empty_state_variant';
import { getSuggestionAttributes, type MiniChartId } from './prototype_chart_attributes';

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

const LineOverTimePreview = ({ vis }: PreviewProps) => {
  const points = '4,26 12,22 20,24 28,15 36,18 44,10 52,14 60,8';
  return (
    <>
      <polygon points={`4,36 ${points} 60,36`} fill={vis.euiColorVis0} opacity={0.15} />
      <polyline
        points={points}
        fill="none"
        stroke={vis.euiColorVis0}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

// PROTOTYPE: hardcoded for the Kibana Sample Data Logs, ordered by how often observability users
// reach for each chart. They should come from the suggestions API for the selected data view.
const SUGGESTIONS: Array<{
  id: MiniChartId;
  label: string;
  Preview: (props: PreviewProps) => React.JSX.Element;
}> = [
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
    id: 'responseSizeOverTime',
    label: i18n.translate('xpack.lens.newPanelEmptyState.responseSizeOverTime', {
      defaultMessage: 'Response size over time',
    }),
    Preview: LineOverTimePreview,
  },
  {
    id: 'topUrls',
    label: i18n.translate('xpack.lens.newPanelEmptyState.topUrls', {
      defaultMessage: 'Top 10 URLs',
    }),
    Preview: TopValuesPreview,
  },
];

// PROTOTYPE "Mini charts" direction: a real, non-interactive Lens chart as the card thumbnail
const MiniChart = ({
  id,
  attributes,
  timeRange,
}: {
  id: string;
  attributes: ReturnType<typeof getSuggestionAttributes>[MiniChartId];
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
      css={{ display: 'flex', height: '100%', overflow: 'auto' }}
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
  // PROTOTYPE: clicking a card applies its full chart to this panel's open flyout
  const onSelect = useMemo(() => {
    if (!dataViewId || !timeField) {
      return undefined;
    }
    const suggestions = getSuggestionAttributes(dataViewId, timeField, { thumbnail: false });
    return (id: MiniChartId) =>
      newPanelStarterRequest$.next({ panelId, attributes: suggestions[id] });
  }, [panelId, dataViewId, timeField]);

  if (variant === 'emptyPrompt') {
    return <EmptyPromptDirection />;
  }

  return <SuggestionsDirection miniCharts={miniCharts} timeRange={timeRange} onSelect={onSelect} />;
}

function SuggestionsDirection({
  miniCharts,
  timeRange,
  onSelect,
}: {
  miniCharts?: ReturnType<typeof getSuggestionAttributes>;
  timeRange?: TimeRange;
  onSelect?: (id: MiniChartId) => void;
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
          {SUGGESTIONS.map(({ id, label, Preview }) => (
            <li key={id}>
              <button
                type="button"
                css={styles.card}
                onClick={() => onSelect?.(id)}
                data-test-subj={`lnsNewPanelSuggestion-${id}`}
              >
                <span css={[styles.preview, miniCharts && styles.miniChartPreview]}>
                  {miniCharts ? (
                    <MiniChart id={id} attributes={miniCharts[id]} timeRange={timeRange} />
                  ) : (
                    <svg viewBox="0 0 64 40" width={72} height={45} aria-hidden="true">
                      <Preview vis={euiTheme.colors.vis} />
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
