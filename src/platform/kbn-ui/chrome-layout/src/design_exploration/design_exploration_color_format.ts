/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

export type DesignExplorationColorFormat = 'hex' | 'hsl' | 'rgba';

export const DESIGN_EXPLORATION_COLOR_FORMATS: Array<{
  id: DesignExplorationColorFormat;
  label: string;
}> = [
  { id: 'hex', label: 'Hex' },
  { id: 'hsl', label: 'HSL' },
  { id: 'rgba', label: 'RGBA' },
];

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HslaColor {
  h: number;
  s: number;
  l: number;
  a: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toHexChannel = (channel: number) =>
  Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, '0');

export const rgbaToHex = ({ r, g, b, a }: RgbaColor): string => {
  const hex = `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
  if (a >= 1) {
    return hex;
  }

  return `${hex}${toHexChannel(a * 255)}`;
};

export const rgbaToCss = ({ r, g, b, a }: RgbaColor): string => {
  const red = Math.round(clamp(r, 0, 255));
  const green = Math.round(clamp(g, 0, 255));
  const blue = Math.round(clamp(b, 0, 255));
  const alpha = clamp(a, 0, 1);

  if (alpha >= 1) {
    return `rgb(${red}, ${green}, ${blue})`;
  }

  const roundedAlpha = Number(alpha.toFixed(3));
  return `rgba(${red}, ${green}, ${blue}, ${roundedAlpha})`;
};

const rgbToHslChannels = ({ r, g, b }: RgbaColor): [number, number, number] => {
  const red = clamp(r, 0, 255) / 255;
  const green = clamp(g, 0, 255) / 255;
  const blue = clamp(b, 0, 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return [0, 0, lightness];
  }

  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return [hue * 60, saturation, lightness];
};

const hueToRgb = (p: number, q: number, t: number) => {
  let tone = t;
  if (tone < 0) tone += 1;
  if (tone > 1) tone -= 1;
  if (tone < 1 / 6) return p + (q - p) * 6 * tone;
  if (tone < 1 / 2) return q;
  if (tone < 2 / 3) return p + (q - p) * (2 / 3 - tone) * 6;
  return p;
};

const hslToRgbChannels = (h: number, s: number, l: number): [number, number, number] => {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 1);
  const lightness = clamp(l, 0, 1);

  if (saturation === 0) {
    const channel = lightness * 255;
    return [channel, channel, channel];
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const hk = hue / 360;

  return [
    hueToRgb(p, q, hk + 1 / 3) * 255,
    hueToRgb(p, q, hk) * 255,
    hueToRgb(p, q, hk - 1 / 3) * 255,
  ];
};

export const rgbaToHsla = (color: RgbaColor): HslaColor => {
  const [h, s, l] = rgbToHslChannels(color);
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: clamp(color.a, 0, 1),
  };
};

export const hslaToRgba = ({ h, s, l, a }: HslaColor): RgbaColor => {
  const [r, g, b] = hslToRgbChannels(h, s / 100, l / 100);
  return { r, g, b, a: clamp(a, 0, 1) };
};

export const rgbaToHslCss = (color: RgbaColor): string => {
  const { h: hue, s: saturation, l: lightness, a: alpha } = rgbaToHsla(color);

  if (alpha >= 1) {
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  const roundedAlpha = Number(alpha.toFixed(3));
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${roundedAlpha})`;
};

const parseHex = (value: string): RgbaColor | undefined => {
  const hex = value.startsWith('#') ? value.slice(1) : value;
  const short = /^([0-9a-f]{3})$/i.exec(hex);
  if (short) {
    const [r, g, b] = short[1].split('').map((channel) => Number.parseInt(channel + channel, 16));
    return { r, g, b, a: 1 };
  }

  const long = /^([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!long) {
    return undefined;
  }

  const rgb = long[1];
  const alphaHex = long[2];
  return {
    r: Number.parseInt(rgb.slice(0, 2), 16),
    g: Number.parseInt(rgb.slice(2, 4), 16),
    b: Number.parseInt(rgb.slice(4, 6), 16),
    a: alphaHex ? Number.parseInt(alphaHex, 16) / 255 : 1,
  };
};

const parseRgbFunction = (value: string): RgbaColor | undefined => {
  const match =
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/i.exec(value);
  if (!match) {
    return undefined;
  }

  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] === undefined ? 1 : Number(match[4]),
  };
};

const parseCommaRgb = (value: string): RgbaColor | undefined => {
  const parts = value.split(',').map((part) => part.trim());
  if (parts.length !== 3 && parts.length !== 4) {
    return undefined;
  }

  const channels = parts.map(Number);
  if (channels.some((channel) => Number.isNaN(channel))) {
    return undefined;
  }

  return {
    r: channels[0],
    g: channels[1],
    b: channels[2],
    a: channels[3] === undefined ? 1 : channels[3],
  };
};

const parseHslFunction = (value: string): RgbaColor | undefined => {
  const match =
    /^hsla?\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%\s*(?:,\s*([0-9.]+)\s*)?\)$/i.exec(
      value
    );
  if (!match) {
    return undefined;
  }

  const [r, g, b] = hslToRgbChannels(
    Number(match[1]),
    Number(match[2]) / 100,
    Number(match[3]) / 100
  );

  return {
    r,
    g,
    b,
    a: match[4] === undefined ? 1 : Number(match[4]),
  };
};

export const parseCssColor = (value: string): RgbaColor | undefined => {
  const normalized = value.trim();
  if (!normalized || normalized === 'transparent') {
    return undefined;
  }

  return (
    parseHex(normalized) ??
    parseRgbFunction(normalized) ??
    parseHslFunction(normalized) ??
    parseCommaRgb(normalized)
  );
};

export const formatCssColor = (color: string, format: DesignExplorationColorFormat): string => {
  const parsed = parseCssColor(color);
  if (!parsed) {
    return color;
  }

  if (format === 'hex') {
    return rgbaToHex(parsed);
  }

  if (format === 'hsl') {
    return rgbaToHslCss(parsed);
  }

  return rgbaToCss(parsed);
};

/** Opaque hex for EuiColorPicker swatches; falls back to empty when unparsable. */
export const toPickerHex = (color: string): string => {
  const parsed = parseCssColor(color);
  if (!parsed) {
    return '';
  }

  return rgbaToHex({ ...parsed, a: 1 }).slice(0, 7);
};
