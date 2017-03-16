import * as ng from 'angular';
import 'angular-material';
import 'angular-resource';

import {AuthenticationService} from './Services/AuthenticationService';

ng.module('nexus.ui.core', [
   'ngMaterial',
   'ngResource'
])
.service(AuthenticationService.SERVICE_NAME, AuthenticationService);