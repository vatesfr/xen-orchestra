import angular from 'angular'
import uiRouter from 'angular-ui-router'

import management from './management'
import rollingSnapshot from './rolling-snapshot'

import view from './view'

export default angular.module('scheduler', [
  uiRouter,

  management,
  rollingSnapshot
])
  .config(function ($stateProvider) {
    $stateProvider.state('scheduler', {
      abstract: true,
      template: view,
      url: '/scheduler'
    })

    // Redirect to default sub-state.
    $stateProvider.state('scheduler.index', {
      url: '',
      controller: function ($state) {
        $state.go('scheduler.management')
      }
    })
  })
  .name

