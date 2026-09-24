/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type KeyboardShortcutHighlightAction = 'selection' | 'copy' | 'paste' | 'undo' | 'drag';

const HIGHLIGHT_DURATION_MS = 400;

interface KeyboardShortcutHighlightContextValue {
  highlightedAction: KeyboardShortcutHighlightAction | null;
  triggerHighlight: (action: KeyboardShortcutHighlightAction) => void;
}

const KeyboardShortcutHighlightContext = createContext<
  KeyboardShortcutHighlightContextValue | undefined
>(undefined);

export const useKeyboardShortcutHighlight = (): KeyboardShortcutHighlightContextValue => {
  const value = useContext(KeyboardShortcutHighlightContext);
  if (value === undefined) {
    throw new Error(
      'useKeyboardShortcutHighlight must be used within KeyboardShortcutHighlightProvider'
    );
  }
  return value;
};

export const KeyboardShortcutHighlightProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [highlightedAction, setHighlightedAction] = useState<
    KeyboardShortcutHighlightAction | null
 >(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerHighlight = useCallback((action: KeyboardShortcutHighlightAction) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHighlightedAction(action);
    timeoutRef.current = setTimeout(() => {
      setHighlightedAction(null);
      timeoutRef.current = null;
    }, HIGHLIGHT_DURATION_MS);
  }, []);

  const value: KeyboardShortcutHighlightContextValue = {
    highlightedAction,
    triggerHighlight,
  };

  return (
    <KeyboardShortcutHighlightContext.Provider value={value}>
      {children}
    </KeyboardShortcutHighlightContext.Provider>
  );
};
