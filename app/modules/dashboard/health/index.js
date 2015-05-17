import angular from 'angular'
import uiRouter from 'angular-ui-router'

import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'

export default angular.module('dashboard.health', [
  uiRouter,

  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard.health', {
      controller: 'Health as ctrl',
      url: '/health',
      template: view
    })
  })
  .controller('Health', function (xoApi, xo, notify) {
  })
  .name
