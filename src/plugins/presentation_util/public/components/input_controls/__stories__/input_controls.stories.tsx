/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';

import { EuiFlexGrid, EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';

import { decorators } from './decorators';
import { getEuiSelectableOptions, FlightField, flightFields } from './flights';
import { OptionsListControl } from '../options_list/options_list_control';

export default {
  title: 'Input Controls',
  description: '',
  decorators,
};

interface OptionsListStorybookArgs {
  fields: FlightField[];
  twoLine: boolean;
}

const storybookArgs = {
  twoLine: false,
  fields: ['OriginCityName', 'OriginWeather', 'DestCityName', 'DestWeather'],
};

const storybookArgTypes = {
  fields: {
    twoLine: {
      control: { type: 'bool' },
    },
    control: {
      type: 'check',
      options: flightFields,
    },
  },
};

export const OptionsListStory = ({ fields, twoLine }: OptionsListStorybookArgs) => (
  <>
    <EuiFlexGroup alignItems="center" wrap={true} gutterSize={'s'}>
      {fields.map((field, index) => (
        <EuiFlexItem className="mili" key={field}>
          <OptionsListControl
            twoLine={twoLine}
            title={field}
            options={getEuiSelectableOptions(field)}
          />
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
    <EuiSpacer />
    <EuiFlexGrid columns={3} gutterSize={'s'}>
      {fields.map((field, index) => (
        <EuiFlexItem className="mili" key={field}>
          <div className="keidra">
            <EuiButtonEmpty>{index + 1} item</EuiButtonEmpty>
          </div>
        </EuiFlexItem>
      ))}
    </EuiFlexGrid>
  </>
);

OptionsListStory.args = storybookArgs;
OptionsListStory.argTypes = storybookArgTypes;
