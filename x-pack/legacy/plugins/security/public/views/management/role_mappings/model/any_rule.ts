/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { i18n } from '@kbn/i18n';
import { RuleGroup } from './rule_group';
import { Rule } from './rule';
import { ExceptAllRule } from './except_all_rule';
import { ExceptAnyRule } from './except_any_rule';
import { ExceptFieldRule } from './except_field_rule';
/**
 * Represents a group of rules in which at least one must evaluate to true.
 */
export class AnyRule extends RuleGroup {
  constructor(private rules: Rule[] = []) {
    super();
  }

  /** {@see RuleGroup.getRules} */
  public getRules() {
    return [...this.rules];
  }

  /** {@see RuleGroup.getType} */
  public getType() {
    return `any`;
  }

  /** {@see RuleGroup.getDisplayTitle} */
  public getDisplayTitle() {
    return i18n.translate('xpack.security.management.editRoleMapping.anyRule.displayTitle', {
      defaultMessage: 'Any of the following are true',
    });
  }

  /** {@see RuleGroup.replaceRule} */
  public replaceRule(ruleIndex: number, rule: Rule) {
    this.rules.splice(ruleIndex, 1, rule);
  }

  /** {@see RuleGroup.removeRule} */
  public removeRule(ruleIndex: number) {
    this.rules.splice(ruleIndex, 1);
  }

  /** {@see RuleGroup.addRule} */
  public addRule(rule: Rule) {
    this.rules.push(rule);
  }

  /** {@see RuleGroup.canContainRule} */
  public canContainRule(rule: Rule) {
    const forbiddenRules = [ExceptAllRule, ExceptAnyRule, ExceptFieldRule];
    return forbiddenRules.every(forbiddenRule => !(rule instanceof forbiddenRule));
  }

  /** {@see RuleGroup.clone} */
  public clone() {
    return new AnyRule(this.rules.map(r => r.clone()));
  }

  /** {@see RuleGroup.toRaw} */
  public toRaw() {
    return {
      any: [...this.rules.map(rule => rule.toRaw())],
    };
  }
}
