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

    $scope.shouldAppear = (obj) => {
      return $scope.isRequired['running'] === 2 ||
        $scope.isRequired['running'] === 1 && obj.power_state === 'Running' ||
        $scope.isRequired['running'] === 0 && obj.power_state !== 'Running'
    }

    $scope.isBanned = {
      'host': true,
      'pool': true,
      'sr': true,
      'vm': true
    }
    $scope.isRequired = {
      'running': 2
    }
    $scope.parsedListFilter = $scope.listFilter
    $rootScope.searchParse = () => {
      let keyWords = []
      let bans = []
      let options = []
      const words = $scope.listFilter.split(' ')
      for (const word of words) {
        const negation = (word.charAt(0) === '!')
        const option = negation ? word.charAt(1) === '*' : word.charAt(0) === '*'
        if (negation) {
          bans.push(word.substring(1, word.length))
        }
        if (option) {
          options.push(word)
        }
        if (!negation && !option) {
          keyWords.push(word)
        }
      }
      for (const object in $scope.isBanned) {
        $scope.isBanned[object] = !includes(bans, object)
      }
      for (const requirement in $scope.isRequired) {
        if (includes(options, '*' + requirement)) {
          $scope.isRequired[requirement] = 1
        } else if (includes(options, '!*' + requirement)) {
          $scope.isRequired[requirement] = 0
        } else {
          $scope.isRequired[requirement] = 2
        }
      }
      $scope.parsedListFilter = keyWords.join(' ')
      console.log('keyWords = ', keyWords, 'bans = ', bans, 'options = ', options)
      console.log('isRequired = ', $scope.isRequired)
    }
  })
  // A module exports its name.
  .name
