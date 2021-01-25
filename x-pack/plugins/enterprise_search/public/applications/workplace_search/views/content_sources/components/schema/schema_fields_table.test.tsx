/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import '../../../../../__mocks__/shallow_useeffect.mock';

import { setMockValues, setMockActions } from '../../../../../__mocks__';

import React from 'react';
import { shallow } from 'enzyme';

import { SchemaExistingField } from '../../../../../shared/schema/schema_existing_field';

import { SchemaFieldsTable } from './schema_fields_table';

describe('SchemaFieldsTable', () => {
  const filterValue = '';
  const filteredSchemaFields = {
    foo: 'string',
  };

  beforeEach(() => {
    setMockActions({ updateExistingFieldType: jest.fn() });
  });

  it('renders', () => {
    setMockValues({ filterValue, filteredSchemaFields });
    const wrapper = shallow(<SchemaFieldsTable />);

    expect(wrapper.find(SchemaExistingField)).toHaveLength(1);
  });

  it('handles no results', () => {
    setMockValues({ filterValue, filteredSchemaFields: {} });
    const wrapper = shallow(<SchemaFieldsTable />);

    expect(wrapper.find('[data-test-subj="NoResultsMessage"]')).toHaveLength(1);
  });
});
