{expect: $expect} = require 'chai'

$sinon = require 'sinon'

#---------------------------------------------------------------------

{$MappedCollection} = require './MappedCollection.coffee'

# Helpers for dealing with fibers.
{$promisify} = require './fibers-utils'

#=====================================================================

describe 'spec', ->

  collection = null
  before $promisify ->
    # Creates the collection.
    collection = new $MappedCollection()

    # Loads the spec.
    (require './spec').call collection

    # Loads the mockup data.
    collection.set (require './spec.spec-data')

    #console.log collection.get()

  it 'xo', ->
    xo = collection.get 'xo'

    #console.log xo

    $expect(xo).to.be.an 'object'

    $expect(xo.type).to.equal 'xo'

    $expect(xo.pools).to.have.members [
      'OpaqueRef:6462d0b3-8f20-ef76-fddf-002f7af3452e'
    ]

    $expect(xo.$CPUs).to.equal 8

    $expect(xo.$running_VMs).to.have.members [
      'OpaqueRef:fdaba312-c3a5-0190-b1a1-bf389567e620'
      'OpaqueRef:46fa4c52-5e93-6cf7-32e3-c51fb4ed106d'
      'OpaqueRef:c0fa9288-2a6b-cd8e-b9a8-cc5afc63b386'
      'OpaqueRef:be2390b2-cd08-53f5-3fae-b76f6f3725bf'
      'OpaqueRef:8f9966ea-38ef-ac4c-b634-81e31ef1e7c1'
      'OpaqueRef:646297e5-4fd6-c70d-6365-ef19b9807f64'
      'OpaqueRef:1ef43ee8-bc18-6c4f-4919-0e42a3ac6e4b'
    ]

    $expect(xo.$vCPUs).to.equal 10

    $expect(xo.$memory).to.be.an 'object'
    $expect(xo.$memory.usage).to.equal 15185723392
    $expect(xo.$memory.size).to.equal 33532379136

    UUIDsToKeys = {}
    UUIDsToKeys[obj.UUID] = "#{obj.ref}" for obj in collection.get() when obj.UUID?
    $expect(xo.$UUIDsToKeys).to.deep.equal UUIDsToKeys

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

    $expect(pool.networks).to.have.members [
      'OpaqueRef:dbc93777-f2c0-e888-967d-dd9beeffb3c0'
      'OpaqueRef:4e265829-7517-3520-6a97-56b6ac0730c9'
      'OpaqueRef:16013d48-b9eb-84c0-0e62-d809211b0632'
    ]

    $expect(pool.templates).to.have.members [
      'OpaqueRef:f81c6db6-4227-55a5-0c2f-b670ca5d8d3f'
      'OpaqueRef:f449b8ec-ac86-1b6d-2347-37ec36c41bc5'
      'OpaqueRef:f02a3c19-447b-c618-fb51-a9cde79be17c'
      'OpaqueRef:ee2e2c00-8011-4847-ba7e-c288d5fb01f5'
      'OpaqueRef:ebc96e49-11d4-471d-c21f-625a95c34ff9'
      'OpaqueRef:e9fb38c8-acc3-dbb8-cc6f-f1f89b03c1ae'
      'OpaqueRef:e803bc1b-d3be-b95f-f3cc-a26a174ec93c'
      'OpaqueRef:e373c644-3576-985e-9c8f-67062c81d0d2'
      'OpaqueRef:e3035b8b-cd27-3e7c-ecbf-54a18a2da59e'
      'OpaqueRef:d99a46bf-1b68-072c-00db-444d099466cd'
      'OpaqueRef:d45b3989-7350-5166-eeaa-7b789a32addd'
      'OpaqueRef:d18c965e-0cef-48b0-2f8d-d48ef6663c32'
      'OpaqueRef:d15de0db-1dc5-2a00-331a-c0f7d3c2e123'
      'OpaqueRef:cfe620f9-5c68-0f35-ce9f-8f5227fda1c8'
      'OpaqueRef:cb865487-9139-3fbc-4aac-68abdb663925'
      'OpaqueRef:c8bf31d6-9888-4256-1547-c722016a0079'
      'OpaqueRef:c651901b-0944-be6b-aabf-a87d9a037edd'
      'OpaqueRef:c5a9e2de-1916-7f4c-aa2a-ce95d138032b'
      'OpaqueRef:c22bce1f-16a0-7745-179d-dcbd5c5deab3'
      'OpaqueRef:be6abc7d-dd7a-5ee6-9c95-8e562a69d992'
      'OpaqueRef:b9587bb6-6efe-0c71-e01c-2c750c9ab774'
      'OpaqueRef:b6f58482-8b60-b3b4-2a01-0d6113411bf2'
      'OpaqueRef:ad21fbbb-6cf9-e6ca-c415-1f428f20da1f'
      'OpaqueRef:aa2d04ec-0512-c128-8820-c8ecde93baa4'
      'OpaqueRef:a247a02f-8909-5044-64a0-82460b25e740'
      'OpaqueRef:9d28dba9-aee6-cafd-06af-54ebdfb1c271'
      'OpaqueRef:9796cc01-6640-211f-09f9-fee94f9cd720'
      'OpaqueRef:922b3a98-f238-4cea-8b75-c38e90ac11ee'
      'OpaqueRef:8e720505-e75b-eda3-3b14-fd1471890cc1'
      'OpaqueRef:8e3211dc-fdaf-22c7-41b2-c3a892529679'
      'OpaqueRef:89919714-1184-ce4b-3cb5-67059640b3a7'
      'OpaqueRef:892768c0-4d15-769f-e760-b781a0291ddb'
      'OpaqueRef:838ff163-ae6e-d98e-9cef-4d783f81dcb0'
      'OpaqueRef:8079d64b-fe87-0ecf-e558-7b607b0e1524'
      'OpaqueRef:773d92c9-898b-bc25-a50d-d868bbf933a4'
      'OpaqueRef:770d2193-ab69-4fc3-c462-7f75a79d497c'
      'OpaqueRef:75441e00-55df-85f5-1780-731110df91de'
      'OpaqueRef:6ee1cc24-ebbb-b02a-88b0-a921c7a5f217'
      'OpaqueRef:6b5be573-b116-6238-9cff-bde0658d6f18'
      'OpaqueRef:6a09a6de-e778-a474-4ebd-f617db5b5d5e'
      'OpaqueRef:616942c0-1e1b-e733-3c4c-7236fd3de158'
      'OpaqueRef:5e93cf73-a212-a83f-d3f9-a539be98d320'
      'OpaqueRef:56af2e14-d4bb-20e9-421b-00d75dfb89f2'
      'OpaqueRef:5059cc2d-b414-97eb-6aac-ce816b72b2bd'
      'OpaqueRef:4a43ad28-b809-2c8f-aa24-70d8bd4954f2'
      'OpaqueRef:466d7dc3-f2df-8c8d-685d-eef256fe2b43'
      'OpaqueRef:4347e9d6-7faf-90e4-4f5f-d513cf44b3cc'
      'OpaqueRef:3c4558e8-ed88-ce88-81a9-111ac2cc56d6'
      'OpaqueRef:3b97e45b-aa4e-d175-95e5-e95ceefa0b6b'
      'OpaqueRef:2e3b5ada-5083-87b1-d6fb-aaa0e5bd862d'
      'OpaqueRef:2b6e3248-52b0-85d1-7415-4f91a0a90a3a'
      'OpaqueRef:2a838052-3aa3-d09d-1eae-8293a565fef5'
      'OpaqueRef:2a092eee-7c6a-058b-0368-b37362328678'
      'OpaqueRef:2968283f-8656-6e31-816c-e96325e66ebf'
      'OpaqueRef:27ad4e06-a7b2-20a2-4fd9-7f1b54fdc5a2'
      'OpaqueRef:217d930f-8e65-14e6-eb20-63d55158093f'
      'OpaqueRef:20377446-2388-5c8f-d3f2-6e9c883c61d9'
      'OpaqueRef:201cf416-bfd0-00d3-a4d2-b19226c43c82'
      'OpaqueRef:1ed4ee31-56e0-98da-65d4-00c776716b9c'
      'OpaqueRef:1c0b590d-563b-5061-a253-f98535ab8389'
      'OpaqueRef:1be0fe3b-1944-06db-3734-b6bb888cfe78'
      'OpaqueRef:12d0dfc0-ce63-a072-3cd0-ccba7bd3c200'
      'OpaqueRef:039273c3-b4b2-5c68-63e4-c5610a738fe3'
      'OpaqueRef:030314a2-0909-9e7a-418a-9f38746aaf0c',
    ]

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

    $expect(host.memory).to.be.an 'object'
    $expect(host.memory.usage).to.equal 2564788224
    $expect(host.memory.size).to.equal 8502759424

    $expect(host.power_state).to.equal 'Running'

    $expect(host.SRs).to.have.members [
      'OpaqueRef:31be9b5e-882a-a8ae-0edf-bf8942b49b5a'
      'OpaqueRef:7c88a8c6-fc48-8836-28fa-212f67c42d2f'
      'OpaqueRef:ec76bd6a-f2c0-636d-ca72-de8fb42d6eea'
    ]

    $expect(host.templates).to.have.members [
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

    $expect(host.$vCPUs).to.equal 2

  it  'VM', ->
    vm = collection.get 'OpaqueRef:fdaba312-c3a5-0190-b1a1-bf389567e620'

    #console.log vm

    $expect(vm).to.be.an 'object'

    $expect(vm.type).to.equal 'VM'

    $expect(vm.name_label).to.equal 'ceph3'

    $expect(vm.name_description).to.equal ''

    $expect(vm.tags).to.have.members []

    $expect(vm.addresses).to.deep.equal {
      '0/ip': '192.168.1.116'
      '0/ipv6/0': 'fe80::cc20:2bff:fe38:7ffd'
    }

    $expect(vm.consoles).to.deep.equal [
      {
        uuid: 'b7f85b67-4b8a-0586-b279-6146da76642f'
        protocol: 'rfb'
        location: 'https://192.168.1.1/console?uuid=b7f85b67-4b8a-0586-b279-6146da76642f'
        VM: 'OpaqueRef:fdaba312-c3a5-0190-b1a1-bf389567e620'
        other_config: {}
        '$pool': '313624ab-0958-bb1e-45b5-7556a463a10b'
        '$poolRef': 'OpaqueRef:6462d0b3-8f20-ef76-fddf-002f7af3452e'
        '$ref': 'OpaqueRef:69b8dbde-161c-b3fa-bd1a-3567e7efdbda'
        '$type': 'console'
      }
    ]

    $expect(vm.current_operations).to.deep.equal {
      # No data for this test.
    }

    $expect(vm.memory).to.be.an 'object'
    $expect(vm.memory.usage).to.be.undefined
    $expect(vm.memory.size).to.equal 536838144

    $expect(vm.messages).to.have.members [
      'OpaqueRef:a242799a-03bf-b55e-ecde-ddfe902fa69e'
      'OpaqueRef:5cec485b-e276-c45b-09cb-dd02bb1d00f3'
      'OpaqueRef:ff3b6df1-b761-0d75-e80e-4ef137eec9e6'
      'OpaqueRef:a8d94d7e-7a6e-0cc1-b7a0-8f18940410fd'
      'OpaqueRef:35585a79-caf7-6522-18ee-8d3e8459441d'
      'OpaqueRef:68d1102f-eadc-e1f3-7949-3f62248c165c'
      'OpaqueRef:974bef10-184a-c063-aa32-c318fd39e400'
      'OpaqueRef:e092c4e1-a211-204a-f773-49cc3a4611be'
      'OpaqueRef:013a4a12-1981-fbc8-92ac-1fa45d2e9c9c'
      'OpaqueRef:a77fc714-b5b1-0c37-d006-0935506bb8cd'
      'OpaqueRef:554ec983-e67a-fc8b-7d2a-00c55be5f266'
      'OpaqueRef:38404a18-4c1b-0bf5-1d45-c47243bbc69d'
      'OpaqueRef:0f98e883-a4d5-0fd8-3aa3-92be69adc4e3'
      'OpaqueRef:b3e9ac53-f6b8-4c49-f096-57f680136477'
      'OpaqueRef:1aa65d64-a00b-4c0b-be07-95f6eec7fd87'
      'OpaqueRef:be431f8c-f39b-4a64-5fc2-de9744ced26a'
      'OpaqueRef:0e571611-6194-6ce6-bae0-94bbe57576c6'
      'OpaqueRef:114fdd8a-844c-6bb5-0855-e3427bc8f073'
      'OpaqueRef:a486606c-1c75-e1c3-56de-c6e1bc3df980'
      'OpaqueRef:b6975094-843e-a19a-6101-ee7953e40580'
      'OpaqueRef:f15d7d4c-32d1-45e1-5f6f-ddc68733bab6'
      'OpaqueRef:1b04b1a2-e8b2-df82-6618-0d0a741d8bbb'
      'OpaqueRef:dcd41e75-47fc-5ae5-1d59-5176a7b76eaa'
      'OpaqueRef:71ed5eba-33c9-6deb-6dc2-ab670a6c968b'
      'OpaqueRef:59ee665c-9270-64a4-3829-aef3e045a705'
      'OpaqueRef:88979f4b-16ef-3b99-a616-aa1e2787bebe'
      'OpaqueRef:80a3e419-5a81-a7df-103d-5cf60bbde793'
      'OpaqueRef:38737284-e4e1-5172-2bf3-f9d70dcaadfa'
      'OpaqueRef:456d4d7f-77f8-ef40-aadd-f56601bc7c2b'
      'OpaqueRef:4a949518-cc01-a003-f386-b3319db6d7a6'
      'OpaqueRef:c8834c52-f15b-437d-1e09-958fedbf3c5b'
      'OpaqueRef:07d40d2c-4f6e-4f5f-0c3e-c2ea028d4fc4'
      'OpaqueRef:6df45555-1b11-2873-8947-2b6e7c9445be'
      'OpaqueRef:d3c60e69-2cf8-191f-9679-d6ae0ecdf5f9'
      'OpaqueRef:ed499671-2c01-3dc9-f6cd-553fef4b6716'
    ]

    $expect(vm.power_state).to.equal 'Running'

    $expect(vm.CPUs).to.be.an 'object'
    $expect(vm.CPUs.number).to.equal 1

    $expect(vm.$CPU_usage).to.be.null

    $expect(vm.$container).to.equal 'OpaqueRef:bbc98f5e-1a17-2030-28af-0df2393f3145'

    $expect(vm.snapshots).to.have.members []

    $expect(vm.snapshot_time).to.equal null

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

    $expect(vm.template_info.arch).to.equal 'amd64'

    $expect(vm.template_info.disks).to.deep.equal [
      {
        bootable: true
        device: '0'
        size: 8589934592
        SR: ''
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

    $expect(vbd.bootable).to.be.false

    $expect(vbd.read_only).to.be.false

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
    message =  collection.get 'OpaqueRef:cb515b9a-ef8c-13d4-88ea-e0d3ee88d22a'

    #console.log message

    $expect(message.type).to.equal 'message'

    $expect(message.time).to.equal 1389449056

    $expect(message.$object).to.equal 'OpaqueRef:bbc98f5e-1a17-2030-28af-0df2393f3145'

    $expect(message.name).to.equal 'PBD_PLUG_FAILED_ON_SERVER_START'

    $expect(message.body).to.equal ''

  it 'task', ->
    all = collection.get()

    for object in all
      if object.type is 'task'
        console.log object

    # FIXME: we need to update the tests data to complete this test.
