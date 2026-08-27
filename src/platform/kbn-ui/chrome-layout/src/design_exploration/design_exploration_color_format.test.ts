/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  formatCssColor,
  hslaToRgba,
  parseCssColor,
  rgbaToHex,
  rgbaToHsla,
  rgbaToHslCss,
} from './design_exploration_color_format';

describe('design exploration color format', () => {
  it('parses hex, rgb, and hsl strings', () => {
    expect(parseCssColor('#EAEDF5')).toEqual({ r: 234, g: 237, b: 245, a: 1 });
    expect(parseCssColor('rgb(245, 247, 251)')).toEqual({ r: 245, g: 247, b: 251, a: 1 });
    expect(parseCssColor('rgba(20, 20, 20, 0.15)')).toEqual({ r: 20, g: 20, b: 20, a: 0.15 });
    expect(parseCssColor('hsl(220, 44%, 94%)')).toMatchObject({ a: 1 });
  });

  it('formats hex, hsl, and rgba', () => {
    expect(formatCssColor('#f5f7fb', 'hex')).toBe('#f5f7fb');
    expect(formatCssColor('#f5f7fb', 'rgba')).toBe('rgb(245, 247, 251)');
    expect(rgbaToHex({ r: 234, g: 237, b: 245, a: 1 })).toBe('#eaedf5');
    expect(rgbaToHslCss({ r: 255, g: 255, b: 255, a: 1 })).toBe('hsl(0, 0%, 100%)');
  });

  it('round-trips hsl through parse and format', () => {
    const parsed = parseCssColor('hsl(210, 20%, 95%)');
    expect(parsed).toBeDefined();
    expect(formatCssColor(rgbaToHex(parsed!), 'hsl')).toMatch(/^hsl\(/);
  });

  it('converts rgba to hsla channels and back', () => {
    const source = { r: 245, g: 247, b: 251, a: 1 };
    const hsla = rgbaToHsla(source);
    expect(hsla.s).toBeGreaterThanOrEqual(0);
    expect(hsla.l).toBeGreaterThan(90);
    const roundTrip = hslaToRgba(hsla);
    expect(Math.abs(Math.round(roundTrip.r) - source.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(Math.round(roundTrip.g) - source.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(Math.round(roundTrip.b) - source.b)).toBeLessThanOrEqual(2);
  });
});
