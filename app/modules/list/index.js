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
    this.hosts = xoApi.getView('host')
    this.pools = xoApi.getView('pool')
    this.SRs = xoApi.getView('pool')
    this.VMs = xoApi.getView('VM')
  })

  // A module exports its name.
  .name
