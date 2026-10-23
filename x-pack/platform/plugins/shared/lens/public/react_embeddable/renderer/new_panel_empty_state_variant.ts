/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { BehaviorSubject, Subject } from 'rxjs';
import type { LensSerializedState } from '@kbn/lens-common';

/**
 * PROTOTYPE: design directions for a new, empty Lens panel created inline on a dashboard.
 * Switched from the developer toolbar; not meant to ship.
 */
export type NewPanelEmptyStateVariant =
  | 'suggestions'
  | 'miniCharts'
  | 'emptyPrompt'
  | 'defaultTimeSeries';

export const NEW_PANEL_EMPTY_STATE_VARIANTS: Array<{
  id: NewPanelEmptyStateVariant;
  label: string;
}> = [
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'miniCharts', label: 'Mini charts' },
  { id: 'emptyPrompt', label: 'Empty prompt' },
  { id: 'defaultTimeSeries', label: 'Default time series' },
];

const STORAGE_KEY = 'lens:prototype:newPanelEmptyStateVariant';

const readStoredVariant = (): NewPanelEmptyStateVariant => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return NEW_PANEL_EMPTY_STATE_VARIANTS.some(({ id }) => id === stored)
      ? (stored as NewPanelEmptyStateVariant)
      : 'suggestions';
  } catch (e) {
    return 'suggestions';
  }
};

export const newPanelEmptyStateVariant$ = new BehaviorSubject<NewPanelEmptyStateVariant>(
  readStoredVariant()
);

export const setNewPanelEmptyStateVariant = (variant: NewPanelEmptyStateVariant) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, variant);
  } catch (e) {
    // localStorage can be unavailable; the choice then only lasts until reload
  }
  newPanelEmptyStateVariant$.next(variant);
};

/**
 * PROTOTYPE: a starter chart picked from a new panel's empty state (a suggestion card). The open
 * inline editing flyout for that panel applies it, so the editor and the panel update together.
 */
export const newPanelStarterRequest$ = new Subject<{
  panelId: string;
  attributes: LensSerializedState['attributes'];
}>();
