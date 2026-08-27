/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiColorPicker,
  EuiColorPickerSwatch,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiThemeProvider,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { css } from '@emotion/react';
import {
  DESIGN_EXPLORATION_COLOR_FORMATS,
  formatCssColor,
  parseCssColor,
  rgbaToCss,
  rgbaToHex,
  toPickerHex,
  type DesignExplorationColorFormat,
  type RgbaColor,
} from './design_exploration_color_format';
import { ColorChannelGroup } from './design_exploration_color_channel_input';
import {
  getDesignExplorationColorOverrides,
  resetDesignExplorationColorOverrides,
  setDesignExplorationColorOverride,
  type DesignExplorationColorOverrideId,
} from './design_exploration_color_overrides';
import {
  applyDesignExplorationKnobCssVars,
  DESIGN_EXPLORATION_KNOB_CSS_VAR_NAMES,
  notifyDesignExplorationKnobsChanged,
} from './design_exploration_knobs';
import { getActiveDesignExplorationVariant } from './design_exploration_variants';
import { DESIGN_EXPLORATION_BODY_ATTR } from './design_exploration_shared';

const COLORS_PANEL_ATTR = 'data-design-exploration-colors-panel';

const badgeStyles = css`
  cursor: pointer;
`;

const getPanelStyles = () => css`
  position: fixed;
  right: 16px;
  bottom: 56px;
  z-index: 12000;
  width: 360px;
  max-height: calc(100vh - 96px);
  overflow: auto;
`;

/**
 * Design exploration variants force dark label colors on the whole page, including
 * this panel. The toolbar is also dark-themed, so isolate a light surface with
 * explicit text colors or the copy disappears.
 */
const getPanelIsolationStyles = ({
  backgroundColor,
  borderColor,
  textColor,
  subduedTextColor,
  inputTextColor,
}: {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  subduedTextColor: string;
  inputTextColor: string;
}) => {
  const panelScope = `body[${DESIGN_EXPLORATION_BODY_ATTR}='true'] &[${COLORS_PANEL_ATTR}='true']`;

  return css`
    ${panelScope} {
      background-color: ${backgroundColor} !important;
      color: ${textColor} !important;
    }

    ${panelScope} .euiTitle,
    ${panelScope} .euiTitle *,
    ${panelScope} h2,
    ${panelScope} .euiFormLabel,
    ${panelScope} .euiFormRow__label,
    ${panelScope} .euiButtonEmpty,
    ${panelScope} .euiButtonGroupButton,
    ${panelScope} .euiButtonGroupButton .euiButtonEmpty,
    ${panelScope} .euiButtonGroupButton span {
      color: ${textColor} !important;
    }

    ${panelScope} .euiText,
    ${panelScope} .euiText * {
      color: ${subduedTextColor} !important;
    }

    ${panelScope}
    .euiFormControlLayout:not(.euiFormControlLayout--group):not(:has(:invalid, [aria-invalid='true'])):not(:has(:disabled)),
    ${panelScope} .euiFormControlButton:not(:focus):not(:disabled):not([aria-invalid='true']) {
      background-color: ${backgroundColor} !important;
      border: 1px solid ${borderColor} !important;
      border-radius: 4px !important;
      box-shadow: none !important;
    }

    ${panelScope}
    .euiFormControlLayout:not(.euiFormControlLayout--group):not(:has(:invalid, [aria-invalid='true']))
    input:not(:focus):not(:disabled),
    ${panelScope} .euiFieldText,
    ${panelScope} .designExplorationColorChannel:not(:focus) {
      background-color: transparent !important;
      color: ${inputTextColor} !important;
    }

    ${panelScope} .designExplorationColorChannel:focus {
      color: ${inputTextColor} !important;
    }

    ${panelScope} .designExplorationColorChannels {
      background-color: ${backgroundColor} !important;
      border-color: ${borderColor} !important;
      width: 100% !important;
      min-width: 0 !important;
    }

    ${panelScope} .designExplorationColorChannel {
      flex: 1 1 0 !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: none !important;
      padding-inline: 0 !important;
    }
  `;
};

const getPageColorMode = (): 'LIGHT' | 'DARK' => {
  const tag = (window as { __kbnThemeTag__?: string }).__kbnThemeTag__;
  return tag?.endsWith('dark') ? 'DARK' : 'LIGHT';
};

const toStoredColor = (color: RgbaColor): string =>
  color.a < 1 ? rgbaToCss(color) : rgbaToHex(color);

const readKnobCssVar = (token: 'canvas' | 'dashboard'): string => {
  if (typeof document === 'undefined') {
    return '';
  }

  return getComputedStyle(document.documentElement)
    .getPropertyValue(DESIGN_EXPLORATION_KNOB_CSS_VAR_NAMES[token])
    .trim();
};

const resolveSurfaceColor = (
  override: string | undefined,
  cssVar: string,
  fallback: string,
  inheritColor?: string
): string => {
  const value = override || cssVar || fallback;
  if (!value || value === 'transparent') {
    return inheritColor || fallback;
  }

  return value;
};

const ColorField = ({
  label,
  color,
  format,
  testSubj,
  onChange,
}: {
  label: string;
  color: string;
  format: DesignExplorationColorFormat;
  testSubj: string;
  onChange: (color: string) => void;
}) => {
  const displayValue = formatCssColor(color, format);
  const [draft, setDraft] = useState(displayValue);
  const parsedDraft = parseCssColor(draft);
  const pickerColor = toPickerHex(color);

  useEffect(() => {
    setDraft(formatCssColor(color, format));
  }, [color, format]);

  return (
    <EuiFormRow
      label={label}
      fullWidth
      isInvalid={format === 'hex' && draft.length > 0 && parsedDraft === undefined}
      error={
        format === 'hex' && draft.length > 0 && parsedDraft === undefined
          ? 'Enter a valid color'
          : undefined
      }
    >
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiColorPicker
            button={
              <EuiColorPickerSwatch
                color={pickerColor || undefined}
                aria-label={`${label} swatch`}
              />
            }
            color={pickerColor}
            onChange={(_text, output) => {
              if (!output.isValid) {
                return;
              }

              const [r, g, b, a] = output.rgba;
              onChange(toStoredColor({ r, g, b, a: Number.isNaN(a) ? 1 : a }));
            }}
            showAlpha={format !== 'hex'}
            format={format === 'rgba' ? 'rgba' : 'hex'}
            secondaryInputDisplay="bottom"
            popoverZIndex={13000}
            compressed
            data-test-subj={`${testSubj}-picker`}
          />
        </EuiFlexItem>
        <EuiFlexItem
          css={css`
            min-width: 0;
          `}
        >
          {format === 'hex' ? (
            <EuiFieldText
              compressed
              value={draft}
              isInvalid={draft.length > 0 && parsedDraft === undefined}
              onChange={(event) => {
                const next = event.target.value;
                setDraft(next);
                const parsed = parseCssColor(next);
                if (parsed) {
                  onChange(toStoredColor(parsed));
                }
              }}
              aria-label={label}
              data-test-subj={`${testSubj}-input`}
            />
          ) : (
            <ColorChannelGroup
              format={format}
              color={parseCssColor(color) ?? { r: 255, g: 255, b: 255, a: 1 }}
              testSubj={`${testSubj}-channels`}
              onChange={(next) => onChange(toStoredColor(next))}
            />
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFormRow>
  );
};

export const DesignExplorationColorsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <EuiToolTip content="Pick chrome and dashboard background colors.">
        <EuiBadge
          color="#0B1628"
          css={badgeStyles}
          iconType="palette"
          iconSide="left"
          onClick={() => setIsOpen((open) => !open)}
          onClickAriaLabel="Toggle chrome and dashboard color pickers"
        >
          Colors
        </EuiBadge>
      </EuiToolTip>

      {isOpen && (
        <EuiThemeProvider colorMode="light">
          <ColorsPanelBody onClose={() => setIsOpen(false)} />
        </EuiThemeProvider>
      )}
    </>
  );
};

const ColorsPanelBody = ({ onClose }: { onClose: () => void }) => {
  const { euiTheme } = useEuiTheme();
  const [, setRevision] = useState(0);
  const [format, setFormat] = useState<DesignExplorationColorFormat>('hex');
  const panelTitleId = useGeneratedHtmlId({ prefix: 'designExplorationColorsTitle' });
  const activeVariant = getActiveDesignExplorationVariant();
  const overrides = getDesignExplorationColorOverrides(activeVariant.id);
  const pageColorMode = getPageColorMode();

  const chromeColor = resolveSurfaceColor(
    overrides.chrome,
    readKnobCssVar('canvas'),
    activeVariant.knobTokens.canvas
  );
  const dashboardColor = resolveSurfaceColor(
    overrides.dashboard,
    readKnobCssVar('dashboard'),
    activeVariant.knobTokens.dashboard,
    chromeColor
  );

  const applyColors = useCallback(() => {
    applyDesignExplorationKnobCssVars(activeVariant.knobTokens, activeVariant.id, pageColorMode);
    notifyDesignExplorationKnobsChanged();
    setRevision((current) => current + 1);
  }, [activeVariant, pageColorMode]);

  const onColorChange = useCallback(
    (id: DesignExplorationColorOverrideId, value: string) => {
      setDesignExplorationColorOverride(activeVariant.id, id, value);
      applyColors();
    },
    [activeVariant.id, applyColors]
  );

  const onReset = useCallback(() => {
    resetDesignExplorationColorOverrides(activeVariant.id);
    applyColors();
  }, [activeVariant.id, applyColors]);

  return (
    <EuiPanel
      css={[
        getPanelStyles(),
        getPanelIsolationStyles({
          backgroundColor: euiTheme.colors.backgroundBasePlain,
          borderColor: euiTheme.border.color,
          textColor: euiTheme.colors.textParagraph,
          subduedTextColor: euiTheme.colors.textSubdued,
          inputTextColor: euiTheme.colors.textParagraph,
        }),
      ]}
      paddingSize="m"
      hasShadow
      aria-labelledby={panelTitleId}
      {...{ [COLORS_PANEL_ATTR]: 'true' }}
    >
      <EuiTitle size="xxs">
        <h2 id={panelTitleId}>Surface colors</h2>
      </EuiTitle>
      <EuiText size="xs" color="subdued">
        Chrome is the gray around the shell. Dashboard is the field behind panels.
      </EuiText>
      <EuiSpacer size="m" />
      <EuiForm>
        <EuiFormRow label="Format" fullWidth>
          <EuiButtonGroup
            isFullWidth
            legend="Color format"
            type="single"
            buttonSize="compressed"
            options={DESIGN_EXPLORATION_COLOR_FORMATS.map(({ id, label }) => ({
              id,
              label,
            }))}
            idSelected={format}
            onChange={(id) => setFormat(id as DesignExplorationColorFormat)}
          />
        </EuiFormRow>
        <ColorField
          label="Chrome background"
          color={chromeColor}
          format={format}
          testSubj="designExplorationChromeColor"
          onChange={(value) => onColorChange('chrome', value)}
        />
        <ColorField
          label="Dashboard background"
          color={dashboardColor}
          format={format}
          testSubj="designExplorationDashboardColor"
          onChange={(value) => onColorChange('dashboard', value)}
        />
      </EuiForm>
      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="xs" onClick={onReset}>
            Reset colors
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="xs" onClick={onClose}>
            Close
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
