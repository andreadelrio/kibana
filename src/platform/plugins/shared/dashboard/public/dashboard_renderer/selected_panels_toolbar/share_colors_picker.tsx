/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCheckableCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiText,
  EuiTitle,
  useGeneratedHtmlId,
  type UseEuiTheme,
  useEuiTheme,
} from '@elastic/eui';
import {
  AreaSeries,
  BarSeries,
  Chart,
  LineSeries,
  ScaleType,
  Settings,
  Tooltip,
  TooltipType,
  type PartialTheme,
} from '@elastic/charts';
import { i18n } from '@kbn/i18n';
import { useMemoCss } from '@kbn/css-utils/public/use_memo_css';
import { getColorsFromMapping } from '@kbn/coloring';
import { useKbnPalettes } from '@kbn/palettes';
import type { PanelMiniChart } from './describe_panel';

const isFocusVisible = (target: EventTarget) => {
  try {
    return (target as Element).matches(':focus-visible');
  } catch {
    return false;
  }
};

export interface ShareColorsPanelPreviewOption {
  id: string;
  /** the panel title, or "Untitled" */
  label: string;
  /** shows `label` as a placeholder rather than a name */
  isUntitled?: boolean;
  /** what the chart shows, below the label */
  description?: string;
  /** a capture of the rendered panel; the generated mini chart is used until it is available */
  thumbnailUrl?: string;
  miniChart: PanelMiniChart;
}

const strings = {
  getTitle: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.shareColors.title', {
      defaultMessage: 'Copy colors from which panel?',
    }),
  getDescription: (otherPanels: number) =>
    i18n.translate('dashboard.selectedPanelsToolbar.shareColors.description', {
      defaultMessage:
        'The other {otherPanels, plural, one {selected panel} other {# selected panels}} will use its color mapping.',
      values: { otherPanels },
    }),
  getCancel: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.shareColors.cancel', {
      defaultMessage: 'Cancel',
    }),
  getApply: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.shareColors.apply', {
      defaultMessage: 'Apply',
    }),
};

const fallbackSeries: PanelMiniChart['series'] = [
  {
    id: 'primary',
    data: [3, 6, 4, 8, 5, 9].map((value, x) => ({ x, value })),
  },
  {
    id: 'secondary',
    data: [6, 4, 7, 5, 8, 6].map((value, x) => ({ x, value })),
  },
];

const miniChartTheme: PartialTheme = {
  chartMargins: { left: 0, right: 0, top: 0, bottom: 0 },
  chartPaddings: { left: 0, right: 0, top: 0, bottom: 0 },
  background: { color: 'transparent' },
  scales: { barsPadding: 0.2 },
};

const MiniChart = ({
  chartType,
  colorMapping,
  paletteId,
  series,
  isHorizontal,
  isStacked,
  showPoints,
}: PanelMiniChart) => {
  const styles = useMemoCss(pickerStyles);
  const palettes = useKbnPalettes();
  const { colorMode, euiTheme } = useEuiTheme();
  const previewSeries = series.length ? series : fallbackSeries;
  const palette = palettes.get(paletteId);
  const colors = colorMapping
    ? getColorsFromMapping(palettes, colorMode === 'DARK', colorMapping)
    : Array.from({ length: previewSeries.length }, (_, index) =>
        palette.getColor(index % palette.colorCount)
      );
  const fallbackColors = [euiTheme.colors.vis.euiColorVis0, euiTheme.colors.vis.euiColorVis1];
  const getSeriesColor = (index: number) =>
    colors[index % colors.length] ?? fallbackColors[index % fallbackColors.length];

  const commonSeriesProps = {
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['value'] as string[],
  } as const;

  return (
    <div css={styles.miniChart} aria-hidden>
      <Chart>
        <Settings theme={miniChartTheme} showLegend={false} rotation={isHorizontal ? 90 : 0} />
        <Tooltip type={TooltipType.None} />
        {chartType === 'line' ? (
          <>
            {previewSeries.map(({ id, data }, index) => (
              <LineSeries
                {...commonSeriesProps}
                key={id}
                id={id}
                data={isStacked ? data.map((datum) => ({ ...datum, stack: 'all' })) : data}
                color={getSeriesColor(index)}
                stackAccessors={isStacked ? ['stack'] : undefined}
                lineSeriesStyle={{ point: { visible: showPoints ? 'always' : 'never' } }}
              />
            ))}
          </>
        ) : chartType === 'area' ? (
          <>
            {previewSeries.map(({ id, data }, index) => (
              <AreaSeries
                {...commonSeriesProps}
                key={id}
                id={id}
                data={isStacked ? data.map((datum) => ({ ...datum, stack: 'all' })) : data}
                color={getSeriesColor(index)}
                stackAccessors={isStacked ? ['stack'] : undefined}
                areaSeriesStyle={{ point: { visible: showPoints ? 'always' : 'never' } }}
              />
            ))}
          </>
        ) : (
          <>
            {previewSeries.map(({ id, data }, index) => (
              <BarSeries
                {...commonSeriesProps}
                key={id}
                id={id}
                data={isStacked ? data.map((datum) => ({ ...datum, stack: 'all' })) : data}
                color={getSeriesColor(index)}
                stackAccessors={isStacked ? ['stack'] : undefined}
              />
            ))}
          </>
        )}
      </Chart>
    </div>
  );
};

export const ShareColorsPicker = ({
  panels,
  onApply,
  onCancel,
  onPreviewChange,
}: {
  /** eligible source panels: selected Lens charts with color mapping */
  panels: ShareColorsPanelPreviewOption[];
  onApply: (sourcePanelId: string) => void;
  onCancel: () => void;
  /**
   * Called with the panel whose option is hovered or keyboard-focused (hover wins), or undefined,
   * so the dashboard can point at it. `fromKeyboard` lets the caller scroll it into view.
   */
  onPreviewChange?: (panelId: string | undefined, fromKeyboard: boolean) => void;
}) => {
  const styles = useMemoCss(pickerStyles);
  const titleId = useGeneratedHtmlId({ prefix: 'dashboardShareColorsTitle' });
  const [sourcePanelId, setSourcePanelId] = useState<string | undefined>();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // move focus into the question so keyboard and screen reader users land in the new content
  useEffect(() => {
    containerRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
  }, []);

  // which option points at a panel: hover takes precedence over keyboard focus
  const [hoveredId, setHoveredId] = useState<string | undefined>();
  const [focusedId, setFocusedId] = useState<string | undefined>();
  useEffect(() => {
    onPreviewChange?.(hoveredId ?? focusedId, hoveredId === undefined && focusedId !== undefined);
  }, [hoveredId, focusedId, onPreviewChange]);
  useEffect(() => () => onPreviewChange?.(undefined, false), [onPreviewChange]);

  return (
    <EuiFlyout
      onClose={onCancel}
      size={500}
      ownFocus
      aria-labelledby={titleId}
      data-test-subj="dashboardShareColorsPicker"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2 id={titleId}>{strings.getTitle()}</h2>
        </EuiTitle>
        <EuiText size="s" color="subdued">
          <p>{strings.getDescription(panels.length - 1)}</p>
        </EuiText>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <div
          ref={containerRef}
          role="radiogroup"
          aria-labelledby={titleId}
          onMouseLeave={() => setHoveredId(undefined)}
          data-test-subj="dashboardShareColorsSources"
        >
          {panels.map(({ id, label, isUntitled, description, thumbnailUrl, miniChart }) => (
            <div
              key={id}
              css={styles.option}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(undefined)}
              onFocus={(event) => setFocusedId(isFocusVisible(event.target) ? id : undefined)}
              onKeyUp={(event) => {
                if (isFocusVisible(event.target)) setFocusedId(id);
              }}
              onBlur={() => setFocusedId(undefined)}
            >
              <EuiCheckableCard
                id={id}
                name={`${titleId}-source`}
                checkableType="radio"
                checked={sourcePanelId === id}
                onChange={() => setSourcePanelId(id)}
                label={
                  <div css={styles.optionContent}>
                    <span css={styles.optionText}>
                      <EuiTitle size="xxs">
                        <h3 css={[styles.optionLabel, isUntitled && styles.untitled]}>{label}</h3>
                      </EuiTitle>
                      {description && (
                        <EuiText
                          size="xs"
                          color="subdued"
                          component="span"
                          css={styles.optionLabel}
                        >
                          {description}
                        </EuiText>
                      )}
                    </span>
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="" css={[styles.miniChart, styles.thumbnail]} />
                    ) : (
                      <MiniChart {...miniChart} />
                    )}
                  </div>
                }
                data-test-subj={`dashboardShareColorsSource-${id}`}
              />
            </div>
          ))}
        </div>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup gutterSize="s" justifyContent="flexEnd" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="s" onClick={onCancel} data-test-subj="dashboardShareColorsCancel">
              {strings.getCancel()}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              size="s"
              fill
              isDisabled={!sourcePanelId}
              onClick={() => sourcePanelId && onApply(sourcePanelId)}
              data-test-subj="dashboardShareColorsApply"
            >
              {strings.getApply()}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};

const pickerStyles = {
  option: ({ euiTheme }: UseEuiTheme) => ({
    marginBlockEnd: euiTheme.size.m,
  }),
  optionContent: ({ euiTheme }: UseEuiTheme) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch' as const,
    gap: euiTheme.size.s,
    width: '100%',
  }),
  optionText: ({ euiTheme }: UseEuiTheme) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    gap: euiTheme.size.xs,
    minWidth: 0,
  }),
  miniChart: ({ euiTheme }: UseEuiTheme) => ({
    width: '100%',
    height: 120,
    overflow: 'hidden',
    borderRadius: euiTheme.border.radius.small,
    backgroundColor: euiTheme.colors.backgroundBaseSubdued,
  }),
  thumbnail: {
    display: 'block',
    objectFit: 'contain' as const,
  },
  untitled: ({ euiTheme }: UseEuiTheme) => ({
    color: euiTheme.colors.textSubdued,
  }),
  // long names wrap instead of widening the toolbar
  optionLabel: {
    display: 'block',
    overflowWrap: 'anywhere' as const,
  },
};
