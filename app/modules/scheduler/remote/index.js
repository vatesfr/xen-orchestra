import angular from 'angular'
import filter from 'lodash.filter'
import map from 'lodash.map'
import trim from 'lodash.trim'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'
import size from 'lodash.size'

import view from './view'

// ====================================================================

export default angular.module('scheduler.remote', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('scheduler.remote', {
      url: '/remote',
      controller: 'RemoteCtrl as ctrl',
      template: view
    })
  })
  .controller('RemoteCtrl', function ($scope, $state, $stateParams, $interval, xo, xoApi, notify, selectHighLevelFilter, filterFilter) {
    this.ready = false

    const refresh = () => {
      return xo.remote.getAll()
      .then(remotes => this.backUpRemotes = remotes)
    }

    this.getReady = () => {
      return refresh()
      .then(() => this.ready = true)
    }
    this.getReady()

    const interval = $interval(refresh, 5e3)
    $scope.$on('$destroy', () => {
      $interval.cancel(interval)
    })

    this.sanitizePath = (...paths) => filter(map(paths, s => s && filter(map(s.split('/'), trim)).join('/'))).join('/')
    this.prepareUrl = (type, host, path) => {
      let url = type + ':/'
      if (type === 'nfs') {
        url += '/' + host + ':'
      }
      url += '/' + this.sanitizePath(path)
      return url
    }

    const reset = () => {
      this.path = this.host = this.name = undefined
      this.remoteType = 'file'
    }
    this.add = (name, url) => xo.remote.create(name, url).then(reset).then(refresh)
    this.remove = id => xo.remote.delete(id).then(refresh)
    this.enable = id => { console.log('GO !!!');xo.remote.set(id, undefined, undefined, true).then(refresh)}
    this.disable = id => xo.remote.set(id, undefined, undefined, false).then(refresh)
    this.size = size

    reset()
  })

  // A module exports its name.
  .name
