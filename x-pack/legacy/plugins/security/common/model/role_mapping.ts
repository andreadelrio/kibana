/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

export type RoleMappingUserFields = 'username' | 'dn' | 'groups' | 'metadata' | 'realm' | string;

export type RoleMappingFieldRuleValue = string | number | null | Array<string | number | null>;

export interface RoleMappingAnyRule {
  any: RoleMappingRule[];
}

export interface RoleMappingAllRule {
  all: RoleMappingRule[];
}

export interface RoleMappingFieldRule {
  field: Record<RoleMappingUserFields, RoleMappingFieldRuleValue>;
}

export interface RoleMappingExceptRule {
  except: RoleMappingRule;
}

export type RoleMappingRule =
  | RoleMappingAnyRule
  | RoleMappingAllRule
  | RoleMappingFieldRule
  | RoleMappingExceptRule;

export type RoleMappingRuleType =
  | 'field'
  | 'all'
  | 'any'
  | 'exceptAll'
  | 'exceptAny'
  | 'exceptField';

export type RoleTemplateFormat = 'string' | 'json';

export interface InlineRoleTemplate {
  template: { source: string };
  format?: RoleTemplateFormat;
}

export interface StoredRoleTemplate {
  template: { id: string };
  format?: RoleTemplateFormat;
}

export interface InvalidRoleTemplate {
  template: string;
  format?: RoleTemplateFormat;
}

export type RoleTemplate = InlineRoleTemplate | StoredRoleTemplate | InvalidRoleTemplate;

export interface RoleMapping {
  name: string;
  enabled: boolean;
  roles?: string[];
  role_templates?: RoleTemplate[];
  rules: RoleMappingRule | {};
  metadata: Record<string, any>;
}
