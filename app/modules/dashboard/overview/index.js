import angular from 'angular';
import uiRouter from 'angular-ui-router';
import uiSelect from 'angular-ui-select';

import clone from 'lodash.cloneDeep'
import foreach from 'lodash.foreach'
import filter from 'lodash.filter';

import xoApi from 'xo-api';
import xoServices from 'xo-services';
import sunburstChart from 'xo-sunburst-d3'

import view from './view';

export default angular.module('dashboard.overview', [
  uiRouter,
  uiSelect,

  xoApi,
  xoServices,
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard.overview', {
      controller: 'Overview as ctrl',
      url: '/overview',
      template: view,
    });
  })
  .controller('Overview', function ($scope, xoApi, xo, $timeout) {
    Object.defineProperty(this, 'pools', {
      get: () => xoApi.byTypes.pool
    })
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
      srs: [],
      charts: {
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
    })
    function populateChartsData() {
      let ram_children,
        cpu_children,
        pools,
        vmsByContainer,
        hostsByPool,
        nb_hosts,
        nb_pools,
        vms,
        srsByHost,
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
      ram_children = []
      cpu_children = []
      srs = []
      pools = xoApi.getView('pools')
      srsByHost = xoApi.getIndex('srsByContainer')
      vmsByContainer = xoApi.getIndex('vmsByContainer')
      hostsByPool = xoApi.getIndex('hostsByPool')

      foreach(pools.all, function (pool, pool_id) {
        nb_pools++;
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
        let VMs = vmsByContainer[pool_id]
        
        
        foreach(VMs, function (VM, vm_id) {
        // non running VM
          vms.states[runningStateToIndex[VM['power_state']]]++
          vms.nb++;
        })
        let hosts = hostsByPool[pool_id]
        foreach(hosts, function (host, host_id) {
          let hosts_srs = srsByHost[host_id]
          foreach(hosts_srs, (one_srs)=>{
            one_srs = clone(one_srs);
            one_srs.host_label = host.name_label;
            one_srs.pool_label = pool.name_label;
            srs.push(one_srs)
            
          })
          nb_hosts++;
          
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
            console.log(VM);

            vms.states[runningStateToIndex[VM['power_state']]]++
            vms.nb++;
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

      $scope.hosts.nb = nb_hosts
      $scope.vms = vms
      $scope.pools.nb = nb_pools

      $scope.charts.cpu.children = cpu_children
      $scope.charts.ram.children = ram_children
      $scope.srs = srs;
    }

    populateChartsData();
    $scope.$watch(() => xoApi.all, function () {
      console.log(' XOAPI .ALL CHANGHE')
      $timeout(function () { // all semmes to be unpopulated for now 
        populateChartsData()
      }, 0)
    },
      true)

  })

  .name
  ;
