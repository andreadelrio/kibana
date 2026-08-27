/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useEffect, useRef, useState } from 'react';
import { useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import {
  hslaToRgba,
  rgbaToHsla,
  type DesignExplorationColorFormat,
  type RgbaColor,
} from './design_exploration_color_format';

const CHANNEL_GROUP_CLASS = 'designExplorationColorChannels';

interface ChannelConfig {
  id: string;
  ariaLabel: string;
  value: number;
  min: number;
  max: number;
  wrap?: boolean;
}

const getGroupStyles = ({
  borderColor,
  focusBorderColor,
  radius,
  height,
}: {
  borderColor: string;
  focusBorderColor: string;
  radius: string;
  height: string;
}) => css`
  display: flex;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  height: ${height};
  border: 1px solid ${borderColor};
  border-radius: ${radius};
  overflow: hidden;

  &:focus-within {
    border-color: ${focusBorderColor};
  }
`;

const getChannelStyles = ({
  borderColor,
  focusBackground,
  textColor,
}: {
  borderColor: string;
  focusBackground: string;
  textColor: string;
}) => css`
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  box-sizing: border-box;
  border: none;
  border-right: 1px solid ${borderColor};
  outline: none;
  text-align: center;
  background: transparent;
  color: ${textColor};
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  padding: 0;
  cursor: ew-resize;

  &:focus {
    background-color: ${focusBackground};
    cursor: text;
  }

  &:last-of-type {
    border-right: none;
  }
`;

const getUnitStyles = ({ textColor, borderColor }: { textColor: string; borderColor: string }) =>
  css`
    display: flex;
    align-items: center;
    padding: 0 6px 0 4px;
    color: ${textColor};
    border-left: 1px solid ${borderColor};
    flex-shrink: 0;
    user-select: none;
  `;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const adjustValue = (
  value: number,
  delta: number,
  min: number,
  max: number,
  wrap?: boolean
): number => {
  const next = value + delta;

  if (!wrap) {
    return clamp(next, min, max);
  }

  const range = max - min;
  return min + ((((next - min) % range) + range) % range);
};

const ChannelInput = ({
  channel,
  testSubj,
  onCommit,
}: {
  channel: ChannelConfig;
  testSubj: string;
  onCommit: (value: number) => void;
}) => {
  const { euiTheme } = useEuiTheme();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(String(channel.value));
  const scrubRef = useRef<{ startX: number; startValue: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (!focused) {
      setDraft(String(channel.value));
    }
  }, [channel.value, focused]);

  const commitParsed = (raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      setDraft(String(channel.value));
      return;
    }

    onCommit(
      channel.wrap
        ? adjustValue(parsed, 0, channel.min, channel.max, true)
        : clamp(parsed, channel.min, channel.max)
    );
  };

  return (
    <input
      className="designExplorationColorChannel"
      css={getChannelStyles({
        borderColor: euiTheme.border.color,
        focusBackground: euiTheme.colors.backgroundBasePrimary,
        textColor: euiTheme.colors.textParagraph,
      })}
      value={draft}
      size={3}
      inputMode="numeric"
      aria-label={channel.ariaLabel}
      data-test-subj={testSubj}
      onFocus={(event) => {
        setFocused(true);
        event.currentTarget.select();
      }}
      onBlur={() => {
        setFocused(false);
        commitParsed(draft);
      }}
      onChange={(event) => {
        const next = event.target.value.replace(/[^\d.-]/g, '');
        setDraft(next);
        if (next !== '' && next !== '-' && Number.isFinite(Number(next))) {
          commitParsed(next);
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
          return;
        }

        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const delta = event.key === 'ArrowUp' ? step : -step;
        const next = adjustValue(channel.value, delta, channel.min, channel.max, channel.wrap);
        setDraft(String(next));
        onCommit(next);
      }}
      onWheel={(event) => {
        if (!focused) {
          return;
        }

        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const delta = event.deltaY < 0 ? step : -step;
        const next = adjustValue(channel.value, delta, channel.min, channel.max, channel.wrap);
        setDraft(String(next));
        onCommit(next);
      }}
      onPointerDown={(event) => {
        scrubRef.current = {
          startX: event.clientX,
          startValue: channel.value,
          moved: false,
        };
      }}
      onPointerMove={(event) => {
        const scrub = scrubRef.current;
        if (!scrub || event.buttons === 0) {
          return;
        }

        const dx = event.clientX - scrub.startX;
        if (Math.abs(dx) < 3) {
          return;
        }

        scrub.moved = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        const step = event.shiftKey ? 10 : 1;
        const delta = Math.round(dx / 4) * step;
        const next = adjustValue(scrub.startValue, delta, channel.min, channel.max, channel.wrap);
        setDraft(String(next));
        onCommit(next);
      }}
      onPointerUp={() => {
        scrubRef.current = null;
      }}
    />
  );
};

export const ColorChannelGroup = ({
  format,
  color,
  testSubj,
  onChange,
}: {
  format: Exclude<DesignExplorationColorFormat, 'hex'>;
  color: RgbaColor;
  testSubj: string;
  onChange: (color: RgbaColor) => void;
}) => {
  const { euiTheme } = useEuiTheme();
  const lastEmittedRef = useRef<RgbaColor | null>(null);
  const [hsla, setHsla] = useState(() => rgbaToHsla(color));

  useEffect(() => {
    const lastEmitted = lastEmittedRef.current;
    if (
      lastEmitted &&
      Math.round(lastEmitted.r) === Math.round(color.r) &&
      Math.round(lastEmitted.g) === Math.round(color.g) &&
      Math.round(lastEmitted.b) === Math.round(color.b) &&
      Math.round(lastEmitted.a * 100) === Math.round(color.a * 100)
    ) {
      return;
    }

    setHsla(rgbaToHsla(color));
  }, [color]);

  const alphaPercent = Math.round(hsla.a * 100);

  const channels: ChannelConfig[] =
    format === 'hsl'
      ? [
          { id: 'h', ariaLabel: 'Hue', value: hsla.h, min: 0, max: 360, wrap: true },
          { id: 's', ariaLabel: 'Saturation', value: hsla.s, min: 0, max: 100 },
          { id: 'l', ariaLabel: 'Lightness', value: hsla.l, min: 0, max: 100 },
          { id: 'a', ariaLabel: 'Opacity', value: alphaPercent, min: 0, max: 100 },
        ]
      : [
          { id: 'r', ariaLabel: 'Red', value: Math.round(color.r), min: 0, max: 255 },
          { id: 'g', ariaLabel: 'Green', value: Math.round(color.g), min: 0, max: 255 },
          { id: 'b', ariaLabel: 'Blue', value: Math.round(color.b), min: 0, max: 255 },
          { id: 'a', ariaLabel: 'Opacity', value: alphaPercent, min: 0, max: 100 },
        ];

  const emit = (next: RgbaColor, nextHsla: typeof hsla) => {
    lastEmittedRef.current = next;
    setHsla(nextHsla);
    onChange(next);
  };

  const onChannelCommit = (id: string, value: number) => {
    if (format === 'hsl') {
      const nextHsla = {
        h: id === 'h' ? value : hsla.h,
        s: id === 's' ? value : hsla.s,
        l: id === 'l' ? value : hsla.l,
        a: id === 'a' ? value / 100 : hsla.a,
      };
      emit(hslaToRgba(nextHsla), nextHsla);
      return;
    }

    const next = {
      r: id === 'r' ? value : color.r,
      g: id === 'g' ? value : color.g,
      b: id === 'b' ? value : color.b,
      a: id === 'a' ? value / 100 : color.a,
    };
    emit(next, rgbaToHsla(next));
  };

  return (
    <div
      className={CHANNEL_GROUP_CLASS}
      css={getGroupStyles({
        borderColor: euiTheme.border.color,
        focusBorderColor: euiTheme.colors.primary,
        radius: euiTheme.border.radius.medium,
        height: euiTheme.size.xl,
      })}
    >
      {channels.map((channel) => (
        <ChannelInput
          key={channel.id}
          channel={channel}
          testSubj={`${testSubj}-${channel.id}`}
          onCommit={(value) => onChannelCommit(channel.id, value)}
        />
      ))}
      <span
        css={getUnitStyles({
          textColor: euiTheme.colors.textSubdued,
          borderColor: euiTheme.border.color,
        })}
      >
        %
      </span>
    </div>
  );
};
