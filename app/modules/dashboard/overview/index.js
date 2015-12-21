'use strict'
import angular from 'angular'
import uiRouter from 'angular-ui-router'
import uiSelect from 'angular-ui-select'

import clone from 'lodash.clonedeep'
import debounce from 'lodash.debounce'
import foreach from 'lodash.foreach'

import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'

export default angular.module('dashboard.overview', [
  uiRouter,
  uiSelect,
  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard.overview', {
      controller: 'Overview as ctrl',
      data: {
        requireAdmin: true
      },
      url: '/overview',
      template: view
    })
  })
  .controller('Overview', function ($scope, $window, xoApi, xo, $timeout, bytesToSizeFilter, modal) {
    $window.bytesToSize = bytesToSizeFilter //  FIXME dirty workaround to custom a Chart.js tooltip template
    angular.extend($scope, {
      pools: {
        nb: 0
      },
      hosts: {
        nb: 0
      },
      vms: {
        nb: 0,
        running: 0,
        halted: 0,
        action: 0
      },
      ram: [0, 0],
      cpu: [0, 0],
      srs: []
    })

    $scope.installAllPatches = function () {
      modal.confirm({
        title: 'Install all the missing patches',
        message: 'Are you sure you want to install all the missing patches? This could take a while...'
      }).then(() =>
        foreach($scope.pools.all, function (pool, pool_id) {
          let pool_hosts = $scope.hostsByPool[pool_id]
          foreach(pool_hosts, function (host, host_id) {
            console.log('Installing all missing patches on host ', host_id)
            xo.host.installAllPatches(host_id)
          })
        })
      )
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

    const nbUpdates = $scope.nbUpdates = {}
    function populateChartsData () {
      let pools,
        vmsByContainer,
        hostsByPool,
        nb_hosts,
        nb_pools,
        vms,
        srsByContainer,
        srs

      nb_pools = 0
      nb_hosts = 0
      vms = {
        nb: 0,
        states: [0, 0, 0, 0]
      }
      const runningStateToIndex = {
        Running: 0,
        Halted: 1,
        Suspended: 2,
        Action: 3
      }

      nb_pools = 0
      srs = []

      // update vdi, set them to the right host
      $scope.pools = pools = xoApi.getView('pools')

      srsByContainer = xoApi.getIndex('srsByContainer')
      vmsByContainer = xoApi.getIndex('vmsByContainer')
      $scope.hostsByPool = hostsByPool = xoApi.getIndex('hostsByPool')
      foreach(pools.all, function (pool, pool_id) {
        let pool_hosts = hostsByPool[pool_id]
        foreach(pool_hosts, function (host, host_id) {
          if (host_id in nbUpdates) {
            return
          }

          xo.host.listMissingPatches(host_id)
            .then(result => {
              nbUpdates[host_id] = result.length
            }
          )
        })
      })

      foreach(pools.all, function (pool, pool_id) {
        nb_pools++
        let pool_srs = srsByContainer[pool_id]
        foreach(pool_srs, (one_srs) => {
          if (one_srs.SR_type !== 'iso' && one_srs.SR_type !== 'udev') {
            one_srs = clone(one_srs)
            one_srs.ratio = one_srs.size ? one_srs.physical_usage / one_srs.size : 0
            one_srs.pool_label = pool.name_label
            srs.push(one_srs)
          }
        })
        let VMs = vmsByContainer[pool_id]
        foreach(VMs, function (VM) {
        // non running VM
          vms.states[runningStateToIndex[VM['power_state']]]++
          vms.nb++
        })
        let hosts = hostsByPool[pool_id]
        foreach(hosts, function (host, host_id) {
          let hosts_srs = srsByContainer[host_id]
          foreach(hosts_srs, (one_srs) => {
            if (one_srs.SR_type !== 'iso' && one_srs.SR_type !== 'udev') {
              one_srs = clone(one_srs)
              one_srs.ratio = one_srs.size ? one_srs.physical_usage / one_srs.size : 0
              one_srs.host_label = host.name_label
              one_srs.pool_label = pool.name_label
              srs.push(one_srs)
            }
          })
          nb_hosts++
          let VMs = vmsByContainer[host_id]
          foreach(VMs, function (VM) {
            vms.states[runningStateToIndex[VM['power_state']]]++
            vms.nb++
          })
        })
      })

      $scope.hosts.nb = nb_hosts
      $scope.vms = vms
      $scope.pools.nb = nb_pools
      $scope.srs = srs
      $scope.ram = [xoApi.stats.$memory.usage, xoApi.stats.$memory.size - xoApi.stats.$memory.usage]
      $scope.cpu = [[xoApi.stats.$vCPUs], [xoApi.stats.$CPUs]]
    }

    const debouncedPopulate = debounce(populateChartsData, 300, {leading: true, trailing: true})

    debouncedPopulate()

    $scope.$on('$destroy', xoApi.onUpdate(debouncedPopulate))
  })

  .name
