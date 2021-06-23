/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { i18n } from '@kbn/i18n';
import { IFieldType } from '../../../../plugins/data/public';
import { TimestampOption } from '../components/index_pattern_editor_flyout_content';

export function extractTimeFields(fields: IFieldType[]): TimestampOption[] {
  const dateFields = fields.filter((field) => field.type === 'date');

  // todo - display somewhere
  /*
  const label = i18n.translate('indexPatternEditor.createIndexPattern.stepTime.noTimeFieldsLabel', {
    defaultMessage: "The indices which match this index pattern don't contain any time fields.",
  });
  */

  if (dateFields.length === 0) {
    return [];
  }

  const noTimeFieldLabel = i18n.translate(
    'indexPatternEditor.createIndexPattern.stepTime.noTimeFieldOptionLabel',
    {
      defaultMessage: "--- I don't want to use the time filter ---",
    }
  );
  const noTimeFieldOption = {
    display: noTimeFieldLabel,
    fieldName: '',
  };

  return [
    ...dateFields.map((field) => ({
      display: field.name,
      fieldName: field.name,
    })),
    noTimeFieldOption,
  ];
}
