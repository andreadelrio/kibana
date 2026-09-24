/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useCallback, useEffect, useState } from 'react';
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
  type UseEuiTheme,
} from '@elastic/eui';
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

export const SelectedPanelsToolbar = ({ selectedPanelIds }: { selectedPanelIds: Set<string> }) => {
  const dashboardApi = useDashboardApi();
  const styles = useMemoCss(toolbarStyles);
  const { isExpanded, isMoreMounted, toggle, surfaceRef, contentRef, moreRef } =
    useToolbarExpandAnimation();
  const [isLayoutPopoverOpen, setIsLayoutPopoverOpen] = useState(false);

  const { duplicate, remove, group, canGroup, applyLayout, copyToDashboard, canCopyToDashboard } =
    useBulkPanelActions(selectedPanelIds);
  const addToChat = useAddPanelsToChatAction(dashboardApi, selectedPanelIds);

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
      css={styles.toolbar}
      role="toolbar"
      aria-label={strings.getToolbarLabel()}
      data-test-subj="dashboardSelectedPanelsToolbar"
    >
      {/* the surface expands independently while the button row stays in place */}
      <EuiPanel
        panelRef={surfaceRef}
        hasShadow
        hasBorder={false}
        paddingSize="none"
        borderRadius="m"
        css={styles.surface}
        aria-hidden
      />
      <div ref={contentRef} css={styles.content}>
        {isMoreMounted && (
          <div ref={moreRef} css={styles.more} data-test-subj="dashboardSelectedPanelsToolbarMore">
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
                {annotationsVisibility === 'visible'
                  ? strings.getHideAnnotations()
                  : strings.getShowAnnotations()}
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
            <EuiFlexItem grow={false}>
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
              iconType={isExpanded ? 'minimize' : 'maximize'}
              onClick={toggle}
              aria-expanded={isExpanded}
              data-test-subj="dashboardSelectedPanelsToolbarToggleMore"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </div>
  );
};

const toolbarStyles = {
  // bottom-centered anchor: the toolbar grows upward and equally to both sides
  toolbar: ({ euiTheme }: UseEuiTheme) => ({
    position: 'fixed' as const,
    bottom: euiTheme.size.l,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: euiTheme.levels.flyout,
  }),
  surface: {
    position: 'absolute' as const,
    left: '50%',
    bottom: 0,
    width: '100%',
    height: '100%',
    transform: 'translateX(-50%)',
    transformOrigin: 'center bottom',
  },
  content: ({ euiTheme }: UseEuiTheme) => ({
    position: 'relative' as const,
    padding: euiTheme.size.s,
  }),
  more: {
    display: 'flow-root' as const,
    // Keep the persistent button row in control of the toolbar's width.
    width: 0,
    minWidth: '100%',
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
