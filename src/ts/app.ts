/**
 * This module provides the default root application for the nexus PHP deployment
 */

import * as $ from 'jquery';
import * as ng from 'angular';
import UiCoreModule from './nexus.ui.core/Module';

ng.module('NexusDeploymentUi', [ UiCoreModule ]);
