/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { EuiBadge, EuiContextMenu, EuiPopover } from '@elastic/eui';
import {
  NEW_PANEL_EMPTY_STATE_VARIANTS,
  newPanelEmptyStateVariant$,
  setNewPanelEmptyStateVariant,
} from './new_panel_empty_state_variant';

const TITLE = 'Lens new panel empty state';

/** PROTOTYPE: developer toolbar control for switching the new-panel empty state direction. */
export const NewPanelEmptyStateSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const variant = useObservable(newPanelEmptyStateVariant$, newPanelEmptyStateVariant$.getValue());
  const current = NEW_PANEL_EMPTY_STATE_VARIANTS.find(({ id }) => id === variant);

  return (
    <EuiPopover
      button={
        <EuiBadge
          color="#0B1628"
          iconType="lensApp"
          iconSide="left"
          onClick={() => setIsOpen((open) => !open)}
          onClickAriaLabel={TITLE}
          data-test-subj="lnsNewPanelEmptyStateSwitcher"
        >
          {current?.label}
        </EuiBadge>
      }
      panelPaddingSize="none"
      offset={4}
      anchorPosition="upRight"
      repositionOnScroll
      repositionToCrossAxis={false}
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      aria-label={TITLE}
    >
      <EuiContextMenu
        initialPanelId={0}
        panels={[
          {
            id: 0,
            title: TITLE,
            items: NEW_PANEL_EMPTY_STATE_VARIANTS.map(({ id, label }) => ({
              name: label,
              icon: id === variant ? 'check' : 'empty',
              'data-test-subj': `lnsNewPanelEmptyStateSwitcher-${id}`,
              onClick: () => {
                setNewPanelEmptyStateVariant(id);
                setIsOpen(false);
              },
            })),
          },
        ]}
      />
    </EuiPopover>
  );
};
