/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

export type DesignExplorationColorOverrideId = 'chrome' | 'dashboard';

export interface DesignExplorationColorOverrides {
  chrome?: string;
  dashboard?: string;
}

type ColorOverridesByVariant = Partial<Record<string, DesignExplorationColorOverrides>>;

/** Session-only. A full page reload restores variant defaults. */
let colorOverridesByVariant: ColorOverridesByVariant = {};

try {
  sessionStorage.removeItem('dev.core.chrome.designExploration.colors');
} catch {
  // Ignore missing storage in non-browser contexts.
}

export const getDesignExplorationColorOverrides = (
  variantId: string
): DesignExplorationColorOverrides => colorOverridesByVariant[variantId] ?? {};

export const setDesignExplorationColorOverride = (
  variantId: string,
  id: DesignExplorationColorOverrideId,
  value: string
) => {
  colorOverridesByVariant = {
    ...colorOverridesByVariant,
    [variantId]: {
      ...colorOverridesByVariant[variantId],
      [id]: value,
    },
  };
};

export const resetDesignExplorationColorOverrides = (variantId: string) => {
  const next = { ...colorOverridesByVariant };
  delete next[variantId];
  colorOverridesByVariant = next;
};
