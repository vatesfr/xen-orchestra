import angular from 'angular'
import uiRouter from 'angular-ui-router'

import admin from './admin'

import view from './view'

export default angular.module('self', [
  uiRouter,

  admin
])
  .config(function ($stateProvider) {
    $stateProvider.state('self', {
      abstract: true,
      // data: {
      //   requireAdmin: true
      // },
      template: view,
      url: '/self'
    })

    // Redirect to default sub-state.
    $stateProvider.state('self.index', {
      url: '',
      controller: function ($state) {
        $state.go('self.admin')
      }
    })
  })

  .name
