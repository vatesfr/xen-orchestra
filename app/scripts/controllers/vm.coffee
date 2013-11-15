'use strict'

angular.module('xoWebApp')
  .controller 'VmCtrl', ($scope) ->
    $scope.vm = {

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
      resident_on: 'Host1'
      affinity: 'Host1'
      VCPUs_at_startup: 2
      VIF: ''
      snapshots: ''
      tags: ['Web','NGinx','Load-balancer']
    }
