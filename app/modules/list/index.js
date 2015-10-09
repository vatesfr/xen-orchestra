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

    const contains = (value, array) => {
      for (let i = 0; i < array.length; i++) {
        if (array[i] === value) {
          return true
        }
      }
      return false
    }

    const opts = ['!host', '!pool', '!sr', '!vm']
    $scope.opts_values = [true, true, true, true]
    $scope.parsedListFilter = $scope.listFilter

    $rootScope.searchParse = () => {
      let searchWords = []
      let options = []
      const words = $scope.listFilter.split(' ')
      for (let i = 0; i < words.length; i++) {
        if (words[i].charAt(0) === '!') {
          options.push(words[i])
        } else {
          searchWords.push(words[i])
        }
      }
      for (let i = 0; i < opts.length; i++) {
        $scope.opts_values[i] = !contains(opts[i], options)
      }
      $scope.parsedListFilter = searchWords.join(' ')
    }
  })
  // A module exports its name.
  .name
