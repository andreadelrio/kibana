/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import {
  EuiIcon,
  EuiButtonEmpty,
  EuiNotificationBadge,
  EuiPopover,
  EuiFieldSearch,
  EuiFilterSelectItem,
  EuiPopoverTitle,
  EuiSelectableProps,
  EuiFormControlLayout,
} from '@elastic/eui';

import classNames from 'classnames';
import { startCase } from 'lodash';
import React, { useState } from 'react';

import './options_list_control.scss';

interface OptionsListControlProps extends Pick<EuiSelectableProps, 'options'> {
  twoLine?: boolean;
  title: string;
}

export const OptionsListControl = ({ twoLine, title, options }: OptionsListControlProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectableOptions, setSelectableOptions] = useState(options);

  const selected = selectableOptions.filter((option) => option.checked);

  function updateItem(index: number) {
    if (!selectableOptions[index]) {
      return;
    }
    const newItems = [...selectableOptions];
    newItems[index].checked = newItems[index].checked === 'on' ? undefined : 'on';
    setSelectableOptions(newItems);
  }

  const button = (
    <EuiButtonEmpty
      color="text"
      className={classNames('optionsList--buttonOverride', {
        'optionsList--buttonOverrideTwoLine': twoLine,
        'optionsList--buttonOverrideSingle': !twoLine,
      })}
      textProps={{
        className: classNames('optionsList', {
          'optionsList--twoLine': twoLine,
        }),
      }}
      onClick={() => setIsPopoverOpen((open) => !open)}
      contentProps={{ className: 'optionsList--buttonContentOverride' }}
    >
      {twoLine ? <span className="optionsList--title">{startCase(title)}</span> : null}
      <span className="optionsList--control">
        <span
          className={classNames('optionsList--selections', {
            'optionsList--selectionsEmpty': selected.length === 0,
          })}
        >
          {selected.length === 0 ? 'Select...' : selected.map((item) => item.label).join(', ')}
        </span>

        <span
          className="optionsList--notification"
          style={{ visibility: selected.length > 1 ? 'visible' : 'hidden' }}
        >
          <EuiNotificationBadge size={'m'} color="subdued">
            {selected.length}
          </EuiNotificationBadge>
        </span>

        <span className="optionsList--notification">
          <EuiIcon type={'arrowDown'} />
        </span>
      </span>
    </EuiButtonEmpty>
  );

  return (
    <>
      {twoLine ? (
        <EuiPopover
          id="popoverExampleMultiSelect"
          button={button}
          isOpen={isPopoverOpen}
          anchorClassName="optionsList--anchorOverride"
          closePopover={() => setIsPopoverOpen(false)}
          panelPaddingSize="none"
          anchorPosition="upLeft"
          ownFocus
          repositionOnScroll
        >
          <EuiPopoverTitle paddingSize="s">{title}</EuiPopoverTitle>
          <div className="optionsList--search">
            <EuiFieldSearch compressed />
          </div>
          <div className="optionsList--items">
            {selectableOptions.map((item, index) => (
              <EuiFilterSelectItem
                checked={item.checked}
                key={index}
                onClick={() => updateItem(index)}
              >
                {item.label}
              </EuiFilterSelectItem>
            ))}
          </div>
        </EuiPopover>
      ) : (
        <EuiFormControlLayout
          className="optionsList--formControlLayout"
          prepend={
            <EuiButtonEmpty color="text" size="s" iconSide="right">
              {startCase(title)}
            </EuiButtonEmpty>
          }
        >
          <EuiPopover
            id="popoverExampleMultiSelect"
            button={button}
            className="optionsList--popoverOverride"
            anchorClassName="optionsList--anchorOverride"
            isOpen={isPopoverOpen}
            closePopover={() => setIsPopoverOpen(false)}
            panelPaddingSize="none"
          >
            <EuiPopoverTitle paddingSize="s">{title}</EuiPopoverTitle>
            <div className="optionsList--search">
              <EuiFieldSearch compressed />
            </div>
            <div className="optionsList--items">
              {selectableOptions.map((item, index) => (
                <EuiFilterSelectItem
                  checked={item.checked}
                  key={index}
                  onClick={() => updateItem(index)}
                >
                  {item.label}
                </EuiFilterSelectItem>
              ))}
            </div>
          </EuiPopover>
        </EuiFormControlLayout>
      )}
    </>
  );
};
