/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import React, { useCallback, useReducer, useState } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { EuiTitle, EuiFlexItem, EuiIcon, EuiFlexGroup } from '@elastic/eui';
import {
  EuiModal,
  EuiButton,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
} from '@elastic/eui';
import { EuiButtonEmpty } from '@elastic/eui';
import { EuiOverlayMask } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { ActionConnectorForm } from './action_connector_form';
import { ActionType, ActionConnector } from '../../../types';
import { connectorReducer } from './connector_reducer';
import { createActionConnector } from '../../lib/action_connector_api';
import { useAppDependencies } from '../../app_context';

export const ConnectorAddModal = ({
  actionType,
  addModalVisible,
  setAddModalVisibility,
}: {
  actionType: ActionType;
  addModalVisible: boolean;
  setAddModalVisibility: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { http, toastNotifications, actionTypeRegistry } = useAppDependencies();
  const initialConnector = {
    actionTypeId: actionType.id,
    config: {},
    secrets: {},
  } as ActionConnector;
  const [hasErrors, setHasErrors] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const closeModal = useCallback(() => {
    setAddModalVisibility(false);
  }, [setAddModalVisibility]);
  const [{ connector }, dispatch] = useReducer(connectorReducer, { connector: initialConnector });
  const [serverError, setServerError] = useState<{
    body: { message: string; error: string };
  } | null>(null);

  if (!addModalVisible) {
    return null;
  }
  const actionTypeModel = actionTypeRegistry.get(actionType.id);
  async function onActionConnectorSave(): Promise<ActionConnector | undefined> {
    await createActionConnector({ http, connector })
      .then(savedConnector => {
        toastNotifications.addSuccess(
          i18n.translate(
            'xpack.triggersActionsUI.sections.actionConnectorForm.updateSuccessNotificationText',
            {
              defaultMessage: "Created '{connectorName}'",
              values: {
                connectorName: savedConnector.name,
              },
            }
          )
        );
        return savedConnector;
      })
      .catch(errorRes => {
        setServerError(errorRes);
      });
    return;
  }

  return (
    <EuiOverlayMask>
      <EuiModal onClose={closeModal}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <EuiFlexGroup gutterSize="m" alignItems="center">
              {actionTypeModel && actionTypeModel.iconClass ? (
                <EuiFlexItem grow={false}>
                  <EuiIcon type={actionTypeModel.iconClass} size="xl" />
                </EuiFlexItem>
              ) : null}
              <EuiFlexItem>
                <EuiTitle size="s">
                  <h3 id="flyoutTitle">
                    <FormattedMessage
                      defaultMessage="{actionTypeName} connector"
                      id="xpack.triggersActionsUI.sections.addConnectorForm.flyoutTitle"
                      values={{
                        actionTypeName: actionType.name,
                      }}
                    />
                  </h3>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <ActionConnectorForm
            connector={connector}
            actionTypeName={actionType.name}
            dispatch={dispatch}
            serverError={serverError}
            setHasErrors={setHasErrors}
          />
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={closeModal}>
            {i18n.translate(
              'xpack.triggersActionsUI.sections.actionConnectorAddModal.cancelButtonLabel',
              {
                defaultMessage: 'Cancel',
              }
            )}
          </EuiButtonEmpty>

          <EuiButton
            fill
            color="secondary"
            data-test-subj="saveActionButtonModal"
            type="submit"
            iconType="check"
            isDisabled={hasErrors}
            isLoading={isSaving}
            onClick={async () => {
              setIsSaving(true);
              const savedAction = await onActionConnectorSave();
              setIsSaving(false);
              if (savedAction) {
                closeModal();
              }
            }}
          >
            <FormattedMessage
              id="xpack.triggersActionsUI.sections.actionConnectorAddModal.saveButtonLabel"
              defaultMessage="Save"
            />
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
};
