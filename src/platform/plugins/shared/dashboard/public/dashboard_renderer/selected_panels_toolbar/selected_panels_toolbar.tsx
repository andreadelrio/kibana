/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  EuiButtonIcon,
  type EuiButtonIconPropsForButton,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiPanel,
  EuiPopover,
  EuiText,
  EuiToolTip,
  keys,
  transparentize,
  type UseEuiTheme,
} from '@elastic/eui';
import { keyframes } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import { useMemoCss } from '@kbn/css-utils/public/use_memo_css';
import { AiButton } from '@kbn/ui-ai-components';
import { useStateFromPublishingSubject } from '@kbn/presentation-publishing';
import { useDashboardApi } from '../../dashboard_api/use_dashboard_api';
import type { SelectedPanelsLayoutMode } from '../../dashboard_api/layout_manager/apply_selected_panels_layout';
import {
  dashboardClonePanelActionStrings,
  dashboardCopyToDashboardActionStrings,
  dashboardPanelContextMenuStrings,
} from '../../dashboard_actions/_dashboard_actions_strings';
import { useBulkPanelActions } from '../grid/use_bulk_panel_actions';
import { useAddPanelsToChatAction } from './use_add_panels_to_chat_action';
import { useToolbarExpandAnimation } from './use_toolbar_expand_animation';
import {
  getAnnotationsVisibility,
  setAnnotationsHidden,
  type AnnotationsVisibility,
} from './panel_annotations';

const strings = {
  getSelectedCount: (count: number) =>
    i18n.translate('dashboard.selectedPanelsToolbar.selectedCount', {
      defaultMessage: '{count} selected',
      values: { count },
    }),
  getClearSelection: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.clearSelection', {
      defaultMessage: 'Clear selection',
    }),
  getAddToChat: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.addToChat', {
      defaultMessage: 'Add to chat',
    }),
  getGroupIntoSection: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.groupIntoSection', {
      defaultMessage: 'Group into section',
    }),
  getGroupDisabled: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.groupDisabled', {
      defaultMessage: 'Select at least two panels to group them',
    }),
  getShowMore: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.showMore', {
      defaultMessage: 'More options',
    }),
  getShowLess: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.showLess', {
      defaultMessage: 'Fewer options',
    }),
  getToolbarLabel: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.ariaLabel', {
      defaultMessage: 'Selected panels actions',
    }),
  getShareColorMapping: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.shareColorMapping', {
      defaultMessage: 'Share color mapping',
    }),
  getHideAnnotations: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.hideAnnotations', {
      defaultMessage: 'Hide annotations',
    }),
  getShowAnnotations: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.showAnnotations', {
      defaultMessage: 'Show annotations',
    }),
  getDeletePanels: () =>
    i18n.translate('dashboard.selectedPanelsToolbar.deletePanels', {
      defaultMessage: 'Delete panels',
    }),
};

const ActionButton = ({
  label,
  tooltip,
  ...rest
}: { label: string; tooltip?: string } & Omit<EuiButtonIconPropsForButton, 'aria-label'>) => (
  <EuiToolTip content={tooltip ?? label} disableScreenReaderOutput={!tooltip}>
    <EuiButtonIcon color="text" size="s" iconSize="m" aria-label={label} {...rest} />
  </EuiToolTip>
);

/**
 * Both icons stay rendered and crossfade (opacity + scale + blur) based on the toggle's
 * `aria-expanded`, so the swap under the cursor isn't a hard cut.
 */
const ExpandToggleIcon = ({ className }: { className?: string }) => (
  <span className={className} css={expandIconStyles} aria-hidden>
    <EuiIcon type="maximize" className="dshExpandIcon__maximize" aria-hidden={true} />
    <EuiIcon type="minimize" className="dshExpandIcon__minimize" aria-hidden={true} />
  </span>
);

/** How long the toolbar waits for the "Add to chat" availability check before showing anyway */
const READY_TIMEOUT = 250;

export interface SelectedPanelsToolbarProps {
  selectedPanelIds: Set<string>;
  /** plays the exit; the parent unmounts the toolbar once it's done */
  isExiting?: boolean;
  /** skips the entrance, e.g. when the toolbar was visible a moment ago */
  skipEntrance?: boolean;
}

export const SelectedPanelsToolbar = ({
  selectedPanelIds,
  isExiting = false,
  skipEntrance = false,
}: SelectedPanelsToolbarProps) => {
  const dashboardApi = useDashboardApi();
  const styles = useMemoCss(toolbarStyles);
  const { isExpanded, isMoreMounted, toggle, frameRef, moreRef } = useToolbarExpandAnimation();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isLayoutPopoverOpen, setIsLayoutPopoverOpen] = useState(false);

  const { duplicate, remove, group, canGroup, applyLayout, copyToDashboard, canCopyToDashboard } =
    useBulkPanelActions(selectedPanelIds);
  const { addToChat, isResolved } = useAddPanelsToChatAction(dashboardApi, selectedPanelIds);

  // Hold the entrance until we know whether "Add to chat" is available, so the row is complete on
  // its first frame instead of shifting right after the toolbar appears.
  const [hasTimedOut, setHasTimedOut] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setHasTimedOut(true), READY_TIMEOUT);
    return () => clearTimeout(timeout);
  }, []);
  const isReady = isResolved || hasTimedOut;
  // if the check only resolves after the toolbar is shown, ease the button in
  const hadAddToChatWhenReady = useRef<boolean | null>(null);
  if (isReady && hadAddToChatWhenReady.current === null) {
    hadAddToChatWhenReady.current = Boolean(addToChat);
  }
  const isAddToChatLate = hadAddToChatWhenReady.current === false;

  useEffect(() => {
    if (rootRef.current) rootRef.current.inert = isExiting;
  }, [isExiting]);

  const children = useStateFromPublishingSubject(dashboardApi.children$);
  const [annotationsVisibility, setAnnotationsVisibility] = useState<AnnotationsVisibility>(() =>
    getAnnotationsVisibility(children, selectedPanelIds)
  );
  useEffect(() => {
    setAnnotationsVisibility(getAnnotationsVisibility(children, selectedPanelIds));
  }, [children, selectedPanelIds]);

  const toggleAnnotations = useCallback(() => {
    const hide = annotationsVisibility === 'visible';
    setAnnotationsHidden(children, selectedPanelIds, hide);
    // flip the option right away, without waiting for the panels to re-render
    setAnnotationsVisibility(hide ? 'hidden' : 'visible');
  }, [annotationsVisibility, children, selectedPanelIds]);

  const clearSelection = useCallback(
    () => dashboardApi.setSelectedPanelIds(new Set()),
    [dashboardApi]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== keys.ESCAPE || e.defaultPrevented) return;
      // let Escape close popovers, modals, flyouts and leave text fields alone
      const active = document.activeElement as HTMLElement | null;
      if (
        active?.closest(
          'input, textarea, [contenteditable="true"], [role="dialog"], .euiPopover__panel'
        )
      ) {
        return;
      }
      clearSelection();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [clearSelection]);

  const handleLayout = useCallback(
    (mode: SelectedPanelsLayoutMode) => {
      applyLayout(mode);
      setIsLayoutPopoverOpen(false);
    },
    [applyLayout]
  );

  const layoutLabel = dashboardPanelContextMenuStrings.getLayoutLabel();

  return (
    <div
      ref={rootRef}
      css={styles.toolbar}
      data-ready={isReady}
      data-exiting={isExiting}
      data-skip-entrance={skipEntrance}
      role="toolbar"
      aria-label={strings.getToolbarLabel()}
      data-test-subj="dashboardSelectedPanelsToolbar"
    >
      {/* clipped frame: revealed from the bottom edge when expanding; the shadow lives on the
          parent as a drop-shadow so it follows the clipped shape */}
      <div ref={frameRef} css={styles.frame}>
        <EuiPanel
          hasShadow={false}
          hasBorder={false}
          paddingSize="none"
          borderRadius="m"
          css={styles.surface}
          aria-hidden
        />
        <div css={styles.content}>
          {isMoreMounted && (
            <div
              ref={moreRef}
              css={styles.more}
              data-test-subj="dashboardSelectedPanelsToolbarMore"
            >
              <EuiContextMenuItem
                icon="palette"
                // not implemented yet
                onClick={() => {}}
                data-test-subj="dashboardSelectedPanelsToolbarShareColors"
              >
                {strings.getShareColorMapping()}
              </EuiContextMenuItem>
              {annotationsVisibility !== 'none' && (
                <EuiContextMenuItem
                  icon="flag"
                  onClick={toggleAnnotations}
                  data-test-subj="dashboardSelectedPanelsToolbarToggleAnnotations"
                >
                  {/* keyed so the new label crossfades in after the toggle */}
                  <span key={annotationsVisibility} css={styles.labelSwap}>
                    {annotationsVisibility === 'visible'
                      ? strings.getHideAnnotations()
                      : strings.getShowAnnotations()}
                  </span>
                </EuiContextMenuItem>
              )}
              <EuiContextMenuItem
                icon={<EuiIcon type="trash" color="danger" aria-hidden />}
                onClick={remove}
                css={styles.danger}
                data-test-subj="dashboardSelectedPanelsToolbarRemove"
              >
                {strings.getDeletePanels()}
              </EuiContextMenuItem>
              <EuiHorizontalRule margin="s" />
            </div>
          )}
          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <ActionButton
                label={strings.getClearSelection()}
                iconType="cross"
                onClick={clearSelection}
                data-test-subj="dashboardSelectedPanelsToolbarClear"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s" css={styles.count} data-test-subj="dashboardSelectedPanelsCount">
                {strings.getSelectedCount(selectedPanelIds.size)}
              </EuiText>
            </EuiFlexItem>
            <div css={styles.separator} aria-hidden />
            {addToChat && (
              <EuiFlexItem grow={false} css={isAddToChatLate ? styles.lateButton : undefined}>
                <AiButton
                  iconOnly
                  variant="empty"
                  size="s"
                  iconType="addToChat"
                  aria-label={strings.getAddToChat()}
                  withToolTip
                  onClick={() => addToChat.execute()}
                  data-test-subj="dashboardSelectedPanelsToolbarAddToChat"
                />
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={false}>
              <ActionButton
                label={dashboardClonePanelActionStrings.getDisplayName()}
                iconType="copy"
                onClick={duplicate}
                data-test-subj="dashboardSelectedPanelsToolbarDuplicate"
              />
            </EuiFlexItem>
            {canCopyToDashboard && (
              <EuiFlexItem grow={false}>
                <ActionButton
                  label={dashboardCopyToDashboardActionStrings.getDisplayName()}
                  iconType="addToDashboard"
                  onClick={copyToDashboard}
                  data-test-subj="dashboardSelectedPanelsToolbarCopyToDashboard"
                />
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={false}>
              <ActionButton
                label={strings.getGroupIntoSection()}
                tooltip={canGroup ? undefined : strings.getGroupDisabled()}
                iconType="section"
                onClick={group}
                isDisabled={!canGroup}
                data-test-subj="dashboardSelectedPanelsToolbarGroup"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiPopover
                isOpen={isLayoutPopoverOpen}
                closePopover={() => setIsLayoutPopoverOpen(false)}
                anchorPosition="upCenter"
                panelPaddingSize="none"
                aria-label={layoutLabel}
                button={
                  <ActionButton
                    label={layoutLabel}
                    iconType="grid"
                    onClick={() => setIsLayoutPopoverOpen((open) => !open)}
                    isSelected={isLayoutPopoverOpen}
                    data-test-subj="dashboardSelectedPanelsToolbarLayout"
                  />
                }
              >
                <EuiContextMenuPanel
                  items={[
                    <EuiContextMenuItem
                      key="header"
                      icon="alignTop"
                      onClick={() => handleLayout('header')}
                      data-test-subj="dashboardSelectedPanelsToolbarLayoutHeader"
                    >
                      {dashboardPanelContextMenuStrings.getLayoutHeaderLabel()}
                    </EuiContextMenuItem>,
                    <EuiContextMenuItem
                      key="grid"
                      icon="grid"
                      onClick={() => handleLayout('grid')}
                      data-test-subj="dashboardSelectedPanelsToolbarLayoutGrid"
                    >
                      {dashboardPanelContextMenuStrings.getLayoutGridLabel()}
                    </EuiContextMenuItem>,
                    <EuiContextMenuItem
                      key="side"
                      icon="boxesHorizontal"
                      onClick={() => handleLayout('side')}
                      data-test-subj="dashboardSelectedPanelsToolbarLayoutSide"
                    >
                      {dashboardPanelContextMenuStrings.getLayoutSideLabel()}
                    </EuiContextMenuItem>,
                  ]}
                />
              </EuiPopover>
            </EuiFlexItem>
            <div css={styles.separator} aria-hidden />
            <EuiFlexItem grow={false}>
              <ActionButton
                label={isExpanded ? strings.getShowLess() : strings.getShowMore()}
                iconType={ExpandToggleIcon}
                onClick={toggle}
                aria-expanded={isExpanded}
                data-test-subj="dashboardSelectedPanelsToolbarToggleMore"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      </div>
    </div>
  );
};

const EASE_OUT = 'cubic-bezier(0.2, 0, 0, 1)';

const toolbarEnter = keyframes({
  from: { opacity: 0, translate: '0 8px', scale: '0.97' },
  to: { opacity: 1, translate: '0 0', scale: '1' },
});

// quieter than the entrance: smaller travel, faster, eases in as the user moves on
const toolbarExit = keyframes({
  from: { opacity: 1, translate: '0 0', scale: '1' },
  to: { opacity: 0, translate: '0 4px', scale: '0.98' },
});

const fadeInSharpen = keyframes({
  from: { opacity: 0, filter: 'blur(2px)' },
  to: { opacity: 1, filter: 'blur(0)' },
});

const popIn = keyframes({
  from: { opacity: 0, scale: '0.9' },
  to: { opacity: 1, scale: '1' },
});

const expandIconStyles = {
  position: 'relative' as const,
  display: 'inline-block',
  '& > *': {
    position: 'absolute' as const,
    inset: 0,
    transition: `opacity 150ms ${EASE_OUT}, transform 150ms ${EASE_OUT}, filter 150ms ${EASE_OUT}`,
  },
  '.dshExpandIcon__minimize, [aria-expanded="true"] & .dshExpandIcon__maximize': {
    opacity: 0,
    transform: 'scale(0.6)',
    filter: 'blur(3px)',
  },
  '[aria-expanded="true"] & .dshExpandIcon__minimize': {
    opacity: 1,
    transform: 'none',
    filter: 'none',
  },
  '@media (prefers-reduced-motion: reduce)': {
    '& > *': { transition: 'none' },
  },
};

const toolbarStyles = {
  // bottom-centered anchor: the toolbar grows upward and equally to both sides
  toolbar: ({ euiTheme }: UseEuiTheme) => {
    const shadowColor = transparentize(euiTheme.colors.shadow, 0.16);
    return {
      position: 'fixed' as const,
      bottom: euiTheme.size.l,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: euiTheme.levels.flyout,
      filter: `drop-shadow(0 1px 2px ${shadowColor}) drop-shadow(0 6px 16px ${shadowColor})`,
      // one-shot entrance when the first panel gets selected; `translate` and `scale` compose
      // with the centering `transform` above
      transformOrigin: 'center bottom',
      animation: `${toolbarEnter} 200ms ${EASE_OUT}`,
      '&[data-ready="false"]': { opacity: 0, animation: 'none' },
      '&[data-skip-entrance="true"]': { animation: 'none' },
      '&[data-exiting="true"]': {
        animation: `${toolbarExit} 150ms cubic-bezier(0.4, 0, 1, 1) forwards`,
        pointerEvents: 'none' as const,
      },
      '@media (prefers-reduced-motion: reduce)': {
        '&, &[data-exiting="true"]': { animation: 'none' },
      },
    };
  },
  frame: ({ euiTheme }: UseEuiTheme) => ({
    position: 'relative' as const,
    borderRadius: euiTheme.border.radius.medium,
    transformOrigin: 'center bottom',
  }),
  surface: {
    position: 'absolute' as const,
    inset: 0,
  },
  content: ({ euiTheme }: UseEuiTheme) => ({
    position: 'relative' as const,
    padding: euiTheme.size.s,
  }),
  more: ({ euiTheme }: UseEuiTheme) => ({
    display: 'flow-root' as const,
    // Keep the persistent button row in control of the toolbar's width.
    width: 0,
    minWidth: '100%',
    '.euiContextMenuItem': {
      borderRadius: euiTheme.border.radius.small,
      transition: `background-color 110ms ${EASE_OUT}`,
    },
    // pale row highlight, only on devices that really hover
    '@media (hover: hover) and (pointer: fine)': {
      '.euiContextMenuItem:hover': {
        backgroundColor: euiTheme.colors.backgroundBaseInteractiveHover,
        textDecoration: 'none',
      },
      '.euiContextMenuItem:hover .euiContextMenuItem__text': { textDecoration: 'none' },
    },
  }),
  labelSwap: {
    animation: `${fadeInSharpen} 120ms ${EASE_OUT}`,
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
  },
  lateButton: {
    animation: `${popIn} 150ms ${EASE_OUT}`,
    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
  },
  count: ({ euiTheme }: UseEuiTheme) => ({
    paddingRight: euiTheme.size.s,
    whiteSpace: 'nowrap' as const,
  }),
  separator: ({ euiTheme }: UseEuiTheme) => ({
    width: euiTheme.border.width.thin,
    alignSelf: 'stretch',
    backgroundColor: euiTheme.border.color,
    margin: `${euiTheme.size.xs} ${euiTheme.size.m}`,
  }),
  danger: ({ euiTheme }: UseEuiTheme) => ({
    color: euiTheme.colors.textDanger,
  }),
};
