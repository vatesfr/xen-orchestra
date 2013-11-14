'use strict'

angular.module('xoWebApp')
  .controller 'HostCtrl', ($scope) ->
    giga = Math.pow 1024, 3

    $scope.host =
      {
        uuid: 'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec'
        type: 'host'
        name_label: 'Host1'
        name_description: 'Prod Host'
        hostname: 'Host1'
        pool: '843c4b17-7ecf-4102-8696-e0da715e3791'
        power_state: 'Running'
        enabled: 'True'
        address: '192.168.1.1'
        server_uptime: ''
        # XAPI in other_config:
        iscsi_iqn: 'iqn.1992-01.com.example:storage:diskarrays-sn-a8675309'
        vCPUs: 10
        CPUs: 4
        memory: {
          size: 16 * giga # in bytes
          usage: 4 * giga # in bytes
          available: 12 * giga # in bytes
        }
        running_VMs: 6
        tags: ['Prod']
      }

