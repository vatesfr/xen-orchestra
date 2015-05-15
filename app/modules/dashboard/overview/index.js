import angular from 'angular';
import uiRouter from 'angular-ui-router';
import uiSelect from 'angular-ui-select';

import filter from 'lodash.filter';

import xoApi from 'xo-api';
import xoServices from 'xo-services';

import view from './view';

export default angular.module('dashboard.overview', [
  uiRouter,
  uiSelect,

  xoApi,
  xoServices,
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard.overview', {
      controller: 'Overview as ctrl',
      url: '/overview',
      template: view,
    });
  })
  .controller('Overview', function ($scope, xoApi, xo) {
    Object.defineProperty(this, 'pools', {
      get: () => xoApi.byTypes.pool
    })
  })

  .name
;
