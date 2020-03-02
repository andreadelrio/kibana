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

import React, { useState } from 'react';
import { EuiFieldText, EuiFormRow, EuiSelect, EuiSwitch } from '@elastic/eui';
import { ActionFactory, ActionFactoryBaseConfig } from './action_wizard';

export const dashboards = [
  { id: 'dashboard1', title: 'Dashboard 1' },
  { id: 'dashboard2', title: 'Dashboard 2' },
];

export const DashboardDrilldownActionFactory: ActionFactory<
  {
    dashboardId: string;
    useCurrentDashboardFilters: boolean;
    useCurrentDashboardDataRange: boolean;
  },
  {
    dashboards: Array<{ id: string; title: string }>;
  }
> = {
  type: 'Dashboard',
  displayName: 'Go to Dashboard',
  iconType: 'dashboardApp',
  wizard: props => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [config, setConfig] = useState(
      props.config || {
        dashboardId: undefined,
        useCurrentDashboardDataRange: false,
        useCurrentDashboardFilters: false,
      }
    );

    function setAndSubmit(newConfig: {
      dashboardId: string | undefined;
      useCurrentDashboardFilters: boolean;
      useCurrentDashboardDataRange: boolean;
    }) {
      // validate
      if (newConfig.dashboardId) {
        props.onConfig({ ...newConfig, dashboardId: newConfig.dashboardId });
      } else {
        props.onConfig(null);
      }

      setConfig(newConfig);
    }

    return (
      <>
        <EuiFormRow label="Choose destination dashboard:">
          <EuiSelect
            name="selectDashboard"
            hasNoInitialSelection={true}
            options={props.context.dashboards.map(({ id, title }) => ({ value: id, text: title }))}
            value={config.dashboardId}
            onChange={e => {
              setAndSubmit({
                ...config,
                dashboardId: e.target.value,
              });
            }}
          />
        </EuiFormRow>
        <EuiFormRow hasChildLabel={false}>
          <EuiSwitch
            name="useCurrentFilters"
            label="Use current dashboard's filters"
            checked={config.useCurrentDashboardFilters}
            onChange={() =>
              setAndSubmit({
                ...config,
                useCurrentDashboardFilters: !config.useCurrentDashboardFilters,
              })
            }
          />
        </EuiFormRow>
        <EuiFormRow hasChildLabel={false}>
          <EuiSwitch
            name="useCurrentDateRange"
            label="Use current dashboard's date range"
            checked={config.useCurrentDashboardDataRange}
            onChange={() =>
              setAndSubmit({
                ...config,
                useCurrentDashboardDataRange: !config.useCurrentDashboardDataRange,
              })
            }
          />
        </EuiFormRow>
      </>
    );
  },
  context: {
    dashboards,
  },
};

export const UrlDrilldownActionFactory: ActionFactory<{ url: string; openInNewTab: boolean }> = {
  type: 'Url',
  displayName: 'Go to URL',
  iconType: 'link',
  wizard: props => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [config, setConfig] = useState(props.config || { url: '', openInNewTab: false });

    function setAndSubmit(newConfig: { url: string; openInNewTab: boolean }) {
      // validate
      if (newConfig.url) {
        props.onConfig(newConfig);
      } else {
        props.onConfig(null);
      }

      setConfig(newConfig);
    }

    return (
      <>
        <EuiFormRow label="Enter target URL">
          <EuiFieldText
            placeholder="Enter URL"
            name="url"
            value={config.url}
            onChange={event => setAndSubmit({ ...config, url: event.target.value })}
          />
        </EuiFormRow>
        <EuiFormRow hasChildLabel={false}>
          <EuiSwitch
            name="openInNewTab"
            label="Open in new tab?"
            checked={config.openInNewTab}
            onChange={() => setAndSubmit({ ...config, openInNewTab: !config.openInNewTab })}
          />
        </EuiFormRow>
      </>
    );
  },
  context: null,
};

export const ACTION_FACTORIES = [
  DashboardDrilldownActionFactory,
  UrlDrilldownActionFactory,
] as Array<ActionFactory<ActionFactoryBaseConfig, unknown>>;
