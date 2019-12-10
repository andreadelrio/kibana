/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Fragment } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiFieldText,
  EuiSwitch,
  EuiCallOut,
  EuiText,
  EuiButtonEmpty,
} from '@elastic/eui';
import { RoleTemplate } from '../../../../../../../common/model';
import {
  isInlineRoleTemplate,
  isStoredRoleTemplate,
  isInvalidRoleTemplate,
} from '../../services/role_template_type';
import { RoleTemplateTypeSelect } from './role_template_type_select';

interface Props {
  roleTemplate: RoleTemplate;
  canUseInlineScripts: boolean;
  canUseStoredScripts: boolean;
  onChange: (roleTemplate: RoleTemplate) => void;
  onDelete: (roleTemplate: RoleTemplate) => void;
}

export const RoleTemplateEditor = ({
  roleTemplate,
  onChange,
  onDelete,
  canUseInlineScripts,
  canUseStoredScripts,
}: Props) => {
  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      {getTemplateConfigurationFields()}
      {getEditorForTemplate()}
      <EuiFlexItem grow={false}>
        <EuiFormRow>
          <EuiButtonEmpty color="danger" onClick={() => onDelete(roleTemplate)} size="s">
            <FormattedMessage
              id="xpack.security.management.editRoleMapping.deleteRoleTemplateButton"
              defaultMessage="Delete role template"
            />
          </EuiButtonEmpty>
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  function getTemplateFormatSwitch() {
    const returnsJsonLabel = (
      <FormattedMessage
        id="xpack.security.management.editRoleMapping.roleTemplateReturnsJson"
        defaultMessage="Returns JSON"
      />
    );
    return (
      <EuiFormRow label={returnsJsonLabel}>
        <EuiSwitch
          checked={roleTemplate.format === 'json'}
          label={returnsJsonLabel}
          showLabel={false}
          onChange={e => {
            onChange({
              ...roleTemplate,
              format: e.target.checked ? 'json' : 'string',
            });
          }}
        />
      </EuiFormRow>
    );
  }

  function getTemplateConfigurationFields() {
    const templateTypeComboBox = (
      <EuiFlexItem>
        <EuiFormRow
          label={
            <FormattedMessage
              id="xpack.security.management.editRoleMapping.roleTemplateType"
              defaultMessage="Template type"
            />
          }
        >
          <RoleTemplateTypeSelect
            roleTemplate={roleTemplate}
            canUseStoredScripts={canUseStoredScripts}
            canUseInlineScripts={canUseInlineScripts}
            onChange={onChange}
          />
        </EuiFormRow>
      </EuiFlexItem>
    );

    const templateFormatSwitch = <EuiFlexItem>{getTemplateFormatSwitch()}</EuiFlexItem>;

    return (
      <EuiFlexItem>
        <EuiFlexGroup justifyContent="spaceBetween">
          {templateTypeComboBox}
          {templateFormatSwitch}
        </EuiFlexGroup>
      </EuiFlexItem>
    );
  }

  function getEditorForTemplate() {
    if (isInlineRoleTemplate(roleTemplate)) {
      const extraProps: Record<string, any> = {};
      if (!canUseInlineScripts) {
        extraProps.isInvalid = true;
        extraProps.error = (
          <EuiText size="xs" color="danger" data-test-subj="roleMappingInlineScriptsDisabled">
            <FormattedMessage
              id="xpack.security.management.editRoleMapping.roleTemplateInlineScriptsDisabled"
              defaultMessage="This template cannot be used because inline scripts are disabled in Elasticsearch."
            />
          </EuiText>
        );
      }
      return (
        <Fragment>
          <EuiFlexItem grow={1} style={{ maxWidth: '400px' }}>
            <EuiFormRow
              label={
                <FormattedMessage
                  id="xpack.security.management.editRoleMapping.roleTemplateLabel"
                  defaultMessage="Template"
                />
              }
              helpText={
                <FormattedMessage
                  id="xpack.security.management.editRoleMapping.roleTemplateHelpText"
                  defaultMessage="You can use mustache templates here"
                />
              }
              {...extraProps}
            >
              <EuiFieldText
                value={roleTemplate.template.source}
                onChange={e => {
                  onChange({
                    ...roleTemplate,
                    template: {
                      source: e.target.value,
                    },
                  });
                }}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </Fragment>
      );
    }

    if (isStoredRoleTemplate(roleTemplate)) {
      const extraProps: Record<string, any> = {};
      if (!canUseStoredScripts) {
        extraProps.isInvalid = true;
        extraProps.error = (
          <EuiText size="xs" color="danger" data-test-subj="roleMappingStoredScriptsDisabled">
            <FormattedMessage
              id="xpack.security.management.editRoleMapping.roleTemplateStoredScriptsDisabled"
              defaultMessage="This template cannot be used because stored scripts are disabled in Elasticsearch."
            />
          </EuiText>
        );
      }
      return (
        <Fragment>
          <EuiFlexItem grow={1} style={{ maxWidth: '400px' }}>
            <EuiFormRow
              label={
                <FormattedMessage
                  id="xpack.security.management.editRoleMapping.storedScriptLabel"
                  defaultMessage="Stored script id"
                />
              }
              helpText={
                <FormattedMessage
                  id="xpack.security.management.editRoleMapping.storedScriptHelpText"
                  defaultMessage="Enter the id of a previously stored painless or mustache script."
                />
              }
              {...extraProps}
            >
              <EuiFieldText
                value={roleTemplate.template.id}
                onChange={e => {
                  onChange({
                    ...roleTemplate,
                    template: {
                      id: e.target.value,
                    },
                  });
                }}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </Fragment>
      );
    }

    if (isInvalidRoleTemplate(roleTemplate)) {
      return (
        <EuiFlexItem grow={1}>
          <EuiCallOut
            color="warning"
            title={
              <FormattedMessage
                id="xpack.security.management.editRoleMapping.invalidRoleTemplateTitle"
                defaultMessage="Invalid role template"
              />
            }
          >
            <FormattedMessage
              id="xpack.security.management.editRoleMapping.invalidRoleTemplateMessage"
              defaultMessage="Role template is invalid, and cannot be edited here. Please delete and recreate, or fix via the Role Mapping API."
            />
          </EuiCallOut>
        </EuiFlexItem>
      );
    }

    throw new Error(`Unable to determine role template type`);
  }
};
