'use strict'

angular.module('xoWebApp')
  .controller 'MainCtrl', ($scope) ->
    $scope.pools = [
      {
        name_label: 'Pool1'
        SRs: [
          {
            name_label: 'DataCore'
            enable: true
            size: 100 # in bytes
            usage: 60 # in bytes
          }
          {
            name_label: 'ZFS'
            enable: true
            size: 100 # in bytes
            usage: 20 # in bytes
          }
        ]
        hosts: [
          {
            name_label: 'XServ1'
            address: '192.168.1.1'
            memory: {
              size: 100 # in bytes
              usage:  5 # in bytes
            }
            #VMs: []
          }
          {
            name_label: 'XServ2'
            address: '192.168.1.2'
            memory: {
              size: 100 # in bytes
              usage: 80 # in bytes
            }
            VMs: [
              {
                name_label: 'Web1'
                name_description: 'Apache2 + PHP5 FPM + node VM'
                address: '192.168.1.141'
                power_state: 'Running'
                CPU_usage: 5 # in percentages
                memory: {
                  size: 1024 # in bytes
                  usage: 599 # in bytes
                }
              }
              {
                name_label: 'Test CentOS'
                name_description: 'Testing VM for CentOS 6 Pv Drivers'
                #address: ''
                power_state: 'Halted'
                CPU_usage: 3 # in percentages
                memory: {
                  size: 2048 # in bytes
                  usage: 599 # in bytes
                }
              }
              {
                name_label: 'Web2'
                name_description: 'NGinx FrontEnd'
                address: '192.168.1.15'
                power_state: 'Running'
                CPU_usage: 3 # in percentages
                memory: {
                  size: 4096 # in bytes
                  usage: 599 # in bytes
                }
              }
              {
                name_label: 'PG1 Prod'
                name_description: 'Postgres 9.1 VM'
                address: '192.168.1.124'
                power_state: 'Running'
                CPU_usage: 3 # in percentages
                memory: {
                  size: 4096 # in bytes
                  usage: 599 # in bytes
                }
              }
              {
                name_label: 'FreeBSD'
                name_description: 'FreeBSD 9 ZFS VM'
                address: '192.168.1.171'
                power_state: 'Running'
                CPU_usage: 3 # in percentages
                memory: {
                  size: 1024 # in bytes
                  usage: 599 # in bytes
                }
              }
            ]
          }
        ]
      }
      {
        name_label: 'Dev Pool2'
        #SRs: []
        hosts: [
          {
            name_label: 'Host Dev1'
            #enable: false
            address: '192.168.1.101'
            #memory: {}
            #VMs: []
          }
          {
            name_label: 'Host Dev2'
            enable: true
            address: '192.168.1.102'
            memory: {
              size: 100 # in bytes
              usage: 80 # in bytes
            }
            VMs: [
              {
                name_label: 'VDev1'
                name_description: 'Dev VM for IT'
                address: '192.168.1.241'
                power_state: 'Running'
                CPU_usage: 30 # in percentages
                memory: {
                  size: 512 # in bytes
                  usage: 128 # in bytes
                }
              }
            ]
          }
        ]
      }
    ]

    # Compute additional info.
    for pool in $scope.pools
      pool.n_hosts = pool.hosts?.length or 0
      pool.n_VMs = 0
      pool.n_running_VMs = 0

      for host in pool.hosts or []
        host.n_VMs = host.VMs?.length or 0
        pool.n_VMs += host.n_VMs

        host.n_running_VMs = 0
        ++host.n_running_VMs for VM in host.VMs or [] when VM.power_state == 'Running'
        pool.n_running_VMs += host.n_running_VMs
