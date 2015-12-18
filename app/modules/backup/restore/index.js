import angular from 'angular'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import size from 'lodash.size'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'

import view from './view'

// ====================================================================

export default angular.module('backup.restore', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('backup.restore', {
      url: '/restore',
      controller: 'RestoreCtrl as ctrl',
      template: view
    })
  })
  .controller('RestoreCtrl', function ($scope, $interval, xo, xoApi, notify, $upload) {
    this.loaded = {}
    this.srs = xoApi.getView('SRs')

    const refresh = () => {
      return xo.remote.getAll()
      .then(remotes => {
        forEach(this.backUpRemotes, remote => {
          if (remote.files) {
            const freshRemote = find(remotes, {id: remote.id})
            freshRemote && (freshRemote.files = remote.files)
          }
        })
        this.backUpRemotes = remotes
      })
    }

    refresh()

    const interval = $interval(refresh, 5e3)
    $scope.$on('$destroy', () => {
      $interval.cancel(interval)
    })

    this.list = id => {
      return xo.remote.list(id)
      .then(files => {
        const remote = find(this.backUpRemotes, {id})
        remote && (remote.files = files)
        this.loaded[remote.id] = true
      })
    }

    this.importVm = (id, file, sr) => {
      notify.info({
        title: 'VM import started',
        message: 'Starting the VM import'
      })
      return xo.vm.importBackup(id, file, sr)
    }

    this.size = size
  })

  // A module exports its name.
  .name
