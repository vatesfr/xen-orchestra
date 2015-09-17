import angular from 'angular'
import uiRouter from 'angular-ui-router'
import xoTag from 'tag'

import xoApi from 'xo-api'

import view from './view'

// ===================================================================

export default angular.module('xoWebApp.list', [
  uiRouter,
  xoApi,
  xoTag
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
    this.SRs = xoApi.getView('SR')
    this.VMs = xoApi.getView('VM')

    this.hostsByPool = xoApi.getIndex('hostsByPool')
    this.runningHostsByPool = xoApi.getIndex('runningHostsByPool')
    this.vmsByContainer = xoApi.getIndex('vmsByContainer')
  })

  // A module exports its name.
  .name
