/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useEffect, useMemo, useState } from 'react';
import type { Action } from '@kbn/ui-actions-plugin/public';
import { catchError, from, of, switchMap } from 'rxjs';
import type { DashboardApi } from '../../dashboard_api/types';
import { uiActionsService } from '../../services/kibana_services';
import {
  ADD_PANELS_TO_CHAT_ACTION_ID,
  type AddPanelsToChatActionContext,
} from './add_panels_to_chat_action';

const getAddPanelsToChatAction = async (): Promise<Action<AddPanelsToChatActionContext>> =>
  (await uiActionsService.getAction(
    ADD_PANELS_TO_CHAT_ACTION_ID
  )) as Action<AddPanelsToChatActionContext>;

/**
 * Returns an `execute` function that sends the given panels to the AI chat, or `null` when AI
 * chat is not available in the current environment.
 */
export const useAddPanelsToChatAction = (
  dashboardApi: DashboardApi,
  panelIds: Set<string>
): { execute: () => Promise<void> } | null => {
  const [action, setAction] = useState<Action<AddPanelsToChatActionContext> | null>(null);
  const context = useMemo(
    () => ({
      dashboardApi,
      panelIds: Array.from(panelIds),
      trigger: { id: ADD_PANELS_TO_CHAT_ACTION_ID },
    }),
    [dashboardApi, panelIds]
  );

  useEffect(() => {
    if (!uiActionsService.hasAction(ADD_PANELS_TO_CHAT_ACTION_ID)) {
      setAction(null);
      return;
    }

    const subscription = from(getAddPanelsToChatAction())
      .pipe(
        switchMap(async (nextAction) => {
          try {
            return (await nextAction.isCompatible(context)) ? nextAction : null;
          } catch {
            return null;
          }
        }),
        catchError(() => of(null))
      )
      .subscribe(setAction);

    return () => subscription.unsubscribe();
  }, [context]);

  return useMemo(
    () => (action ? { execute: () => action.execute(context) } : null),
    [action, context]
  );
};
