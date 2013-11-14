'use strict'

angular.module('xoWebApp')
  .controller 'ListCtrl', ($scope) ->
    giga = Math.pow 1024, 3

    $scope.objects = [
      # Pools.
      {
        uuid: '843c4b17-7ecf-4102-8696-e0da715e3791'
        type: 'pool'
        name_label: 'Main pool'
        name_description: 'Lorem Ipsum Cloud Dolor'
        default_SR: '81e31c8f-9d84-4fa5-b5ff-174e36cc366f'
        master: 'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec'
        HA_enabled: true
        hosts: 4
        running_hosts: 4
        tags: ['Prod', 'Room1']
      }
      {
        uuid: '2d10b0a0-eca4-43a1-8ffb-6266c73280b1'
        type: 'pool'
        name_label: 'Dev pool'
        name_description: 'Dev pool for dev VMs'
        #default_SR: null
        master: 'ae1a5bac-ac38-4577-bd75-251628549558'
        HA_enabled: false
        hosts: 4
        running_hosts: 3
        tags: ['Dev', 'Lab']
      }

      # Hosts.
      {
        uuid: 'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec'
        type: 'host'
        name_label: 'Host1'
        name_description: 'Prod Host'
        pool: '843c4b17-7ecf-4102-8696-e0da715e3791'
        power_state: 'Running'
        address: '192.168.1.1'
        vCPUs: 10
        CPUs: 2
        memory: {
          size: 16 * giga # in bytes
          usage: 4 * giga # in bytes
        }
        running_VMs: 6
        tags: ['Prod']
      }
      {
        uuid: 'ae1a5bac-ac38-4577-bd75-251628549558'
        type: 'host'
        name_label: 'Dev1'
        name_description: 'Dev Host for IT'
        pool: '2d10b0a0-eca4-43a1-8ffb-6266c73280b1'
        power_state: 'Running'
        address: '192.168.1.103'
        vCPUs: 1
        CPUs: 2
        memory: {
          size: 16 * giga # in bytes
          usage: 4 * giga # in bytes
        }
        running_VMs: 6
        tags: ['Dev']
      }

      # VMs.
      {
        uuid: '24069f43-0eb1-494a-9911-3b3b371d8b74'
        type: 'VM'
        name_label: 'VM1'
        name_description: 'Default VM for tests'
        power_state: 'Running'
        address: '192.168.1.42'
        vCPUs: 2
        memory: {
          size: 2 * giga # in bytes
          # usage: undefined # in bytes
        }
        host: 'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec'
        tags: ['Web', 'Test', 'Debian']
      }
      {
        uuid: 'f6c55ab5-e74e-470f-b928-a2559fcf7f56'
        type: 'VM'
        name_label: 'VM Dev 2'
        name_description: 'Default VM'
        power_state: 'Running'
        address: '192.168.1.41'
        vCPUs: 2
        memory: {
          size: 2 * giga # in bytes
          # usage: undefined # in bytes
        }
        host: 'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec'
        #tags: []
      }
      {
        uuid: 'e37e7597-10d7-4bfe-af63-256be1c0a1d1'
        type: 'VM'
        name_label: 'VFirewall'
        name_description: 'Created from template'
        power_state: 'Running'
        address: '192.168.1.12'
        vCPUs: 2
        memory: {
          size: 4 * giga # in bytes
          # usage: undefined # in bytes
        }
        host: 'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec'
        #tags: []
      }

      # SRs.
      {
        uuid: '81e31c8f-9d84-4fa5-b5ff-174e36cc366f'
        type: 'SR'
        name_label: 'ZFS1'
        name_description: 'Nexenta SAN Storage iSCSI'
        size: 100 * giga # in bytes
        usage: 10 * giga # in bytes
        SR_type: 'LVM'
        shared: true
        host: 'ae1a5bac-ac38-4577-bd75-251628549558' # host
        tags: ['SAN', 'ZFS', 'Nexenta', 'Prod', 'SR']
      }
      {
        uuid: 'ba305307-db94-4f1b-b9fb-dbbbd269cd3d'
        type: 'SR'
        name_label: 'Local Storage'
        name_description: 'Local Disk'
        size: 100 * giga # in bytes
        usage: 10 * giga # in bytes
        SR_type: 'LVM'
        shared: false
        host: 'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec' # host
        tags: ['Local', 'SR']
      }
      {
        uuid: 'a86fbb1e-55dd-428e-8154-8bb4f46846d9'
        type: 'SR'
        name_label: 'ISO SR'
        name_description: 'ISO repository'
        size: 100 * giga # in bytes
        usage: 10 * giga # in bytes
        SR_type: 'ISO'
        shared: true
        host: 'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec' # host
        tags: ['Local', 'SR']
      }
      {
        uuid: 'e629bc99-ecfe-4c88-b6e8-ee6e33d12f04'
        type: 'SR'
        name_label: 'Local Storage'
        name_description: 'Local Disk'
        size: 100 * giga # in bytes
        usage: 10 * giga # in bytes
        SR_type: 'LVM'
        shared: false
        host: 'ae1a5bac-ac38-4577-bd75-251628549558' # host
        tags: ['Local', 'SR']
      }
    ]

    map = {}
    map[object.uuid] = object for object in $scope.objects
    $scope.map = map
