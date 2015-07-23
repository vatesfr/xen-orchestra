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
  .controller('Dataviz', function (xoApi, $scope, $timeout,bytesToSizeFilter) {

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
          children: [],
          size:0
        }
        let pool_ram = {
          name: pool.name_label,
          id: pool_id,
          children: [],
          size:0
        }
        let hosts = hostsByPool[pool_id]
        foreach(hosts, function (host, host_id) {
          let vm_ram_size=0, vm_cpu_size =0
          let host_cpu = {
            name: host.name_label,
            id: host_id,
            children: [],
            size:host.CPUs.cpu_count
          }
          let host_ram = {
            name: host.name_label,
            id: host_id,
            children: [],
            size:host.memory.size
          }
          let VMs = vmsByContainer[host_id]
          foreach(VMs, function (VM, vm_id) {
            let vm_ram = {
              name: VM.name_label,
              id: vm_id,
              size: VM.memory.size,
              textSize : bytesToSizeFilter(VM.memory.size)
            }
            let vm_cpu = {
              name: VM.name_label,
              id: vm_id,
              size: VM.CPUs.number,
              textSize: VM.CPUs.number+' CPU'
            }
            if (vm_cpu.size) {
              host_cpu.children.push(vm_cpu)
              vm_cpu_size += vm_cpu.size
            }
            if (vm_ram.size) {
              vm_ram_size+=vm_ram.size
              host_ram.children.push(vm_ram)
            }
          })
          if(host_ram.size != vm_ram_size){
            host_ram.children.push({
              color:'white',
              name: 'Free',
              id: 'free'+host.id,
              size:  host.memory.size-vm_ram_size ,
              textSize : bytesToSizeFilter( host.memory.size-vm_ram_size)
            })
          }
          if(host.CPUs.cpu_count > vm_cpu_size){
            
            host_cpu.children.push({
              color:'white',
              name: 'Free',
              id: 'free'+host.id,
              size:  host.CPUs.cpu_count - vm_cpu_size ,
              textSize : (host.CPUs.cpu_count - vm_cpu_size)+' CPU'
            })
          }
          
          host_ram.textSize =  bytesToSizeFilter(host_ram.size)
          pool_ram.size+=host_ram.size
          pool_ram.children.push(host_ram)
          
          pool_cpu.size+= parseInt(host_cpu.size,10)
          host_cpu.textSize = host_cpu.size+' CPU'
          
          pool_cpu.children.push(host_cpu)
        })
        if (pool_ram.children.length) {
          pool_ram.textSize =  bytesToSizeFilter(pool_ram.size)
          ram_children.push(pool_ram)
          
          pool_cpu.textSize = pool_cpu.size+' CPU'
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