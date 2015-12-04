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
    let timeout
    $scope.ensureListView = function (listFilter) {
      clearTimeout(timeout)
      timeout = window.setTimeout(function () {
        $state.go('list').then(() =>
          $rootScope.searchParse(),
          $scope.updateOptions()
        )
      }, 400)
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

    $rootScope.options = {
      'vm': false,
      'sr': false,
      'host': false,
      'pool': false,
      'running': false,
      'halted': false,
      'disconnected': false
    }
    // Checkboxes --> Text
    // Update text field after a checkbox has been clicked
    $rootScope.updateListFilter = function (option) {
      if ($rootScope.options[option]) {
        _addOption(option)
      } else {
        _removeOption(option)
      }
      $scope.ensureListView($scope.$root.listFilter)
    }
    // Text --> Checkboxes
    // Update checkboxes after the text field has been changed
    $scope.updateOptions = function () {
      const words = $scope.$root.listFilter ? $scope.$root.listFilter.split(' ') : ['']
      for (const opt in $rootScope.options) {
        $rootScope.options[opt] = false
        for (let word of words) {
          if (_isOption(word, opt)) {
            $rootScope.options[opt] = true
          }
        }
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
