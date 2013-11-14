'use strict'

angular.module('xoWebApp')
  .controller 'MainCtrl', ($scope) ->
    $scope.stats = {
      pools: 2
      hosts: 4
      VMs: 6
      running_VMs: 5
      vCPUs: 32
      CPUs: 12
      memory: {
        usage: 32 * Math.pow(1024, 3)
        size: 64 * Math.pow(1024, 3)
      }
    }

    $scope.pools = [
      {
        uuid: '9baa48dd-162d-4e24-aa8a-52e2b98cc101'
        name_label: 'Pool1'
        default_SR: '5e0e5191-2ab8-41a0-9699-d3ca26d990ae'
        SRs: [
          {
            uuid: '5e0e5191-2ab8-41a0-9699-d3ca26d990ae'
            name_label: 'DataCore'
            size: 100 # in bytes
            usage: 60 # in bytes
          }
          {
            uuid: '6a858d37-1c8c-4880-9f49-7f792470ceeb'
            name_label: 'ZFS'
            size: 100 # in bytes
            usage: 20 # in bytes
          }
        ]
        master: 'b489d3c8-bee2-41ce-9209-d11aaa6be7a1' # XServ1
        hosts: [
          {
            uuid: 'b489d3c8-bee2-41ce-9209-d11aaa6be7a1'
            name_label: 'XServ1'
            enabled: true
            power_state: 'Running'
            address: '192.168.1.1'
            memory: {
              size: 100 # in bytes
              usage:  5 # in bytes
            }
            #VMs: []
          }
          {
            uuid: 'ff2ec5ec-cc58-490c-b3db-c96cb86d814b'
            name_label: 'XServ2'
            enabled: true
            power_state: 'Running'
            address: '192.168.1.2'
            memory: {
              size: 100 # in bytes
              usage: 80 # in bytes
            }
            VMs: [
              {
                uuid: '1b876103-323d-498b-b5c7-c38f0e4e057b'
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
                uuid: 'f3427285-b24d-4ba5-b863-390848bf8321'
                name_label: 'Test CentOS'
                name_description: 'Testing VM for CentOS 6 Pv Drivers'
                #address: ''
                power_state: 'Halted'
                CPU_usage: 0 # in percentages
                memory: {
                  size: 2048 # in bytes
                  usage: 599 # in bytes
                }
              }
              {
                uuid: '2f590c2b-5a99-454e-987f-4c6beb33e5c8'
                name_label: 'Web2'
                name_description: 'NGinx FrontEnd'
                address: '192.168.1.15'
                power_state: 'Unknown'
                CPU_usage: 3 # in percentages
                memory: {
                  size: 4096 # in bytes
                  usage: 599 # in bytes
                }
              }
              {
                uuid: 'bd8003d5-f13a-47cd-b571-dff8b80a155b'
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
                uuid: '75fc9d5e-f752-43ce-812c-d65c562b0a17'
                name_label: 'FreeBSD'
                name_description: 'FreeBSD 9 ZFS VM'
                address: '192.168.1.171'
                power_state: 'Running'
                CPU_usage: 85 # in percentages
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
        uuid: '64d02f09-6663-48e5-8548-63f247e6a9c5'
        name_label: 'Dev Pool2'
        #SRs: []
        master: '5ddbd58d-ff2b-4ab7-a0d2-b8dc3c3609f0' # Host Dev2
        hosts: [
          {
            uuid: 'e04256d8-5ed6-4ea4-8ae0-b836051cfbcb'
            name_label: 'Host Dev1'
            #enabled: false
            power_state: 'Halted'
            address: '192.168.1.101'
            #memory: {}
            #VMs: []
          }
          {
            uuid: '5ddbd58d-ff2b-4ab7-a0d2-b8dc3c3609f0'
            name_label: 'Host Dev2'
            enabled: true
            power_state: 'Running'
            address: '192.168.1.102'
            memory: {
              size: 100 # in bytes
              usage: 80 # in bytes
            }
            VMs: [
              {
                uuid: '5c794c35-115a-4007-9ad2-ba4950e33dcf'
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

      for host in pool.hosts ? []
        host.n_VMs = host.VMs?.length ? 0
        pool.n_VMs += host.n_VMs

        host.n_running_VMs = 0
        ++host.n_running_VMs for VM in host.VMs ? [] when VM.power_state == 'Running'
        pool.n_running_VMs += host.n_running_VMs

        # Resolve the pool master.
        if host.uuid == pool.master
          pool.master = host

      # If pool.master.uuid is undefined, we have not resolved the
      # master.
      pool.master = null unless pool.master.uuid?

    # Sets up the view.
    do ->
      $actionBar = $('.action-bar')
      $actionBar.hide()

      nbChecked = 0;
      $('body').on 'change', '.checkbox-vm',  ->
        if @checked
          $actionBar.fadeIn 'fast'
          ++nbChecked
        else
          --nbChecked
          $actionBar.fadeOut 'fast' unless nbChecked
