/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useState } from 'react';
import { EuiLoadingChart, EuiPanel, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';

/** duration of one EuiLoadingChart bar bounce */
const BOUNCE_MS = 1000;

export const PanelLoader = (props: {
  showShadow?: boolean;
  showBorder?: boolean;
  dataTestSubj?: string;
}) => {
  const { euiTheme } = useEuiTheme();
  // POC: lock the bars' bounce to a page-wide clock. A panel shows several loaders in a row (embeddable
  // bootstrap, Lens, expression renderer); without this each one restarts the bounce, a visible hiccup.
  const [phaseMs] = useState(() => -Math.round(performance.now() % BOUNCE_MS));

  return (
    <EuiPanel
      css={css`
        z-index: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: $euiSizeL + 2px;
        position: relative;
        justify-content: center;
        align-items: center;
        border-radius: ${euiTheme.border.radius.control};
        ${Array.from(
          { length: 4 },
          (_, i) => `.euiLoadingChart > :nth-child(${i + 1}) { animation-delay: ${phaseMs + i * 100}ms; }`
        ).join('\n')}
      `}
      role="figure"
      paddingSize="none"
      hasShadow={props.showShadow}
      hasBorder={props.showBorder ?? false}
      data-test-subj={props.dataTestSubj}
    >
      <EuiLoadingChart size="l" />
    </EuiPanel>
  );
};
