'use strict'

import angular from 'angular'
import uiRouter from 'angular-ui-router'
import uiSelect from 'angular-ui-select'
import foreach from 'lodash.foreach'

import xoApi from 'xo-api'
import xoServices from 'xo-services'

import sunburstChart from 'xo-sunburst-d3'

import view from './view'

export default angular.module('dashboard.dataviz', [
  uiRouter,
  uiSelect,

  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard.dataviz', {
      controller: 'Dataviz as ctrl',
      url: '/dataviz',
      template: view
    })
  })
  .controller('Dataviz', function (xoApi, $scope, $timeout) {

    $scope.charts = {
      selected: {},
      ram: {
        name: 'ram',
        children: []
      },
      cpu: {
        name: 'cpu',
        children: []
      },
      over: function (d) {
        $scope.$apply(function () {
          $scope.charts.selected = d
        })
      }
    }

    function populateChartsData() {
      let ram_children, cpu_children, pools, vmsByContainer, hostsByPool

      ram_children = []
      cpu_children = []
      pools = xoApi.getView('pools')
      vmsByContainer = xoApi.getIndex('vmsByContainer')
      hostsByPool = xoApi.getIndex('hostsByPool')

      foreach(pools.all, function (pool, pool_id) {
        let pool_cpu = {
          name: pool.name_label,
          id: pool_id,
          children: []
        }
        let pool_ram = {
          name: pool.name_label,
          id: pool_id,
          children: []
        }
        let hosts = hostsByPool[pool_id]
        foreach(hosts, function (host, host_id) {
          let host_cpu = {
            name: host.name_label,
            id: host_id,
            children: []
          }
          let host_ram = {
            name: host.name_label,
            id: host_id,
            children: []
          }
          let VMs = vmsByContainer[host_id]
          foreach(VMs, function (VM, vm_id) {
            let vm_ram = {
              name: VM.name_label,
              id: vm_id,
              size: VM.memory.size
            }
            let vm_cpu = {
              name: VM.name_label,
              id: vm_id,
              size: VM.CPUs.number
            }
            if (vm_cpu.size) {
              host_cpu.children.push(vm_cpu)
            }
            if (vm_ram.size) {
              host_ram.children.push(vm_ram)
            }
          })
          if (host_ram.children.length) {
            pool_ram.children.push(host_ram)
            pool_cpu.children.push(host_cpu)
          }
        })
        if (pool_ram.children.length) {
          ram_children.push(pool_ram)
          cpu_children.push(pool_cpu)
        }
      })

      $scope.charts.cpu.children = cpu_children
      $scope.charts.ram.children = ram_children
    }


    $scope.$watch(() => xoApi.all, function () {
      console.log(' XOAPI .ALL CHANGHE')
      $timeout(function () { // all semmes to be unpopulated for now 
        populateChartsData()
      }, 0)
    },
      true)

  })

// A module exports its name. 
  .name