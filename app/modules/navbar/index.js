import angular from 'angular'
import uiRouter from 'angular-ui-router'

import updater from '../updater'
import xoServices from 'xo-services'

import view from './view'

// ===================================================================

export default angular.module('xoWebApp.navbar', [
  uiRouter,

  updater,
  xoServices
])
  .controller('NavbarCtrl', function ($state, xoApi, xo, $scope, updater, $rootScope) {
    this.updater = updater
    // TODO: It would make sense to inject xoApi in the scope.
    Object.defineProperties(this, {
      status: {
        get: () => xoApi.status
      },
      user: {
        get: () => xoApi.user
      }
    })
    this.logIn = xoApi.logIn
    this.logOut = function () {
      xoApi.logOut()
    }

    // When a searched is entered, we must switch to the list view if
    // necessary. When the text field is empty again, we must swith
    // to tree view
    this.ensureListView = function (listFilter) {
      if (listFilter) {
        $state.go('list')
      } else {
        $state.go('tree')
      }
      if ($rootScope.searchParse) {
        $rootScope.searchParse()
      }
    }

    this.tasks = xoApi.getView('runningTasks')
  })
  .directive('navbar', function () {
    return {
      restrict: 'E',
      controller: 'NavbarCtrl as navbar',
      template: view,
      scope: {}
    }
  })

  // A module exports its name.
  .name
