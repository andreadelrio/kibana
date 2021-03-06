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
import { EuiFlyoutBody, EuiFlyoutHeader, EuiTitle } from '@elastic/eui';
import React from 'react';
import { getNewPlatform } from 'ui/new_platform';

import {
  ContextMenuAction,
  ContextMenuActionsRegistryProvider,
  PanelActionAPI,
} from 'ui/embeddable';

class SamplePanelAction extends ContextMenuAction {
  constructor() {
    super({
      displayName: 'Sample Panel Action',
      id: 'samplePanelAction',
      parentPanelId: 'mainMenu',
    });
  }
  public onClick = ({ embeddable }: PanelActionAPI) => {
    if (!embeddable) {
      return;
    }
    getNewPlatform().start.core.overlays.openFlyout(
      <React.Fragment>
        <EuiFlyoutHeader>
          <EuiTitle size="m" data-test-subj="samplePanelActionTitle">
            <h2>{embeddable.metadata.title}</h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <h3 data-test-subj="samplePanelActionBody">This is a sample action</h3>
        </EuiFlyoutBody>
      </React.Fragment>,
      {
        'data-test-subj': 'samplePanelActionFlyout',
      }
    );
  };
}

ContextMenuActionsRegistryProvider.register(() => new SamplePanelAction());
