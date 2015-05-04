import angular from 'angular';
import uiRouter from 'angular-ui-router';

import updater from '../../updater';
import xoApi from 'xo-api';
import xoServices from 'xo-services';

import view from './view';

export default angular.module('settings.update', [
  uiRouter,

  updater,
  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings.update', {
      controller: 'SettingsUpdate as ctrl',
      url: '/update',
      resolve: {
      },
      template: view
    })
  })
  .controller('SettingsUpdate', function (xoApi, xo, updater) {
    this.updater = updater
  })
  .name
;
