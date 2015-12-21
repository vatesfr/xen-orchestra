'use strict'

import angular from 'angular'
import uiRouter from 'angular-ui-router'
import uiSelect from 'angular-ui-select'
import debounce from 'lodash.debounce'
import filter from 'lodash.filter'
import foreach from 'lodash.foreach'

import xoApi from 'xo-api'
import xoCircleD3 from 'xo-circle-d3'
import xoParallelD3 from 'xo-parallel-d3'
import xoSunburstD3 from 'xo-sunburst-d3'

import view from './view'

export default angular.module('dashboard.dataviz', [
  uiRouter,
  uiSelect,
  xoApi,
  xoCircleD3,
  xoParallelD3,
  xoSunburstD3
])
.config(function ($stateProvider) {
  $stateProvider.state('dashboard.dataviz', {
    controller: 'Dataviz as ctrl',
    data: {
      requireAdmin: true
    },
    url: '/dataviz/:chart',
    template: view
  })
})
.filter('type', () => {
  return function (objects, type) {
    if (!type) {
      return objects
    }
    return filter(objects, object => object.type === type)
  }
})
.controller('Dataviz', function ($scope, $state) {
  $scope.selectedChart = ''
  $scope.availablecharts = {
    sunburst: {
      name: 'Sunburst charts',
      imgs: ['images/sunburst.png', 'images/sunburst2.png'],
      url: '/dataviz/sunburst'
    },
    circle: {
      name: 'Circles charts',
      imgs: ['images/circle1.png', 'images/circle2.png'],
      url: '/dataviz/circle'
    },
    parcoords: {
      name: 'VM properties',
      imgs: ['images/parcoords.png'],
      url: '/dataviz/parcoords'
    }
  }
  $scope.$on('$stateChangeSuccess', function updatePage () {
    $scope.selectedChart = $state.params.chart
  })
})
.controller('DatavizParcoords', function DatavizParcoords (xoApi, $scope, $timeout, $interval, $state, bytesToSizeFilter) {
  let hostsByPool, vmsByContainer, data
  data = []
  hostsByPool = xoApi.getIndex('hostsByPool')
  vmsByContainer = xoApi.getIndex('vmsByContainer')
  /* parallel charts */

  function populateChartsData () {
    foreach(xoApi.getView('pools').all, function (pool, pool_id) {
      foreach(hostsByPool[pool_id], function (host, host_id) {
        console.log(host_id)
        foreach(vmsByContainer[host_id], function (vm, vm_id) {
          let nbvdi, vdisize

          nbvdi = 0
          vdisize = 0
          foreach(vm.$VBDs, function (vbd_id) {
            let vbd
            vbd = xoApi.get(vbd_id)

            if (!vbd.is_cd_drive && vbd.attached) {
              nbvdi++
              vdisize += xoApi.get(vbd.VDI).size
            }
          })
          data.push({
            name: vm.name_label,
            id: vm_id,
            vcpus: vm.CPUs.number,
            vifs: vm.VIFs.length,
            ram: vm.memory.size / (1024 * 1024 * 1024)/* memory size in GB */,
            nbvdi: nbvdi,
            vdisize: vdisize / (1024 * 1024 * 1024)/* disk size in Gb */
          })
        })
      })
    })

    $scope.charts = {
      data: data,
      labels: {
        vcpus: 'vCPUs number',
        ram: 'RAM quantity',
        vifs: 'VIF number',
        nbvdi: 'VDI number',
        vdisize: 'Total space'
      }
    }
  }

  const debouncedPopulate = debounce(populateChartsData, 300, {leading: true, trailing: true})
  debouncedPopulate()
  $scope.$on('$destroy', xoApi.onUpdate(debouncedPopulate))
})
.controller('DatavizStorageHierarchical', function DatavizStorageHierarchical (xoApi, $scope, $timeout, $interval, $state, bytesToSizeFilter) {
  $scope.charts = {
    selected: {},
    data: {
      name: 'storage',
      children: []
    },
    click: function (d) {
      if (d.virtual) {
        return
      }
      switch (d.type) {
        case 'pool':
          $state.go('pools_view', {
            id: d.id
          })
          break
        case 'host':
          $state.go('hosts_view', {
            id: d.id
          })
          break
        case 'srs':
          $state.go('SRs_view', {
            id: d.id
          })
          break
      }
    }
  }

  function populateChartsData () {
    function populatestorage (root, container_id) {
      let srs = filter(xoApi.getIndex('srsByContainer')[container_id], (one_srs) => one_srs.SR_type !== 'iso' && one_srs.SR_type !== 'udev')

      foreach(srs, function (one_srs) {
        let srs_used_size = 0
        const srs_storage = {
          name: one_srs.name_label,
          id: one_srs.id,
          children: [],
          size: one_srs.size,
          textSize: bytesToSizeFilter(one_srs.size),
          type: 'srs'
        }

        root.size += one_srs.size
        foreach(one_srs.VDIs, function (vdi_id) {
          let vdi = xoApi.get(vdi_id)
          if (vdi && vdi.name_label.indexOf('.iso') === -1) {
            let vdi_storage = {
              name: vdi.name_label,
              id: vdi_id,
              size: vdi.size,
              textSize: bytesToSizeFilter(vdi.size),
              type: 'vdi'
            }
            srs_used_size += vdi.size
            srs_storage.children.push(vdi_storage)
          }
        })
        if (one_srs.size > srs_used_size) {// some unallocated space
          srs_storage.children.push({
            color: 'white',
            name: 'Free',
            id: 'free' + one_srs.id,
            size: one_srs.size - srs_used_size,
            textSize: bytesToSizeFilter(one_srs.size - srs_used_size),
            type: 'vdi',
            virtual: true
          })
        }
        root.children.push(srs_storage)
      })
      root.textSize = bytesToSizeFilter(root.size)
    }

    let storage_children,
      pools,
      hostsByPool,
      pool_shared_storage

    storage_children = []
    pools = xoApi.getView('pools')
    hostsByPool = xoApi.getIndex('hostsByPool')

    foreach(pools.all, function (pool, pool_id) {
      let pool_storage, hosts
      pool_storage = {
        name: pool.name_label || 'no pool',
        id: pool_id,
        children: [],
        size: 0,
        color: pool.name_label ? null : 'white',
        type: 'pool',
        virtual: !pool.name_label
      }
      pool_shared_storage = {
        name: 'Shared',
        id: 'Shared' + pool_id,
        children: [],
        size: 0,
        type: 'host',
        virtual: true
      }

      populatestorage(pool_shared_storage, pool_id)
      pool_storage.children.push(pool_shared_storage)
      pool_storage.size += pool_shared_storage.size

      // by hosts
      hosts = hostsByPool[pool_id]
      foreach(hosts, function (host, host_id) {
        // there's also SR attached top
        let host_storage = {
          name: host.name_label,
          id: host.id,
          children: [],
          size: 0,
          type: 'host'
        }
        populatestorage(host_storage, host_id)
        pool_storage.size += host_storage.size
        pool_storage.children.push(host_storage)
      })

      pool_storage.textSize = bytesToSizeFilter(pool_storage.size)
      storage_children.push(pool_storage)
    })

    $scope.charts.data.children = storage_children
  }

  const debouncedPopulate = debounce(populateChartsData, 300, {leading: true, trailing: true})

  debouncedPopulate()
  $scope.$on('$destroy', xoApi.onUpdate(debouncedPopulate))
})
.controller('DatavizRamHierarchical', function DatavizRamHierarchical (xoApi, $scope, $timeout, $state, bytesToSizeFilter) {
  $scope.charts = {
    selected: {},
    data: {
      name: 'ram',
      children: []
    },
    click: function (d) {
      if (d.virtual) {
        return
      }
      switch (d.type) {
        case 'pool':
          $state.go('pools_view', {id: d.id})
          break
        case 'host':
          $state.go('hosts_view', {id: d.id})
          break
        case 'vm':
          $state.go('VMs_view', {id: d.id})
          break
      }
    }
  }

  function populateChartsData () {
    let ram_children,
      pools,
      vmsByContainer,
      hostsByPool

    ram_children = []
    pools = xoApi.getView('pools')
    vmsByContainer = xoApi.getIndex('vmsByContainer')
    hostsByPool = xoApi.getIndex('hostsByPool')

    foreach(pools.all, function (pool, pool_id) {
      let pool_ram, hosts

      // by hosts

      pool_ram = {
        name: pool.name_label || 'no pool',
        id: pool_id,
        children: [],
        size: 0,
        color: pool.name_label ? null : 'white',
        type: 'pool',
        virtual: !pool.name_label
      }
      hosts = hostsByPool[pool_id]
      foreach(hosts, function (host, host_id) {
        // there's also SR attached top
        let vm_ram_size = 0
        let host_ram = {
          name: host.name_label,
          id: host_id,
          children: [],
          size: host.memory.size,
          type: 'host'
        }
        let VMs = vmsByContainer[host_id]
        foreach(VMs, function (VM, vm_id) {
          let vm_ram = {
            name: VM.name_label,
            id: vm_id,
            size: VM.memory.size,
            textSize: bytesToSizeFilter(VM.memory.size),
            type: 'vm'
          }
          if (vm_ram.size) {
            vm_ram_size += vm_ram.size
            host_ram.children.push(vm_ram)
          }
        })
        if (host_ram.size !== vm_ram_size) {
          host_ram.children.push({
            color: 'white',
            name: 'Free',
            id: 'free' + host.id,
            size: host.memory.size - vm_ram_size,
            textSize: bytesToSizeFilter(host.memory.size - vm_ram_size),
            type: 'vm',
            virtual: true
          })
        }

        host_ram.textSize = bytesToSizeFilter(host_ram.size)
        pool_ram.size += host_ram.size
        pool_ram.children.push(host_ram)
      })
      if (pool_ram.children.length) {
        pool_ram.textSize = bytesToSizeFilter(pool_ram.size)
        ram_children.push(pool_ram)
      }
    })
    $scope.charts.data.children = ram_children
  }

  const debouncedPopulate = debounce(populateChartsData, 300, {leading: true, trailing: true})

  debouncedPopulate()
  $scope.$on('$destroy', xoApi.onUpdate(debouncedPopulate))
})
// A module exports its name.
.name
