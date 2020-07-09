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
import React, { ReactNode, useMemo } from 'react';
import { i18n } from '@kbn/i18n';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  useRenderToText,
} from '@elastic/eui';

export function DiscoverGridPopover({
  value,
  onPositiveFilterClick,
  onNegativeFilterClick,
}: {
  value: string | ReactNode;
  onPositiveFilterClick: () => void;
  onNegativeFilterClick: () => void;
}) {
  const node = useMemo(() => <>{value}!</>, [value]);
  const placeholder = i18n.translate('discover.grid.filterValuePlaceholder', {
    defaultMessage: 'value',
  });
  const text = useRenderToText(node, placeholder);
  return (
    <>
      {value}
      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="none">
        <EuiFlexItem>
          <EuiButtonEmpty
            iconType="plusInCircle"
            aria-label={i18n.translate('discover.grid.ariaFilterOn', {
              defaultMessage: 'Filter on {value}',
              values: { value: text },
            })}
            onClick={onPositiveFilterClick}
          >
            {i18n.translate('discover.grid.filterOn', {
              defaultMessage: 'Filter on value',
            })}
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiButtonEmpty
            iconType="minusInCircle"
            aria-label={i18n.translate('discover.grid.ariaFilterOut', {
              defaultMessage: 'Filter without {value}',
              values: { value: text },
            })}
            color="danger"
            onClick={onNegativeFilterClick}
          >
            {i18n.translate('discover.grid.filterOut', {
              defaultMessage: 'Filter without value',
            })}
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
}
