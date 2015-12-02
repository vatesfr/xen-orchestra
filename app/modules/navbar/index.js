import angular from 'angular'
import uiRouter from 'angular-ui-router'

import updater from '../updater'
import xoServices from 'xo-services'
import includes from 'lodash.includes'

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
        $state.go('list').then(() =>
          $rootScope.searchParse()
        )
      } else {
        for (const opt in $scope.options) {
          $scope.options[opt] = false
        }
        $state.go('tree')
      }
    }

    const _isOption = function (word, option) {
      if (word === '*' + option || word === '!' + option || word === '!*' + option) {
        return true
      }
      return false
    }
    const _removeOption = function (option) {
      if (!$scope.$root.listFilter) {
        return
      }
      const words = $scope.$root.listFilter.split(' ')
      $scope.$root.listFilter = ''
      for (const word of words) {
        if (!_isOption(word, option) && word !== '') {
          $scope.$root.listFilter += word + ' '
        }
      }
    }
    const _addOption = function (option) {
      if (!$scope.$root.listFilter) {
        $scope.$root.listFilter = '*' + option + ' '
        return
      }
      const words = $scope.$root.listFilter.split(' ')
      if (!includes(words, '*' + option) && !includes(words, '!' + option) && !includes(words, '!*' + option)) {
        if ($scope.$root.listFilter.charAt($scope.$root.listFilter.length - 1) !== ' ') {
          $scope.$root.listFilter += ' '
        }
        $scope.$root.listFilter += '*' + option + ' '
      }
    }

    $scope.options = {
      'vm': false,
      'sr': false,
      'host': false,
      'pool': false,
      'running': false,
      'halted': false,
      'disconnected': false
    }
    this.updateListFilter = function (option) {
      if ($scope.options[option]) {
        _addOption(option)
      } else {
        _removeOption(option)
      }
      this.ensureListView($scope.$root.listFilter)
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
