import angular from 'angular'
import uiRouter from 'angular-ui-router'

import xoApi from 'xo-api'

import view from './view'

// ===================================================================

export default angular.module('xoWebApp.list', [
  uiRouter,
  xoApi
])
  .config(function ($stateProvider) {
    $stateProvider.state('list', {
      url: '/list',
      controller: 'ListCtrl as list',
      template: view
    })
  })
  .controller('ListCtrl', function (xoApi) {
    this.byTypes = xoApi.byTypes
  })

  // A module exports its name.
  .name
