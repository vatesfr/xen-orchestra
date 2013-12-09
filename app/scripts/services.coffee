angular.module('xoWebApp')

  # This service provides session management and inject the `user`
  # into the `$rootScope`.
  .service 'session', ($rootScope) ->
    {
      logIn: (email, password) ->
        $rootScope.user = {
          email: email
        }

      logOut: ->
        $rootScope.user = null
    }

  # This service provides access to XO objects.
  .service 'objects', ->
    giga = Math.pow 1024, 3

    objects = {

      # Pools.
      '843c4b17-7ecf-4102-8696-e0da715e3791': {
        type: 'pool'
        name_label: 'Main pool'
        name_description: 'Lorem Ipsum Cloud Dolor'
        tags: ['Prod', 'Room1']
        default_SR: '81e31c8f-9d84-4fa5-b5ff-174e36cc366f'
        HA_enabled: true
        hosts: [
          'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec'
        ]
        master: 'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec'
        SRs: [
          'a86fbb1e-55dd-428e-8154-8bb4f46846d9'
        ]
        VMs: [
          'f6c55ab5-e74e-470f-b928-a2559fcf7f56'
        ]
      }
      '2d10b0a0-eca4-43a1-8ffb-6266c73280b1': {
        type: 'pool'
        name_label: 'Dev pool'
        name_description: 'Dev pool for dev VMs'
        tags: ['Dev', 'Lab']
        default_SR: '81e31c8f-9d84-4fa5-b5ff-174e36cc366f'
        #default_SR: null
        HA_enabled: false
        hosts: [
          'ae1a5bac-ac38-4577-bd75-251628549558'
          'd3953afe-1312-488e-8ae5-0744c1e6dcca'
          '6334e471-70f9-4140-8d99-6daff90e9b42'
        ]
        master: 'ae1a5bac-ac38-4577-bd75-251628549558'
        SRs: [
          '81e31c8f-9d84-4fa5-b5ff-174e36cc366f'
        ]
        #VMs: []
      }

      # Hosts
      'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec': {
        type: 'host'
        name_label: 'Host1'
        name_description: 'Prod Host'
        tags: ['Prod']
        address: '192.168.1.1'
        controller: 'f726ab4a-b01a-4943-a0d9-808a00c7673e'
        CPUs: [
          {}
          {}
        ]
        enabled: true
        hostname: 'Host1'
        iSCSI_name: 'iqn.1992-01.com.example:storage:diskarrays-sn-a8675309'
        memory: {
          size: 16 * giga # in bytes
          usage: 4 * giga # in bytes
        }
        power_state: 'Running'
        SRs: [
          'ba305307-db94-4f1b-b9fb-dbbbd269cd3d'
        ]
        VMs: [
          '24069f43-0eb1-494a-9911-3b3b371d8b74'
          'e37e7597-10d7-4bfe-af63-256be1c0a1d1'
        ]
      }
      'ae1a5bac-ac38-4577-bd75-251628549558': {
        type: 'host'
        name_label: 'Dev1'
        name_description: 'Dev Host for IT'
        tags: ['Dev']
        address: '192.168.1.103'
        controller: '9c0f0d4c-1122-461a-b167-28c97c485138'
        CPUs: [
          {}
          {}
        ]
        enabled: true
        hostname: 'Dev1'
        iSCSI_name: 'iqn.2013-03.com.example:storage:diskarrays-sn-a8675309'
        memory: {
          size: 16 * giga # in bytes
          usage: 4 * giga # in bytes
        }
        power_state: 'Running'
        SRs: [
          'e629bc99-ecfe-4c88-b6e8-ee6e33d12f04'
        ]
        VMs: [
          '254a6a7b-e0c2-4cae-998f-6338553faa4c'
          '1777b4d6-07b2-4440-969c-da1038ce824b'
          'b0b49448-9492-4561-924d-3473d635d6e7'
          '81a049cb-f8ec-46fd-952f-8e33aedd8f56'
        ]
      }
      'd3953afe-1312-488e-8ae5-0744c1e6dcca': {
        type: 'host'
        name_label: 'Dev2'
        name_description: 'Dev Host for IT'
        tags: ['Dev']
        address: '192.168.1.104'
        controller: 'ba928c90-dcec-408d-a174-31ee801e812c'
        CPUs: [
          {}
          {}
        ]
        enabled: true
        hostname: 'Dev2'
        iSCSI_name: 'iqn.2013-02.com.example:storage:diskarrays-sn-a8675309'
        memory: {
          size: 16 * giga # in bytes
          usage: 4 * giga # in bytes
        }
        power_state: 'Running'
        SRs: [
          'e629bc99-ecfe-4c88-b6e8-ee6e33d12f04'
        ]
        #VMs: []
      }
      '6334e471-70f9-4140-8d99-6daff90e9b42': {
        type: 'host'
        name_label: 'Dev3'
        name_description: 'Dev Host for IT'
        tags: ['Dev']
        address: '192.168.1.105'
        controller: 'a62d1d1d-9f72-447d-b7ff-0db42cc1727a'
        CPUs: [
          {}
          {}
        ]
        enabled: false
        hostname: 'Dev3'
        iSCSI_name: 'iqn.2013-01.com.example:storage:diskarrays-sn-a8675309'
        memory: {
          size: 16 * giga # in bytes
          usage: 4 * giga # in bytes
        }
        power_state: 'Running'
        SRs: [
          'e629bc99-ecfe-4c88-b6e8-ee6e33d12f04'
        ]
        #VMs: []
      }

      # VMs
      '9c0f0d4c-1122-461a-b167-28c97c485138': {
        type: 'VM-controller' # TODO: decide if we consider it a VM.
        name_label: 'Control domain on host: Host1'
        name_description: 'Default control domain'
        tags: []
        address: ''
        memory: {
          size: 2 * giga # in bytes
          # usage: undefined # in bytes
        }
        power_state: 'Running'
        CPUs: [
          {
            usage: 0 # in percentage
          }
        ]
      }
      'f726ab4a-b01a-4943-a0d9-808a00c7673e': {
        type: 'VM-controller'
        name_label: 'Control domain on host: Host1'
        name_description: 'Default control domain'
        tags: []
        address: ''
        memory: {
          size: 2 * giga # in bytes
          # usage: undefined # in bytes
        }
        power_state: 'Running'
        CPUs: [
          {
            usage: 0 # in percentage
          }
        ]
      }
      'ba928c90-dcec-408d-a174-31ee801e812c': {
        type: 'VM-controller'
        name_label: 'Control domain on host: Host1'
        name_description: 'Default control domain'
        tags: []
        address: ''
        memory: {
          size: 2 * giga # in bytes
          # usage: undefined # in bytes
        }
        power_state: 'Running'
        CPUs: [
          {
            usage: 0 # in percentage
          }
        ]
      }
      'a62d1d1d-9f72-447d-b7ff-0db42cc1727a': {
        type: 'VM-controller'
        name_label: 'Control domain on host: Host1'
        name_description: 'Default control domain'
        tags: []
        address: ''
        memory: {
          size: 1 * giga # in bytes
          # usage: undefined # in bytes
        }
        power_state: 'Running'
        CPUs: [
          {
            usage: 0 # in percentage
          }
        ]
      }
      '24069f43-0eb1-494a-9911-3b3b371d8b74': {
        type: 'VM'
        name_label: 'VM1'
        name_description: 'Default VM for tests'
        tags: ['Web', 'Test', 'Debian']
        address: '192.168.1.42'
        memory: {
          size: 2 * giga # in bytes
          # usage: undefined # in bytes
        }
        power_state: 'Running'
        CPUs: [
          {
            usage: 50 # in percentage
          }
        ]
      }
      'f6c55ab5-e74e-470f-b928-a2559fcf7f56': {
        type: 'VM'
        name_label: 'VM Dev 2'
        name_description: 'Default VM'
        #tags: []
        address: ''
        memory: {
          size: 2 * giga # in bytes
          # usage: undefined # in bytes
        }
        power_state: 'Halted'
        CPUs: []
      }
      'e37e7597-10d7-4bfe-af63-256be1c0a1d1': {
        type: 'VM'
        name_label: 'VFirewall'
        name_description: 'Created from template'
        #tags: []
        address: '192.168.1.12'
        memory: {
          size: 4 * giga # in bytes
          # usage: undefined # in bytes
        }
        power_state: 'Running'
        CPUs: [
          {
            usage: 64 # in percentage
          }
          {
            usage: 99 # in percentage
          }
        ]
      }
      '254a6a7b-e0c2-4cae-998f-6338553faa4c': {
        type: 'VM'
        name_label: 'VTest1'
        name_description: 'Default VM for tests'
        tags: ['Dev', 'PHP']
        address: '192.168.1.101'
        memory: {
          size: 2 * giga # in bytes
          # usage: undefined # in bytes
        }
        power_state: 'Running'
        CPUs: [
          {
            usage: 10 # in percentage
          }
        ]
      }
      '1777b4d6-07b2-4440-969c-da1038ce824b': {
        type: 'VM'
        name_label: 'VTest2'
        name_description: 'PHP 5.4 tests'
        tags: ['Dev', 'Postgres']
        address: '192.168.1.102'
        memory: {
          size: 4 * giga # in bytes
          # usage: undefined # in bytes
        }
        power_state: 'Running'
        CPUs: [
          {
            usage: 10 # in percentage
          }
        ]
      }
      'b0b49448-9492-4561-924d-3473d635d6e7': {
        type: 'VM'
        name_label: 'VTest3'
        name_description: 'MySQL load test'
        tags: ['Dev', 'MySQL']
        address: '192.168.1.103'
        memory: {
          size: 2 * giga # in bytes
          # usage: undefined # in bytes
        }
        power_state: 'Halted'
        CPUs: []
      }
      '81a049cb-f8ec-46fd-952f-8e33aedd8f56': {
        type: 'VM'
        name_label: 'VApache'
        name_description: 'VM for Apache2 tests load'
        tags: ['Apache']
        address: '192.168.1.42'
        memory: {
          size: 1 * giga # in bytes
          # usage: undefined # in bytes
        }
        power_state: 'Halted'
        CPUs: []
      }

      # SRs
      '81e31c8f-9d84-4fa5-b5ff-174e36cc366f': {
        type: 'SR'
        name_label: 'ZFS1'
        name_description: 'Nexenta SAN Storage iSCSI'
        tags: ['SAN', 'ZFS', 'Nexenta', 'Prod', 'SR']
        physical_usage: 5 * giga # in bytes
        size: 100 * giga # in bytes
        SR_type: 'LVM'
        usage: 50 * giga # in bytes
      }
      'ba305307-db94-4f1b-b9fb-dbbbd269cd3d': {
        type: 'SR'
        name_label: 'Local Storage'
        name_description: 'Local Disk'
        tags: []
        physical_usage: 5 * giga # in bytes
        size: 100 * giga # in bytes
        SR_type: 'LVM'
        usage: 10 * giga # in bytes
      }
      'a86fbb1e-55dd-428e-8154-8bb4f46846d9': {
        type: 'SR'
        name_label: 'ISO SR'
        name_description: 'ISO repository'
        tags: ['ISO', 'SR']
        physical_usage: 2 * giga # in bytes
        size: 100 * giga # in bytes
        SR_type: 'ISO'
        usage: 10 * giga # in bytes
        VDIs: [
          'a86fbb1e-55dd-428e-8154-8bb4f46846d9'
        ]
      }
      'e629bc99-ecfe-4c88-b6e8-ee6e33d12f04': {
        type: 'SR'
        name_label: 'Local Storage'
        name_description: 'Local Disk'
        tags: ['Local', 'SR']
        physical_usage: 5 * giga # in bytes
        size: 100 * giga # in bytes
        SR_type: 'LVM'
        usage: 10 * giga # in bytes
      }

      # PBDs
      'd399326b-1dc5-49f1-94c1-84f154a4ce9c': {
        type: 'PBD'
        attached: true
        host: 'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec'
        SR: 'ba305307-db94-4f1b-b9fb-dbbbd269cd3d'
      }
      '5fe2a577-3591-49e4-82cf-083698625a48': {
        type: 'PBD'
        attached: false
        host: 'ae1a5bac-ac38-4577-bd75-251628549558'
        SR: '81e31c8f-9d84-4fa5-b5ff-174e36cc366f'
      }

      # VDIs
      'e1c05a0d-1573-4dc4-b93f-807a56a9fdaf': {
        type: 'VDI'
        name_label: '0'
        name_description: 'Created by template provisioner'
        size: 10 * giga # in bytes
        usage: 2 * giga # in bytes
      }

      # VBDs
      '8ee0af6d-ba8f-475b-b3cf-ace38286b798': {
        type: 'VBD'
        VDI: 'e1c05a0d-1573-4dc4-b93f-807a56a9fdaf'
        VM: 'e37e7597-10d7-4bfe-af63-256be1c0a1d1'
      }
    }

    # Injects the UUID in the objects.
    object.$UUID = UUID for UUID, object of objects

    # Creates a view with objects grouped by type.
    byTypes = {}
    for _, object of objects
      {type} = object
      (byTypes[type] ?= []).push object

    # Creates reflexive links & compute additional statistics.
    for PBD in byTypes.PBD ? []
      (objects[PBD.host].$PBDs ?= []).push PBD.$UUID
      (objects[PBD.SR].$PBDs ?= []).push PBD.$UUID

    for SR in byTypes.SR ? []
      for VDI in SR.VDIs or []
        objects[VDI].$VDI = SR.$UUID

    for VBD in byTypes.VBD ? []
      objects[VBD.VDI].$VBD = VBD.$UUID
      (objects[VBD.VM].$VBDs ?= []).push VBD.$UUID

    for VM in byTypes.VM ? []
      if VM.CPUs?.length
        CPU_usage = 0
        for CPU in VM.CPUs ? []
          CPU_usage += CPU.usage
        VM.$CPU_usage = CPU_usage / VM.CPUs.length

    for host in byTypes.host ? []
      running_VMs = []
      vCPUs = []
      for VM_UUID in host.VMs ? []
        VM = objects[VM_UUID]

        VM.$container = host.$UUID
        if 'Running' == VM.power_state
          running_VMs.push VM
          vCPUs.push VM.CPUs...
      host.$running_VMs = running_VMs
      host.$vCPUs = vCPUs

      for SR_UUID in host.SRs ? []
        SR = objects[SR_UUID]
        SR.$container = host.$UUID

    for pool in byTypes.pool ? []
      running_hosts = []
      running_VMs = []
      VMs = []
      for host_UUID in pool.hosts ? []
        host = objects[host_UUID]

        host.$pool = pool.$UUID
        running_hosts.push host if 'Running' == host.power_state
        running_VMs.push host.$running_VMs...
        VMs.push host.VMs...
      for VM_UUID in pool.VMs ? []
        VM = objects[VM_UUID]

        VM.$container = pool.$UUID
        VMs.push VM
      for SR_UUID in pool.SRs ? []
        SR = objects[SR_UUID]
        SR.$container = pool.$UUID
      pool.$running_hosts = running_hosts
      pool.$running_VMs = running_VMs
      pool.$VMs = VMs

    {
      all: object for _, object of objects
      byUUIDs: objects
      byTypes: byTypes
    }

  .service 'stats', ->

    {
      stats: {
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
    }
