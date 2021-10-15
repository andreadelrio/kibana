/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

<<<<<<< HEAD
<<<<<<< HEAD:src/plugins/presentation_util/public/services/kibana/controls.ts
=======
>>>>>>> devon/controls/optionsListSelectionManagement2
import { PluginServiceFactory } from '../create';
import { getCommonControlsService, PresentationControlsService } from '../controls';

export type ControlsServiceFactory = PluginServiceFactory<PresentationControlsService>;
export const controlsServiceFactory = () => getCommonControlsService();
<<<<<<< HEAD
=======
import { services as apiIntegrationServices } from '../api_integration/services';

export const services = {
  ...apiIntegrationServices,
};
>>>>>>> devon/controls/optionsListSelectionManagement2:test/interactive_setup_api_integration/services.ts
=======
>>>>>>> devon/controls/optionsListSelectionManagement2
