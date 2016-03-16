import angular from 'angular'
import forEach from 'lodash.foreach'
import uiRouter from 'angular-ui-router'

import xoTag from 'tag'

import view from './view'

// ===================================================================

export default angular.module('xoWebApp.pool', [
  uiRouter,
  xoTag
])
  .config(function ($stateProvider) {
    $stateProvider.state('pools_view', {
      url: '/pools/:id',
      controller: 'PoolCtrl',
      template: view
    })
  })
  .controller('PoolCtrl', function ($scope, $stateParams, xoApi, xo, modal, notify) {
    {
      const {id} = $stateParams
      const hostsByPool = xoApi.getIndex('hostsByPool')
      const runningHostsByPool = xoApi.getIndex('runningHostsByPool')
      const srsByContainer = xoApi.getIndex('srsByContainer')
      const networksByPool = xoApi.getIndex('networksByPool')

      Object.defineProperties($scope, {
        pool: {
          get: () => xoApi.get(id)
        },
        hosts: {
          get: () => hostsByPool[id]
        },
        runningHosts: {
          get: () => runningHostsByPool[id]
        },
        srs: {
          get: () => srsByContainer[id]
        },
        networks: {
          get: () => networksByPool[id]
        }
      })
    }

    $scope.$watch(() => $scope.pool && $scope.hosts, result => {
      if (result) {
        $scope.listMissingPatches()
        xo.pool.getLicenseState($scope.pool.id).then(result => {
          $scope.license = result
        })
      }
    })

    $scope.currentLogPage = 1

    $scope.savePool = function ($data) {
      let {pool} = $scope
      let {name_label, name_description} = $data

      $data = {
        id: pool.id
      }
      if (name_label !== pool.name_label) {
        $data.name_label = name_label
      }
      if (name_description !== pool.name_description) {
        $data.name_description = name_description
      }

      xoApi.call('pool.set', $data)
    }

    $scope.deleteAllLog = function () {
      return modal.confirm({
        title: 'Log deletion',
        message: 'Are you sure you want to delete all the logs?'
      }).then(function () {
        // TODO: return all promises.
        forEach($scope.pool.messages, function (message) {
          xo.log.delete(message.id)
          console.log('Remove log', message.id)
        })
      })
    }

    $scope.setDefaultSr = function (id) {
      let {pool} = $scope
      return modal.confirm({
        title: 'Set default SR',
        message: 'Are you sure you want to set this SR as default?'
      }).then(function () {
        return xo.pool.setDefaultSr(pool.id, id)
      })
    }

    $scope.deleteLog = function (id) {
      console.log('Remove log', id)
      return xo.log.delete(id)
    }

    $scope.nbUpdates = {}
    $scope.totalUpdates = 0
    $scope.listMissingPatches = () => {
      forEach($scope.hosts, function (host, host_id) {
        xo.host.listMissingPatches(host_id)
          .then(result => {
            $scope.nbUpdates[host_id] = result.length
            $scope.totalUpdates += result.length
          }
        )
      })
    }

    $scope.installAllPatches = function () {
      modal.confirm({
        title: 'Install all the missing patches',
        message: 'Are you sure you want to install all the missing patches? This could take a while...'
      }).then(() => {
        forEach($scope.hosts, function (host, host_id) {
          console.log('Installing all missing patches on host ', host_id)
          xo.host.installAllPatches(host_id)
        })
      })
    }

    $scope.installHostPatches = function (hostId) {
      modal.confirm({
        title: 'Update host (' + $scope.nbUpdates[hostId] + ' patch(es))',
        message: 'Are you sure you want to install all the missing patches on this host? This could take a while...'
      }).then(() => {
        console.log('Installing all missing patches on host ', hostId)
        xo.host.installAllPatches(hostId)
      })
    }

    $scope.canAdmin = function (id = undefined) {
      if (id === undefined) {
        id = $scope.pool && $scope.pool.id
      }

      return id && xoApi.canInteract(id, 'administrate') || false
    }

    $scope.connectPIF = function (id) {
      console.log(`Connect PIF ${id}`)

      xoApi.call('pif.connect', {id: id})
    }

    $scope.disconnectPIF = function (id) {
      console.log(`Disconnect PIF ${id}`)

      xoApi.call('pif.disconnect', {id: id})
    }

    $scope.removePIF = function (id) {
      console.log(`Remove PIF ${id}`)

      xoApi.call('pif.delete', {id: id})
    }

    $scope.deleteNetwork = function (id) {
      return modal.confirm({
        title: 'Network deletion',
        message: 'Are you sure you want to delete this network?'
      }).then(function () {
        console.log(`Delete network ${id}`)
        notify.info({
          title: 'Network deletion...',
          message: 'Deleting the network'
        })

        xoApi.call('network.delete', {id: id})
      })
    }

    $scope.disallowDelete = function (network) {
      let disallow = false
      forEach(network.PIFs, pif => {
        const PIF = xoApi.get(pif)
        if (PIF.disallowUnplug || PIF.management) {
          disallow = true
          return false
        }
      })
      return disallow
    }

    $scope.createNetwork = function (name, description, pif, mtu, vlan) {
      $scope.createNetworkWaiting = true
      notify.info({
        title: 'Network creation...',
        message: 'Creating the network'
      })
      const params = {
        pool: $scope.pool.id,
        name: name
      }
      if (mtu) {
        params.mtu = mtu
      }
      if (pif) {
        params.pif = pif
      }
      if (vlan) {
        params.vlan = vlan
      }
      if (description) {
        params.description = description
      }
      return xoApi.call('network.create', params).then(function () {
        $scope.creatingNetwork = false
        $scope.createNetworkWaiting = false
      })
    }

    $scope.physicalPifs = () => {
      const physicalPifs = []
      const host = xoApi.get($scope.pool.master)
      forEach(host.$PIFs, pif => {
        pif = xoApi.get(pif)
        if (pif.physical) {
          physicalPifs.push(pif.id)
        }
      })
      return physicalPifs
    }

    // $scope.patchPool = ($files, id) ->
    //   file = $files[0]
    //   xo.pool.patch id
    //   .then ({ $sendTo: url }) ->
    //     return Upload.http {
    //       method: 'POST'
    //       url
    //       data: file
    //     }
    //     .progress throttle(
    //       (event) ->
    //         percentage = (100 * event.loaded / event.total)|0

    //         notify.info
    //           title: 'Upload patch'
    //           message: "#{percentage}%"
    //       6e3
    //     )
    //   .then (result) ->
    //     throw result.status if result.status isnt 200
    //     notify.info
    //       title: 'Upload patch'
    //       message: 'Success'
  })

  // A module exports its name.
  .name
