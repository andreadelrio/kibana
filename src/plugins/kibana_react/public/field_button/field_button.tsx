/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './field_button.scss';

export interface FieldButtonProps {
  isOpen?: boolean;
  fieldIcon?: ReactNode;
  fieldName?: ReactNode;
  fieldInfoIcon?: ReactNode;
  fieldAction?: ReactNode;
  isDraggable?: boolean;
  size?: ButtonSize;
  className?: string;
}

/**
 * Wraps Object.keys with proper typescript definition of the resulting array
 */
function keysOf<T, K extends keyof T>(obj: T): K[] {
  return Object.keys(obj) as K[];
}

export type ButtonSize = 's' | 'm';

const sizeToClassNameMap: { [size in ButtonSize]: string | null } = {
  s: 'kbnFieldButton--small',
  m: null,
};

export const SIZES = keysOf(sizeToClassNameMap);

export function FieldButton({
  size = 'm',
  isOpen,
  fieldIcon,
  fieldName,
  fieldInfoIcon,
  fieldAction,
  className,
  isDraggable = false,
  ...rest
}: FieldButtonProps) {
  const classes = classNames(
    'kbnFieldButton',
    size ? sizeToClassNameMap[size] : null,
    { 'kbnFieldButton-isOpen': isOpen },
    { 'kbnFieldButton--isDraggable': isDraggable },
    className
  );

  return (
    <div className={classes} {...rest}>
      <div className="kbnFieldButton__content">
        <div className="kbnFieldButton__fieldIcon">{fieldIcon}</div>
        <div className="kbnFieldButton__name">{fieldName}</div>
        <div className="kbnFieldButton__fieldAction">{fieldAction}</div>
        <div className="kbnFieldButton__infoIcon">{fieldInfoIcon}</div>
      </div>
    </div>
  );
}
