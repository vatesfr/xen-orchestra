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
  .controller('ListCtrl', function (xo, xoApi, $state, $scope, $rootScope) {
    const user = xoApi.user

    $scope.createButton = user.permission !== 'admin'

    if (user.permission !== 'admin') {
      $scope.createButton = false
      xo.resourceSet.getAll()
      .then(sets => {
        $scope.resourceSets = sets
        $scope.createButton = sets.length > 0
      })
    }

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

    $scope.shouldAppear = (obj) => {
      // States
      const powerState = obj.power_state
      // If there is a search option on the power state (running or halted),
      // then objects that do not have a power_state (eg: SRs) are not displayed
      if (($scope.states['running'] !== 2 || $scope.states['halted'] !== 2) && !powerState) return false
      if (powerState) {
        if ($scope.states[powerState.toLowerCase()] === 0) return false
        if (($scope.states['running'] === 1 || $scope.states['halted'] === 1) &&
          $scope.states[powerState.toLowerCase()] !== 1) return false
      }

      if ($scope.states['disconnected'] !== 2 && !obj.$PBDs) return false
      let disconnected = false
      if (obj.$PBDs) {
        for (const id of obj.$PBDs) {
          const pbd = xoApi.get(id)
          disconnected |= !pbd.attached
        }
        if ($scope.states['disconnected'] === 0 && disconnected) return false
        if ($scope.states['disconnected'] === 1 && !disconnected) return false
      }

      // Types
      if ($scope.types[obj.type.toLowerCase()] === 0) return false
      if ($scope.types[obj.type.toLowerCase()] === 2 && includes($scope.types, 1)) return false

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
        'running': 2,
        'halted': 2,
        'disconnected': 2
      }
    }
    _initOptions()

    $scope.parsedListFilter = $scope.listFilter
    $rootScope.searchParse = () => {
      let keyWords = []
      const words = $scope.listFilter ? $scope.listFilter.split(' ') : ['']
      _initOptions()
      for (const word of words) {
        let isOption = word.charAt(0) === '*'
        const isNegation = word.charAt(0) === '!'
        // as long as there is a '!', it is an option. ie !vm <=> !*vm
        isOption = isOption || isNegation
        let option = (isNegation ? word.substring(1, word.length) : word).toLowerCase()
        option = option.charAt(0) === '*' ? option.substring(1, option.length) : option
        if (!isOption) {
          if (option !== '') keyWords.push(option)
        } else {
          if ($scope.types.hasOwnProperty(option)) {
            $scope.types[option] = isNegation ? 0 : 1
          } else if ($scope.states.hasOwnProperty(option)) {
            $scope.states[option] = isNegation ? 0 : 1
          }
        }
      }
      $scope.parsedListFilter = keyWords.join(' ')
    }

    $scope.onClick = (type) => {
      $rootScope.options[type.toLowerCase()] = !$rootScope.options[type.toLowerCase()]
      $rootScope.updateListFilter(type.toLowerCase())
    }
  })
  // A module exports its name.
  .name
