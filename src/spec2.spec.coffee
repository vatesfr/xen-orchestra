{expect: $expect} = require 'chai'

$sinon = require 'sinon'

#---------------------------------------------------------------------

{$MappedCollection2} = require './MappedCollection2.coffee'

$helpers = require './helpers'

# Helpers for dealing with fibers.
{$promisify} = require './fibers-utils'

#=====================================================================

describe 'spec2', ->

  collection = null
  before $promisify ->
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

    #console.log xo

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
      'OpaqueRef:d6fe49bf-dd48-c929-5aab-b2786a2e7aee'
      'OpaqueRef:6637b7d7-9e5c-f331-c7e4-a7f68f77a047'
      'OpaqueRef:557155b2-f092-3417-f509-7ee35b1d42da'
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

    $expect(host.$PIFs).to.have.members [
      'OpaqueRef:aef57ed4-e4d9-7f72-0376-b781a19bb9d2'
      'OpaqueRef:06f53e3d-d8de-d4ed-6359-9e20b4fb0d21'
    ]

    $expect(host.messages).to.have.members [
      'OpaqueRef:cb515b9a-ef8c-13d4-88ea-e0d3ee88d22a'
      'OpaqueRef:6ba7c244-3b44-2ed2-ec81-4fa13ea82465'
      'OpaqueRef:0e3fc97f-45ce-26c3-9435-899be96b35c4'
      'OpaqueRef:6ca16f45-6266-6cff-55cd-19a8ef0acf1a'
      'OpaqueRef:11452a2a-1ccd-e4df-25d8-ba99bba710db'
      'OpaqueRef:9ddc8eb2-969f-ba56-757a-efd482da5ce9'
      'OpaqueRef:68c8d0c6-e5a2-8ade-569a-dfc732e7994d'
      'OpaqueRef:ddb628ca-24f1-04d2-0b2c-9996aaab59f2'
      'OpaqueRef:0e7044a7-542b-4dd9-65bc-cded0e41853a'
      'OpaqueRef:ee26daf0-2ff7-734e-438d-9a521aaaa0c5'
      'OpaqueRef:40f8459f-1b6b-1625-1284-0f2878c3203d'
      'OpaqueRef:739ca434-6dca-b633-0097-b3f3183150a7'
      'OpaqueRef:cf655e45-c8c7-bdb9-e56c-5b67d6952f15'
      'OpaqueRef:3e33b140-f7e8-7dcc-3475-97dcc2fbfb5b'
      'OpaqueRef:8f3e2923-e690-e859-4f9e-a3e711a1e230'
      'OpaqueRef:ed7b1960-1ab7-4f47-8ef1-7a7769e09207'
      'OpaqueRef:6a0c4183-2f95-661f-9b19-0df0015867ca'
      'OpaqueRef:8d04b3fa-e81d-c6ae-d072-bd3a1ea22189'
      'OpaqueRef:dada1bd4-d7ed-429f-0a1a-585a3bfbf7e6'
      'OpaqueRef:a5648ca1-b37a-0765-9192-ebfb9ff376e8'
      'OpaqueRef:78c09b42-ad6f-0e66-0349-80b45264120d'
      'OpaqueRef:9c657a2b-560c-2050-014a-20e8cf5bd235'
      'OpaqueRef:1d50d25b-41f6-ffd3-5410-0de4fbed8543'
      'OpaqueRef:cb515b9a-ef8c-13d4-88ea-e0d3ee88d22a'
      'OpaqueRef:6ba7c244-3b44-2ed2-ec81-4fa13ea82465'
      'OpaqueRef:0e3fc97f-45ce-26c3-9435-899be96b35c4'
      'OpaqueRef:6ca16f45-6266-6cff-55cd-19a8ef0acf1a'
      'OpaqueRef:11452a2a-1ccd-e4df-25d8-ba99bba710db'
      'OpaqueRef:9ddc8eb2-969f-ba56-757a-efd482da5ce9'
      'OpaqueRef:68c8d0c6-e5a2-8ade-569a-dfc732e7994d'
      'OpaqueRef:ddb628ca-24f1-04d2-0b2c-9996aaab59f2'
      'OpaqueRef:0e7044a7-542b-4dd9-65bc-cded0e41853a'
      'OpaqueRef:ee26daf0-2ff7-734e-438d-9a521aaaa0c5'
      'OpaqueRef:40f8459f-1b6b-1625-1284-0f2878c3203d'
      'OpaqueRef:739ca434-6dca-b633-0097-b3f3183150a7'
      'OpaqueRef:cf655e45-c8c7-bdb9-e56c-5b67d6952f15'
      'OpaqueRef:3e33b140-f7e8-7dcc-3475-97dcc2fbfb5b'
      'OpaqueRef:8f3e2923-e690-e859-4f9e-a3e711a1e230'
      'OpaqueRef:ed7b1960-1ab7-4f47-8ef1-7a7769e09207'
      'OpaqueRef:6a0c4183-2f95-661f-9b19-0df0015867ca'
      'OpaqueRef:8d04b3fa-e81d-c6ae-d072-bd3a1ea22189'
      'OpaqueRef:dada1bd4-d7ed-429f-0a1a-585a3bfbf7e6'
      'OpaqueRef:a5648ca1-b37a-0765-9192-ebfb9ff376e8'
      'OpaqueRef:78c09b42-ad6f-0e66-0349-80b45264120d'
      'OpaqueRef:9c657a2b-560c-2050-014a-20e8cf5bd235'
      'OpaqueRef:1d50d25b-41f6-ffd3-5410-0de4fbed8543'
    ]

    $expect(host.tasks).to.have.members [
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

    $expect(vm.memory).to.be.an 'object'
    $expect(vm.memory.usage).to.be.null
    #$expect(vm.memory.size).to.equal '' # FIXME

    $expect(vm.messages).to.have.members []

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

    $expect(vm.VIFs).to.have.members [
      'OpaqueRef:20349ad5-0a0d-4b80-dcc0-0037fa647182'
    ]

  it 'VM-template', ->
    vm = collection.get 'OpaqueRef:f02a3c19-447b-c618-fb51-a9cde79be17c'

    #console.log vm

    # Only specific VM-templates fields will be tested.

    $expect(vm.type).to.equal 'VM-template'

    $expect(vm.template_info).to.be.an 'object'

    $expect(vm.template_info.disks).to.deep.equal [
      {
        device: '0'
        size: 8589934592
        SR: ''
        bootable: true
        type: 'system'
      }
    ]

    $expect(vm.template_info.install_methods).to.have.members [
      'cdrom'
      'http'
      'ftp'
    ]

  it 'SR', ->
    sr = collection.get 'OpaqueRef:d6fe49bf-dd48-c929-5aab-b2786a2e7aee'

    #console.log sr

    $expect(sr).to.be.an 'object'

    $expect(sr.type).to.equal 'SR'

    $expect(sr.name_label).to.equal 'Zfs'

    $expect(sr.name_description).to.equal 'iSCSI SR [192.168.0.100 (iqn.1986-03.com.sun:02:ba2ab54c-2d14-eb74-d6f9-ef7c4f28ff1e; LUN 0: A83BCKLAF: 2048 GB (NEXENTA))]'

    $expect(sr.SR_type).to.equal 'lvmoiscsi'

    $expect(sr.content_type).to.equal ''

    $expect(sr.physical_usage).to.equal 205831274496

    $expect(sr.usage).to.equal 202358390784

    $expect(sr.size).to.equal 2199010672640

    $expect(sr.$container).to.equal 'OpaqueRef:6462d0b3-8f20-ef76-fddf-002f7af3452e'

    $expect(sr.$PBDs).to.have.members [
      'OpaqueRef:ff32de74-138c-9d80-ab58-c631d2aa0e71'
      'OpaqueRef:200674ae-d9ab-2caa-a283-4fa3d14592fd'
    ]

    $expect(sr.VDIs).to.have.members [
      'OpaqueRef:b4a1573f-c235-8acd-4625-dfbcb2beb523'
      'OpaqueRef:098a2155-605b-241e-f775-a05c2133874e'
      'OpaqueRef:f7d900f9-a4fe-9a3e-ead8-28db301d26e8'
      'OpaqueRef:f26d2af5-b529-4d16-21d1-a56965e7bfb1'
      'OpaqueRef:ec5ce10e-023e-9a9f-eef7-a64e4c6d7b28'
      'OpaqueRef:e0eb5eb1-a485-fcfc-071e-fafa17f9ac48'
      'OpaqueRef:c4aa5d87-4115-c359-9cdf-c16fbf56cf2c'
      'OpaqueRef:b06a9d3f-5132-e58f-25c4-ef94d5b38986'
      'OpaqueRef:a4dd8a73-5393-81ce-abce-fc1502490a6d'
      'OpaqueRef:83331526-8bd8-9644-0a7d-9f645f5fcd70'
      'OpaqueRef:693bef17-aa19-63f8-3775-7d3b2dbce9d6'
      'OpaqueRef:67618138-57df-e90a-74c6-402ad62d657b'
      'OpaqueRef:5f1d5117-1033-b12a-92a8-99f206c9dbba'
      'OpaqueRef:287084c1-241a-58df-929a-cbe2e7454a56'
      'OpaqueRef:1f7f9828-f4e7-41dd-20e6-3bf57c559a78'
    ]

  it 'PBD', ->
    pbd = collection.get 'OpaqueRef:ff32de74-138c-9d80-ab58-c631d2aa0e71'

    #console.log pbd

    $expect(pbd).to.an 'object'

    $expect(pbd.type).to.equal 'PBD'

    $expect(pbd.attached).to.be.true

    $expect(pbd.host).to.equal 'OpaqueRef:bbc98f5e-1a17-2030-28af-0df2393f3145'

    $expect(pbd.SR).to.equal 'OpaqueRef:d6fe49bf-dd48-c929-5aab-b2786a2e7aee'

  it 'PIF', ->
    pif = collection.get 'OpaqueRef:aef57ed4-e4d9-7f72-0376-b781a19bb9d2'

    #console.log pif

    $expect(pif).to.an 'object'

    $expect(pif.type).to.equal 'PIF'

    $expect(pif.attached).to.be.true

    $expect(pif.device).to.equal 'eth0'

    $expect(pif.IP).to.equal '192.168.1.1'

    $expect(pif.$host).to.equal 'OpaqueRef:bbc98f5e-1a17-2030-28af-0df2393f3145'

    $expect(pif.MAC).to.equal '90:2b:34:d3:ce:75'

    $expect(pif.management).to.be.true

    $expect(pif.mode).to.equal 'Static'

    $expect(pif.MTU).to.equal 1500

    $expect(pif.netmask).to.equal '255.255.255.0'

    $expect(pif.$network).to.equal 'OpaqueRef:dbc93777-f2c0-e888-967d-dd9beeffb3c0'

  it 'VDI', ->
    vdi = collection.get 'OpaqueRef:1f7f9828-f4e7-41dd-20e6-3bf57c559a78'

    #console.log vdi

    $expect(vdi).to.an 'object'

    $expect(vdi.type).to.equal 'VDI'

    $expect(vdi.name_label).to.equal 'ceph'

    $expect(vdi.name_description).to.equal ''

    $expect(vdi.usage).to.equal 21525168128

    $expect(vdi.size).to.equal 21474836480

    $expect(vdi.$snapshot_of).to.equal null

    $expect(vdi.snapshots).to.have.members [
      'OpaqueRef:b4a1573f-c235-8acd-4625-dfbcb2beb523'
    ]

    $expect(vdi.$SR).to.equal 'OpaqueRef:d6fe49bf-dd48-c929-5aab-b2786a2e7aee'

    $expect(vdi.$VBDs).to.have.members [
      'OpaqueRef:9f15200b-3cac-7a61-b3e8-dd2fc0a5572d'
    ]

  it 'VBD', ->
    vbd = collection.get 'OpaqueRef:9f15200b-3cac-7a61-b3e8-dd2fc0a5572d'

    #console.log vbd

    $expect(vbd).to.an 'object'

    $expect(vbd.type).to.equal 'VBD'

    $expect(vbd.attached).to.be.true

    $expect(vbd.VDI).to.equal 'OpaqueRef:1f7f9828-f4e7-41dd-20e6-3bf57c559a78'

    $expect(vbd.VM).to.equal 'OpaqueRef:be2390b2-cd08-53f5-3fae-b76f6f3725bf'

  it 'VIF', ->
    vif = collection.get 'OpaqueRef:20349ad5-0a0d-4b80-dcc0-0037fa647182'

    #console.log vif

    $expect(vif).to.an 'object'

    $expect(vif.type).to.equal 'VIF'

    $expect(vif.attached).to.be.true

    $expect(vif.device).to.equal '0'

    $expect(vif.MAC).to.equal 'ce:20:2b:38:7f:fd'

    $expect(vif.MTU).to.equal 1500

    $expect(vif.$network).to.equal 'OpaqueRef:dbc93777-f2c0-e888-967d-dd9beeffb3c0'

    $expect(vif.$VM).to.equal 'OpaqueRef:fdaba312-c3a5-0190-b1a1-bf389567e620'

  it 'network', ->
    network = collection.get 'OpaqueRef:dbc93777-f2c0-e888-967d-dd9beeffb3c0'

    #console.log network

    $expect(network).to.be.an 'object'

    $expect(network.type).to.equal 'network'

    $expect(network.name_label).to.equal 'Pool-wide network associated with eth0'

    $expect(network.name_description).to.equal ''

    $expect(network.bridge).to.equal 'xenbr0'

    $expect(network.MTU).to.equal 1500

    $expect(network.PIFs).to.have.members [
      'OpaqueRef:aef57ed4-e4d9-7f72-0376-b781a19bb9d2'
      'OpaqueRef:971d6bc5-60f4-a331-bdee-444ee7cbf678'
    ]

    $expect(network.VIFs).to.have.members [
      'OpaqueRef:fc86d17e-d9d1-5534-69d6-d15edbe36d22'
      'OpaqueRef:ed2d89ca-1f4e-09ff-f80e-991d6b01de45'
      'OpaqueRef:c6651d03-cefe-accf-920b-636e32fee23c'
      'OpaqueRef:c5977d9b-cb50-a615-8488-1dd105d69802'
      'OpaqueRef:c391575b-168f-e52b-59f7-9f852a2c6854'
      'OpaqueRef:bf4da755-480b-e3fd-2bfe-f53e7204c8ae'
      'OpaqueRef:ba41d1a6-724e-aae8-3447-20f74014eb75'
      'OpaqueRef:b8df4453-542e-6c14-0eb1-174d48373bca'
      'OpaqueRef:b5980de3-1a74-9f57-1e98-2a74184211dc'
      'OpaqueRef:aaae3669-faee-4338-3156-0ce8c06c75cf'
      'OpaqueRef:aa874254-b67c-e9e3-6a08-1c770c2dd8ac'
      'OpaqueRef:7b8ecb18-5bc5-7650-3ac4-6bc22322e8ba'
      'OpaqueRef:59b884b0-521f-7b3e-6a91-319ded893e68'
      'OpaqueRef:20349ad5-0a0d-4b80-dcc0-0037fa647182'
    ]

  it 'message', ->
    # FIXME
    #console.log collection.get()

  it 'task', ->
    # FIXME: we need to update the tests data to complete this test.
