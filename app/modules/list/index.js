import angular from 'angular'
import uiRouter from 'angular-ui-router'
import xoTag from 'tag'
import includes from 'lodash.includes'

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
  .controller('ListCtrl', function (xoApi, $scope, $rootScope) {
    this.hosts = xoApi.getView('host')
    this.pools = xoApi.getView('pool')
    this.SRs = xoApi.getView('SR')
    this.VMs = xoApi.getView('VM')

    this.hostsByPool = xoApi.getIndex('hostsByPool')
    this.runningHostsByPool = xoApi.getIndex('runningHostsByPool')
    this.vmsByContainer = xoApi.getIndex('vmsByContainer')
    $scope.canView = function (id) {
      return xoApi.canInteract(id, 'view')
    }

    $scope.shouldAppear = (type, obj) => {
      if ($scope.states['running'] === 1 && obj.power_state !== 'Running') return false
      if ($scope.states['running'] === 0 && obj.power_state === 'Running') return false
      if ($scope.states['running'] !== 2 && !obj.power_state) return false

      if ($scope.types[type] === 1) return true
      if ($scope.types[type] === 0) return false
      if (includes($scope.types, 1)) return false

      return true
    }

    const _initOptions = () => {
      $scope.types = {
        'host': 2,
        'pool': 2,
        'sr': 2,
        'vm': 2
      }
      $scope.states = {
        'running': 2
      }
    }
    _initOptions()

    $scope.parsedListFilter = $scope.listFilter
    $rootScope.searchParse = () => {
      let keyWords = []
      const words = $scope.listFilter.split(' ')
      _initOptions()
      for (const word of words) {
        let isOption = word.charAt(0) === '*'
        const isNegation = word.charAt(0) === '!'
        isOption = isOption || isNegation
        let option = isNegation ? word.substring(1, word.length) : word
        option = option.charAt(0) === '*' ? option.substring(1, option.length) : option
        if (!isOption) {
          keyWords.push(option)
        } else {
          if ($scope.types.hasOwnProperty(option)) {
            $scope.types[option] = isNegation ? 0 : 1
          } else if ($scope.states.hasOwnProperty(option)) {
            $scope.states[option] = isNegation ? 0 : 1
          }
        }
      }
      $scope.parsedListFilter = keyWords.join(' ')
      console.log('keyWords = ', keyWords)
      console.log('types = ', $scope.types)
      console.log('states = ', $scope.states)
    }
  })
  // A module exports its name.
  .name
