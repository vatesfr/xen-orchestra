import angular from 'angular'
import filter from 'lodash.filter'
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
  .controller('RestoreCtrl', function ($scope, $interval, xo, xoApi, notify, bytesToSizeFilter) {
    this.loaded = {}

    const srs = xoApi.getView('SRs').all

    this.bytesToSize = bytesToSizeFilter
    this.isEmpty = backups => backups && !(Object.keys(backups.delta) || backups.other.length)
    this.size = size

    const refresh = () => {
      return xo.remote.getAll()
      .then(remotes => {
        forEach(this.backUpRemotes, remote => {
          if (remote.backups) {
            const freshRemote = find(remotes, {id: remote.id})
            freshRemote && (freshRemote.backups = remote.backups)
          }
        })
        this.backUpRemotes = remotes
        this.writable_SRs = filter(srs, (sr) => sr.content_type !== 'iso')
      })
    }

    refresh()

    const interval = $interval(refresh, 5e3)
    $scope.$on('$destroy', () => {
      $interval.cancel(interval)
    })

    const deltaBuilder = (backups, uuid, name, tag, value) => {
      let deltaBackup = backups[uuid]
        ? backups[uuid]
        : backups[uuid] = {}

      deltaBackup = deltaBackup[name]
        ? deltaBackup[name]
        : deltaBackup[name] = {}

      deltaBackup = deltaBackup[tag]
        ? deltaBackup[tag]
        : deltaBackup[tag] = []

      deltaBackup.push(value)
    }

    this.list = id => {
      return xo.remote.list(id)
      .then(files => {
        const remote = find(this.backUpRemotes, {id})

        if (remote) {
          const backups = remote.backups = {
            delta: {},
            other: []
          }

          forEach(files, file => {
            const arr = /^vm_delta_(.*)_([^\/]+)\/([^_]+)_(.*)$/.exec(file)

            if (arr) {
              const [ , tag, uuid, date, name ] = arr
              const value = {
                path: file,
                date
              }
              deltaBuilder(backups.delta, uuid, name, tag, value)
            } else {
              backups.other.push(file)
            }
          })
        }

        this.loaded[remote.id] = true
      })
    }

    const notification = {
      title: 'VM import started',
      message: 'Starting the VM import'
    }

    this.importBackup = (id, path, sr) => {
      notify.info(notification)
      return xo.vm.importBackup(id, path, sr)
    }

    this.importDeltaBackup = (id, path, sr) => {
      notify.info(notification)
      return xo.vm.importDeltaBackup(id, path, sr)
    }
  })

  // A module exports its name.
  .name
