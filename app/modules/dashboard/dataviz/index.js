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
      storage: {
        name: 'storage',
        children: []
      },
      over: function (d) {
        $scope.$apply(function () {
          $scope.charts.selected = d
        })
      }
    }

    function populateChartsData() {
      let ram_children, 
        storage_children,
        pools, 
        vmsByContainer, 
        hostsByPool,
        srsByContainer
        
      ram_children = []
      storage_children = []
      pools = xoApi.getView('pools')
      vmsByContainer = xoApi.getIndex('vmsByContainer')
      hostsByPool = xoApi.getIndex('hostsByPool')
      srsByContainer = xoApi.getIndex('srsByContainer')

      foreach(pools.all, function (pool, pool_id) {
        let pool_storage, pool_ram, hosts ,srs
        console.log('SRS',srsByContainer[pool_id])
        
        //srs
        
        pool_storage = {
          name: pool.name_label || 'no pool',
          id: pool_id,
          children: [],
          size:0,
          color: !!pool.name_label ? null : 'white'
        }
        srs = srsByContainer[pool_id]
        foreach(srs, function(one_srs,srs_id){
          
          let srs_used_size=0,
            srs_storage = {
              name: one_srs.name_label,
              id: srs_id,
              children: [],
              size:one_srs.size,
              textSize:bytesToSizeFilter(one_srs.size)
            }
          
          pool_storage.size+=one_srs.size
          foreach(one_srs.VDIs, function(vdi_id){
            let vdi = xoApi.get(vdi_id)
            if(vdi.name_label.indexOf('.iso') === -1){
              let vdi_storage={
                name: vdi.name_label,
                id: vdi_id,
                size: vdi.size,
                textSize : bytesToSizeFilter(vdi.size)
              }
              srs_used_size+=vdi.size
              srs_storage.children.push(vdi_storage)
            }
          })
          if(one_srs.size > srs_used_size){// some unallocated space
            srs_storage.children.push({
              color:'white',
              name: 'Free',
              id: 'free'+one_srs.id,
              size:  one_srs.size-srs_used_size ,
              textSize : bytesToSizeFilter( one_srs.size-srs_used_size)
            })
          }
          pool_storage.children.push(srs_storage)
        })
        pool_storage.textSize = bytesToSizeFilter(pool_storage.size)
        storage_children.push(pool_storage)
        //ram 
        
        pool_ram = {
          name: pool.name_label || 'no pool',
          id: pool_id,
          children: [],
          size:0,
          color: !!pool.name_label ? null : 'white'
        }
        hosts = hostsByPool[pool_id]
        foreach(hosts, function (host, host_id) {
          let vm_ram_size=0         
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
          
          host_ram.textSize =  bytesToSizeFilter(host_ram.size)
          pool_ram.size+=host_ram.size
          pool_ram.children.push(host_ram)
          
        })
        if (pool_ram.children.length) {
          pool_ram.textSize =  bytesToSizeFilter(pool_ram.size)
          ram_children.push(pool_ram)
          
        }
      })
      console.log(storage_children);

      $scope.charts.storage.children = storage_children
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