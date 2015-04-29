import angular from 'angular';
import uiRouter from 'angular-ui-router';

import xoApi from 'xo-api';
import xoServices from 'xo-services';

import view from './view';

export default angular.module('settings.update', [
  uiRouter,

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
  .controller('SettingsUpdate', function (xoApi, xo) {
  })
  .name
;
