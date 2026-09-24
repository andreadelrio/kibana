/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useMemo } from 'react';
import { css } from '@emotion/react';
import { EuiFlexGroup, EuiFlexItem, useEuiTheme } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { useKeyboardShortcutHighlight } from './keyboard_shortcut_highlight_context';

export const DashboardKeyboardShortcuts = () => {
  const { euiTheme } = useEuiTheme();
  const { highlightedAction } = useKeyboardShortcutHighlight();

  const listItems = useMemo(
    () => [
      {
        id: 'selection' as const,
        title: (
          <kbd>
            {i18n.translate('dashboard.keyboardShortcuts.shiftKey', {
              defaultMessage: 'Shift',
            })}
          </kbd>
        ),
        description: i18n.translate('dashboard.keyboardShortcuts.selection', {
          defaultMessage: 'Selection',
        }),
      },
      {
        id: 'copy' as const,
        title: (
          <>
            <kbd>Cmd C</kbd>
          </>
        ),
        description: i18n.translate('dashboard.keyboardShortcuts.copy', {
          defaultMessage: 'Copy',
        }),
      },
      {
        id: 'paste' as const,
        title: (
          <>
            <kbd>Cmd V</kbd>
          </>
        ),
        description: i18n.translate('dashboard.keyboardShortcuts.paste', {
          defaultMessage: 'Paste',
        }),
      },
      {
        id: 'undo' as const,
        title: (
          <>
            <kbd>Cmd Z</kbd>
          </>
        ),
        description: i18n.translate('dashboard.keyboardShortcuts.undo', {
          defaultMessage: 'Undo',
        }),
      },
      {
        id: 'drag' as const,
        title: (
          <kbd>
            {i18n.translate('dashboard.keyboardShortcuts.drag', {
              defaultMessage: 'Drag',
            })}
          </kbd>
        ),
        description: i18n.translate('dashboard.keyboardShortcuts.areaSelection', {
          defaultMessage: 'Area selection',
        }),
      },
    ],
    []
  );

  const panelStyles = useMemo(
    () => css`
      position: fixed;
      bottom: 5px;
      left: 50%;
      transform: translateX(-50%);
      z-index: ${euiTheme.levels.flyout};
      padding: ${euiTheme.size.s} ${euiTheme.size.m};
      background: ${euiTheme.colors.emptyShade};
      border: 0px solid ${euiTheme.border.color};
      border-radius: ${euiTheme.border.radius.medium};

      kbd {
        display: inline-block;
        padding: ${euiTheme.size.xs} ${euiTheme.size.s};
        margin: 0 ${euiTheme.size.xxs};
        font-family: ${euiTheme.font.familyCode};
        font-size: ${euiTheme.font.scale.s};
        font-weight: ${euiTheme.font.weight.medium};
        line-height: 1;
        color: ${euiTheme.colors.textSubdued};
        background: ${euiTheme.colors.backgroundBaseSubdued};
        border: 1px solid ${euiTheme.border.color};
        border-radius: ${euiTheme.border.radius.small};
        box-shadow: 0 1px 0 ${euiTheme.colors.lightShade};
      }
      kbd:first-of-type {
        margin-left: 0;
      }
    `,
    [euiTheme]
  );

  const itemStyles = useMemo(
    () => css`
      font-size: ${euiTheme.font.scale.s};
      color: ${euiTheme.colors.textSubdued};
      white-space: nowrap;
    `,
    [euiTheme]
  );

  const itemHighlightStyles = useMemo(
    () => css`
      color: ${euiTheme.colors.primary};
      border-radius: ${euiTheme.border.radius.small};
      font-weight: ${euiTheme.font.weight.bold};

      kbd {
        color: ${euiTheme.colors.backgroundBasePlain};
        background: ${euiTheme.colors.primary};
        border-color: ${euiTheme.colors.borderStrongPrimary};
        font-weight: ${euiTheme.font.weight.bold};
        box-shadow: 0 1px 0 ${euiTheme.colors.primary};
      }
    `,
    [euiTheme]
  );

  const separatorStyles = useMemo(
    () => css`
      width: 1px;
      align-self: stretch;
      background: ${euiTheme.border.color};
      margin: 0 ${euiTheme.size.s};
    `,
    [euiTheme]
  );

  return (
    <div
      css={panelStyles}
      data-test-subj="dashboardKeyboardShortcuts"
      role="region"
      aria-label={i18n.translate('dashboard.keyboardShortcuts.title', {
        defaultMessage: 'Keyboard shortcuts',
      })}
    >
      <EuiFlexGroup
        gutterSize="none"
        alignItems="center"
        justifyContent="center"
        wrap={true}
        responsive={false}
      >
        {listItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && <div css={separatorStyles} aria-hidden />}
            <EuiFlexItem grow={false}>
              <span
                css={[itemStyles, highlightedAction === item.id && itemHighlightStyles]}
                data-test-subj={
                  highlightedAction === item.id
                    ? 'dashboardKeyboardShortcutHighlighted'
                    : undefined
                }
              >
                {item.title} {item.description}
              </span>
            </EuiFlexItem>
          </React.Fragment>
        ))}
      </EuiFlexGroup>
    </div>
  );
};
