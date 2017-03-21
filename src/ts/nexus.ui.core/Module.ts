import * as ng from 'angular';
import 'angular-material';
import 'angular-resource';

import * as auth from './Services/AuthService';
import * as repos from './Services/Repository';

const MODULE_NAME: string = 'nexus.ui.core';
let UiCoreModule = ng.module(MODULE_NAME, [ 'ngMaterial', 'ngResource']);

UiCoreModule.service(auth.SERVICE_NAME, auth.OAuthService)
    .factory(repos.API_SERVICE_NAME, function() {});

export {UiCoreModule};
export default MODULE_NAME;
