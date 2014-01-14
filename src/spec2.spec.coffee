{expect: $expect} = require 'chai'

$sinon = require 'sinon'

#---------------------------------------------------------------------

{$MappedCollection2} = require './MappedCollection2.coffee'

$helpers = require './helpers'

#=====================================================================

describe 'spec2', ->

  collection = null
  before ->
    # Creates the collection.
    collection = new $MappedCollection2()

    # Binds the helpers to the collection.
    collection.helpers = do ->
      helpers = {}
      helpers[name] = fn.bind collection for name, fn of $helpers
      helpers

    # Loads the spec.
    (require './spec2').call collection

    # Skips missing rules.
    collection.missingRule = ( -> )

    # Loads the mockup data.
    collection.set (require './spec2.spec-data')

    #console.log collection.get()

  it 'xo', ->
    xo = collection.get '00000000-0000-0000-0000-000000000000'

    $expect(xo).to.be.an 'object'

    $expect(xo.type).to.equal 'xo'

    $expect(xo.pools).to.have.members [
      'OpaqueRef:6462d0b3-8f20-ef76-fddf-002f7af3452e'
    ]

    $expect(xo.$CPUs).to.equal 8

    $expect(xo.$vCPUs).to.equal 0 # TODO: 10

    $expect(xo.$running_VMs).to.have.members [
      'OpaqueRef:fdaba312-c3a5-0190-b1a1-bf389567e620'
      'OpaqueRef:46fa4c52-5e93-6cf7-32e3-c51fb4ed106d'
      'OpaqueRef:c0fa9288-2a6b-cd8e-b9a8-cc5afc63b386'
      'OpaqueRef:be2390b2-cd08-53f5-3fae-b76f6f3725bf'
      'OpaqueRef:8f9966ea-38ef-ac4c-b634-81e31ef1e7c1'
      'OpaqueRef:646297e5-4fd6-c70d-6365-ef19b9807f64'
      'OpaqueRef:1ef43ee8-bc18-6c4f-4919-0e42a3ac6e4b'
    ]

    # TODO
    # $expect(xo.memory).to.be.an 'object'
    # $expect(xo.memory.usage).to.equal 0
    # $expect(xo.memory.size).to.equal 0

  it 'pool', ->
    pool = collection.get 'OpaqueRef:6462d0b3-8f20-ef76-fddf-002f7af3452e'

    #console.log pool

    $expect(pool).to.be.an 'object'

    $expect(pool.type).to.equal 'pool'

    $expect(pool.name_label).to.equal 'Lab Pool'

    $expect(pool.name_description).to.equal 'Vates dev pool at our HQ'

    $expect(pool.tags).to.have.members []

    $expect(pool.SRs).to.have.members [
      # TODO
    ]

    $expect(pool.HA_enabled).to.be.false

    $expect(pool.hosts).to.have.members [
      'OpaqueRef:cd0f68c5-5245-5ae8-f0e1-324e2201c692'
      'OpaqueRef:bbc98f5e-1a17-2030-28af-0df2393f3145'
    ]

    $expect(pool.master).to.equal 'OpaqueRef:bbc98f5e-1a17-2030-28af-0df2393f3145'

    $expect(pool.VMs).to.have.members [
      'OpaqueRef:d4fa8fba-ec86-5928-a1bb-dd78b6fb5944'
      'OpaqueRef:8491f148-3e78-9c74-ab98-84445c5f2861'
      'OpaqueRef:13b9ec24-04ea-ae04-78e6-6ec4b81a8deb'
    ]

    $expect(pool.$running_hosts).to.have.members [
      'OpaqueRef:cd0f68c5-5245-5ae8-f0e1-324e2201c692'
      'OpaqueRef:bbc98f5e-1a17-2030-28af-0df2393f3145'
    ]

    $expect(pool.$running_VMs).to.have.members [
      'OpaqueRef:fdaba312-c3a5-0190-b1a1-bf389567e620'
      'OpaqueRef:46fa4c52-5e93-6cf7-32e3-c51fb4ed106d'
      'OpaqueRef:c0fa9288-2a6b-cd8e-b9a8-cc5afc63b386'
      'OpaqueRef:be2390b2-cd08-53f5-3fae-b76f6f3725bf'
      'OpaqueRef:8f9966ea-38ef-ac4c-b634-81e31ef1e7c1'
      'OpaqueRef:646297e5-4fd6-c70d-6365-ef19b9807f64'
      'OpaqueRef:1ef43ee8-bc18-6c4f-4919-0e42a3ac6e4b'
    ]

    $expect(pool.$VMs).to.have.members [
      'OpaqueRef:fdaba312-c3a5-0190-b1a1-bf389567e620'
      'OpaqueRef:46fa4c52-5e93-6cf7-32e3-c51fb4ed106d'
      'OpaqueRef:d4fa8fba-ec86-5928-a1bb-dd78b6fb5944'
      'OpaqueRef:8491f148-3e78-9c74-ab98-84445c5f2861'
      'OpaqueRef:13b9ec24-04ea-ae04-78e6-6ec4b81a8deb'
      'OpaqueRef:c0fa9288-2a6b-cd8e-b9a8-cc5afc63b386'
      'OpaqueRef:be2390b2-cd08-53f5-3fae-b76f6f3725bf'
      'OpaqueRef:8f9966ea-38ef-ac4c-b634-81e31ef1e7c1'
      'OpaqueRef:646297e5-4fd6-c70d-6365-ef19b9807f64'
      'OpaqueRef:1ef43ee8-bc18-6c4f-4919-0e42a3ac6e4b'
    ]

  it 'host', ->
    host = collection.get 'OpaqueRef:bbc98f5e-1a17-2030-28af-0df2393f3145'

    #console.log host

    $expect(host).to.be.an 'object'

    $expect(host.type).to.equal 'host'

    $expect(host.name_label).to.equal 'lab1'

    $expect(host.name_description).to.equal 'Default install of XenServer'

    $expect(host.tags).to.have.members []

    $expect(host.address).to.equal '192.168.1.1'

    $expect(host.controller).to.equal 'OpaqueRef:719e4877-c7ad-68be-6b04-5750c8dcfeed'

    # Burk.
    $expect(host.CPUs).to.deep.equal {
      cpu_count: '4'
      socket_count: '1'
      vendor: 'GenuineIntel'
      speed: '3192.858'
      modelname: 'Intel(R) Core(TM) i5-3470 CPU @ 3.20GHz'
      family: '6'
      model: '58'
      stepping: '9'
      flags: 'fpu de tsc msr pae mce cx8 apic sep mtrr mca cmov pat clflush acpi mmx fxsr sse sse2 ss ht nx constant_tsc nonstop_tsc aperfmperf pni pclmulqdq vmx est ssse3 sse4_1 sse4_2 x2apic popcnt aes hypervisor ida arat tpr_shadow vnmi flexpriority ept vpid'
      features: '77bae3ff-bfebfbff-00000001-28100800'
      features_after_reboot: '77bae3ff-bfebfbff-00000001-28100800'
      physical_features: '77bae3ff-bfebfbff-00000001-28100800'
      maskable: 'full'
    }

    $expect(host.enabled).to.be.true

    $expect(host.hostname).to.equal 'lab1'

    $expect(host.iSCSI_name).to.equal 'iqn.2013-07.com.example:83ba9261'

    # $expect(host.memory).to.be.an 'object'
    # $expect(host.memory.usage).to.equal 0 # TODO
    # $expect(host.memory.size).to.equal 0  # TODO

    $expect(host.power_state).to.equal 'Running'

    $expect(host.SRs).to.have.members [
      # TODO
    ]

    $expect(host.VMs).to.have.members [
      'OpaqueRef:fdaba312-c3a5-0190-b1a1-bf389567e620'
      'OpaqueRef:46fa4c52-5e93-6cf7-32e3-c51fb4ed106d'
    ]

    $expect(host.$PBDs).to.have.members [
      'OpaqueRef:ff32de74-138c-9d80-ab58-c631d2aa0e71'
      'OpaqueRef:f0f98779-5cf8-cabc-edc3-631a2d63d89c'
      'OpaqueRef:b70f8e06-07a8-a5e7-2856-f221c822e9b2'
      'OpaqueRef:b641552a-8c92-71b3-c0a2-e4dd3d04c215'
      'OpaqueRef:93320534-824f-850a-64a2-bcbfdc2e0927'
      'OpaqueRef:0c1d3862-5a38-e4cc-4a46-d8358a622461'
    ]

    $expect(host.$messages).to.have.members [
      # TODO
    ]

    $expect(host.$tasks).to.have.members [
      # TODO
    ]

    $expect(host.$running_VMs).to.have.members [
      'OpaqueRef:fdaba312-c3a5-0190-b1a1-bf389567e620'
      'OpaqueRef:46fa4c52-5e93-6cf7-32e3-c51fb4ed106d'
    ]

    $expect(host.$vCPUs).to.equal 0

  it  'VM', ->
    vm = collection.get 'OpaqueRef:fdaba312-c3a5-0190-b1a1-bf389567e620'

    $expect(vm).to.be.an 'object'

    $expect(vm.type).to.equal 'VM'

    $expect(vm.name_label).to.equal 'ceph3'

    $expect(vm.name_description).to.equal ''

    $expect(vm.tags).to.have.members []

    $expect(vm.disks).to.deep.equal [
      {
        device: '0'
        name_description: 'Created with Xen-Orchestra'
        size: 8589934592
        SR: null
      }
    ]

    $expect(vm.memory).to.be.an 'object'
    $expect(vm.memory.usage).to.be.null
    #$expect(vm.memory.size).to.equal '' # FIXME

    $expect(vm.$messages).to.have.members []

    $expect(vm.power_state).to.equal 'Running'

    #$expect(vm.CPUs).to.be.an # FIXME

    $expect(vm.$CPU_usage).to.be.null

    $expect(vm.$container).to.equal 'OpaqueRef:bbc98f5e-1a17-2030-28af-0df2393f3145'

    $expect(vm.snapshots).to.have.members []

    $expect(vm.snapshot_time).to.equal '1969-12-31T23:00:00.000Z'

    $expect(vm.$VBDs).to.have.members [
      'OpaqueRef:dbb53525-e1a3-741b-4924-9944b845bc0c'
      'OpaqueRef:1bd20244-01a0-fec3-eb00-79a453a56446'
    ]

    $expect(vm.$VIFs).to.have.members [
      'OpaqueRef:20349ad5-0a0d-4b80-dcc0-0037fa647182'
    ]

  it 'SR', ->
    SR = collection.get
