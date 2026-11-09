/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { EntranceAnimationSettings } from '@elastic/charts';

/**
 * POC: entrance animations for charts, on by default, each chart animating when it first scrolls into view.
 * Tune from the browser console without rebuilding, then reload:
 *   localStorage.setItem('chartsEntranceAnimation', JSON.stringify({ duration: 2000 }))
 *   localStorage.setItem('chartsEntranceAnimation', JSON.stringify({ trigger: 'mount' }))
 *   localStorage.setItem('chartsEntranceAnimation', JSON.stringify({ enabled: false }))
 *   localStorage.removeItem('chartsEntranceAnimation') // back to defaults
 */
export const STORAGE_KEY = 'chartsEntranceAnimation';

const DEFAULTS: EntranceAnimationSettings = { enabled: true, trigger: 'inView' };

let cached: { raw: string | null; settings: EntranceAnimationSettings } | undefined;

/** Returns the same object while the stored overrides are unchanged, so charts don't re-render for it */
export function getEntranceAnimation(): EntranceAnimationSettings {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // storage unavailable
  }
  if (cached?.raw === raw) return cached.settings;
  let overrides: Partial<EntranceAnimationSettings> = {};
  try {
    overrides = JSON.parse(raw ?? '{}') ?? {};
  } catch {
    // malformed JSON: ignore the overrides
  }
  cached = { raw, settings: { ...DEFAULTS, ...overrides } };
  return cached.settings;
}
