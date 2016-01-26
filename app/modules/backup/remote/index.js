import angular from 'angular'
import map from 'lodash.map'
import size from 'lodash.size'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'
import {format, parse} from 'xo-remote-parser'

import view from './view'

// ====================================================================

export default angular.module('backup.remote', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('backup.remote', {
      url: '/remote',
      controller: 'RemoteCtrl as ctrl',
      template: view
    })
  })
  .controller('RemoteCtrl', function ($scope, $state, $stateParams, $interval, xo, xoApi, notify, selectHighLevelFilter, filterFilter) {
    this.ready = false

    const refresh = () => {
      return xo.remote.getAll()
      .then(remotes => this.backUpRemotes = map(remotes, parse))
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

    this.prepareUrl = (type, host, path, username, password, domain) => format({type, host, path, username, password, domain})

    const reset = () => {
      this.path = this.host = this.name = undefined
      this.remoteType = 'file'
    }
    this.add = (name, url) => xo.remote.create(name, url).then(reset).then(refresh)
    this.remove = id => xo.remote.delete(id).then(refresh)
    this.enable = id => xo.remote.set(id, undefined, undefined, true).then(refresh)
    this.disable = id => xo.remote.set(id, undefined, undefined, false).then(refresh)
    this.size = size

    reset()
  })

  // A module exports its name.
  .name
