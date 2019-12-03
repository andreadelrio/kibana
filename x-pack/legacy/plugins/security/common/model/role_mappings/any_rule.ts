/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { BaseRuleGroup } from './base_rule_group';
import { BaseRule } from './base_rule';

export class AnyRule extends BaseRuleGroup {
  constructor(public readonly isNegated: boolean, private rules: BaseRule[]) {
    super(isNegated);
  }

  public getRules() {
    return [...this.rules];
  }

  public getType() {
    return `any`;
  }

  public getDisplayTitle() {
    if (this.isNegated) {
      return `None of the following are true`;
    }
    return `Any of the following are true`;
  }

  public replaceRule(ruleIndex: number, rule: BaseRule) {
    this.rules.splice(ruleIndex, 1, rule);
  }

  public removeRule(ruleIndex: number) {
    this.rules.splice(ruleIndex, 1);
  }

  public addRule(rule: BaseRule) {
    this.rules.push(rule);
  }

  public clone() {
    return new AnyRule(
      this.isNegated,
      this.rules.map(r => r.clone())
    );
  }

  public toRaw() {
    const rawRule = {
      any: [...this.rules.map(rule => rule.toRaw())],
    };

    if (this.isNegated) {
      return {
        except: rawRule,
      };
    }
    return rawRule;
  }
}
