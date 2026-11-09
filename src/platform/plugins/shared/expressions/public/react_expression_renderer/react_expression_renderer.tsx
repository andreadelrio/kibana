/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useEffect, useRef, useState } from 'react';
import { EuiProgress, useEuiTheme } from '@elastic/eui';
import { css, keyframes } from '@emotion/react';
import { PanelLoader } from '@kbn/panel-loader';
import type { ExpressionRenderError } from '../types';
import type { ExpressionRendererParams } from './use_expression_renderer';
import { useExpressionRenderer } from './use_expression_renderer';

// Accept all options of the runner as props except for the
// dom element which is provided by the component itself
export interface ReactExpressionRendererProps
  extends Omit<ExpressionRendererParams, 'hasCustomErrorRenderer'> {
  className?: string;
  dataAttrs?: string[];
  renderError?: (
    message?: string | null,
    error?: ExpressionRenderError | null
  ) => React.ReactElement | React.ReactElement[];
  padding?: 'xs' | 's' | 'm' | 'l' | 'xl';
  paddingTop?: boolean;
}

export type ReactExpressionRendererType = React.ComponentType<ReactExpressionRendererProps>;
export type ExpressionRendererComponent = React.FC<ReactExpressionRendererProps>;

export function ReactExpressionRenderer({
  className,
  dataAttrs,
  padding,
  paddingTop = true,
  renderError,
  abortController,
  ...expressionRendererOptions
}: ReactExpressionRendererProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const { euiTheme } = useEuiTheme();
  const { error, isEmpty, isLoading } = useExpressionRenderer(nodeRef, {
    ...expressionRendererOptions,
    abortController,
    hasCustomErrorRenderer: !!renderError,
  });

  // POC: keep the loader up until the first render (data arrives, and the panel stops being empty, before
  // the visualization has drawn), then fade it out over the chart instead of swapping it away.
  // A chart whose entrance animation waits for its turn (elastic-charts marks it with
  // `data-ech-entrance="pending"`) keeps the loader up until that entrance starts.
  const [hasRendered, setHasRendered] = useState(false);
  const [loaderExiting, setLoaderExiting] = useState(false);
  const firstRenderDone = !hasRendered && !isEmpty && !isLoading;
  useEffect(() => {
    const node = nodeRef.current;
    if (!firstRenderDone || !node) return;
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setHasRendered(true);
      setLoaderExiting(true);
    };
    const pendingEntrances = () => node.querySelector(`[${ENTRANCE_PENDING_ATTRIBUTE}="pending"]`);
    const onEntranceStart = () => {
      if (!pendingEntrances()) reveal();
    };
    node.addEventListener(ENTRANCE_START_EVENT, onEntranceStart);
    // the chart registers its entrance while it draws, so look on the next frame
    const raf = requestAnimationFrame(onEntranceStart);
    const fallback = setTimeout(reveal, ENTRANCE_WAIT_MAX_MS);
    return () => {
      node.removeEventListener(ENTRANCE_START_EVENT, onEntranceStart);
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [firstRenderDone]);
  useEffect(() => {
    if (!loaderExiting) return;
    const timer = setTimeout(() => setLoaderExiting(false), LOADER_FADE_MS);
    return () => clearTimeout(timer);
  }, [loaderExiting]);

  return (
    <div {...dataAttrs} className={className} css={styles}>
      {isEmpty && <PanelLoader />}
      {!isEmpty && (!hasRendered || loaderExiting) && (
        <div css={hasRendered ? loaderExitStyles : loaderOverlayStyles} aria-hidden>
          <PanelLoader />
        </div>
      )}
      {/* POC: the progress bar is for reloads, where the previous render stays visible; on the first
          load the loader already says it's loading */}
      {isLoading && hasRendered && !loaderExiting && (
        <EuiProgress size="xs" color="accent" position="absolute" css={{ zIndex: 1 }} />
      )}
      {!isLoading && error && renderError?.(error.message, error)}
      <div
        className="expExpressionRenderer__expression"
        css={css({
          width: '100%',
          height: '100%',
          ...(padding ? { padding: euiTheme.size[padding] } : {}),
          ...(!paddingTop ? { paddingTop: 0 } : {}),
          ...(isEmpty || !!error ? { display: 'none' } : {}),
        })}
        ref={nodeRef}
      />
    </div>
  );
}

const LOADER_FADE_MS = 200;

// POC: mirrors elastic-charts' entrance coordinator (`entrance_coordinator.ts`); hard-coded to keep this
// plugin free of a charts dependency
const ENTRANCE_PENDING_ATTRIBUTE = 'data-ech-entrance';
const ENTRANCE_START_EVENT = 'echEntranceStart';
/** never hold the loader longer than this for an entrance that doesn't start */
const ENTRANCE_WAIT_MAX_MS = 2000;

const loaderFadeOut = keyframes({ from: { opacity: 1 }, to: { opacity: 0 } });

const loaderOverlay = {
  position: 'absolute',
  inset: 0,
  // above the chart, whose legend and tooltips stack at 1
  zIndex: 2,
  display: 'flex',
  pointerEvents: 'none',
} as const;

const loaderOverlayStyles = css(loaderOverlay);

const loaderExitStyles = css({
  ...loaderOverlay,
  animation: `${loaderFadeOut} ${LOADER_FADE_MS}ms ease-out forwards`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0 },
});

const styles = css({
  position: 'relative',
  display: 'flex',
  width: '100%',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
});
