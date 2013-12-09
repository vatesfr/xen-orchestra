retrieveTags = (UUID) -> [] # TODO

test = (value) -> value.$type is @rule.name

remove = (array, value) ->
  index = array.indexOf array, value

  array.splice(index, 1) unless index is -1

####

module.exports = (refsToUUIDs) ->

  get = (name, defaultValue) ->
    (value) ->
      if value[name] is undefined
        return defaultValue

      # If the value looks like an OpaqueRef, resolve it to a UUID.
      value = value[name]
      if refsToUUIDs[value]
        refsToUUIDs[value]
      else
        value

  ->
    key: (value, key) -> value.uuid or key

    rules:

      xo:

        # The key is directly defined here because this is a new object,
        # not bound to an existing item.
        #
        # TODO: provides a way to create multiple new items per rule.
        key: '00000000-0000-0000-0000-000000000000'

        # The value is an object.
        value:

          type: -> @rule.name

          UUID: -> @key

          pools: @dynamic [],
            pool:
              enter: (pool) -> @field.push pool.UUID
              exit:  (pool) -> remove @field, pool.UUID
              update: @noop

          $CPUs: @dynamic 0,
            host:
              # No `update`: `exit` then `enter` will be called instead.
              enter: (host) -> @field += host.CPUs.length
              exit:  (host) -> @field -= host.CPUs.length

          $running_VMs: @dynamic [],
            VM:
              # No `enter`: `update` will be called instead.
              update: (VM) ->
                remove @field, VM.UUID
                if VM.power_state is 'Running'
                  @field.push VM.UUID
              exit: (VM) -> remove @field, VM.UUID

          $vCPUs: @dynamic 0,
            VM:
              # No `update`: `exit` then `enter` will be called instead.
              enter: (VM) -> @field += VM.CPUs.length
              exit: (VM) -> @field -= VM.CPUs.length

          $memory: @dynamic { usage: 0, size: 0 },
            host:
              # No `update`: `exit` then `enter` will be called instead.
              enter: (host) ->
                @field.usage += host.memory.usage
                @field.size += host.memory.size
              exit: (host) ->
                @field.usage -= host.memory.usage
                @field.size -= host.memory.size

      pool:

        test: test

        value:

          type: -> @rule.name

          UUID: -> @key

          tags: -> retrieveTags @value.UUID

          SRs: @dynamic [],
            SR:
              enter: (value) ->
                if value.$pool is @value.UUID
                  @field.push value.UUID
              exit: (value) -> remove @field, value.UUID

          HA_enabled: get('ha_enabled')

          hosts: @dynamic [],
            host:
              enter: (value) ->
                if value.$pool is @value.UUID
                  @field.push value.UUID
              exit: (value) -> remove @field, value.UUID

          VMs: @dynamic [],
            VM:
              # FIXME: when a VM is updated, this hook will run for each
              # pool even though we know which pool to update
              # (`value.$pool`).
              # There must be a way to fix this problem while still
              # keeping a generic implementation.
              #
              # Note: I do not want to handle this field from the VM
              # rule, it would make the maintenance harder.
              update: (VM) ->
                # Unless this VM belongs to this pool, there is no need
                # to continue.
                return unless VM.$pool is @value.UUID

                # If this VM is running or paused, it is necessarily on
                # a host.
                if state is 'Paused' or state is 'Runnning'
                  remove @field, VM.UUID
                  return

                # TODO: Check whether this VM belong to a local SR.
                local = false
                unless local
                  @field.push VM.UUID

              exit: (value) -> remove @field, value.UUID

          $running_hosts: @dynamic [],
            host:
              update: (host) ->
                remove @field, host.UUID
                if host.$pool is @value.UUID and host.power_state is 'Running'
                  @field.push host.UUID
              exit: (host) -> remove @field, host.UUID

          $running_VMs: @dynamic [],
            VM:
              update: (VM) ->
                remove @field, VM.UUID
                if VM.$pool is @value.UUID and VM.power_state is 'Running'
                  @field.push VM.UUID
              exit: (VM) ->
                remove @field, VM.UUID

          $VMs: @dynamic (-> @value.VMs.slice 0),
            VM:
              update: (VM) ->
                remove @field, VM.UUID
                if VM.$pool is @value.UUID
                  @field.push VM.UUID
              exit: (VM) -> remove @field, VM.UUID

      host:

        test: test

        value:

          type: -> @rule.name

          UUID: -> @key

          name_label: get('name_label')

          name_description: get('name_description')

          tags: -> retrieveTags @value.UUID

          address: get('address')

          controller: get('controller')

          CPUs: [] # TODO

          enabled: get('enabled')

          hostname: get('hostname')

          iSCSI_name: (value) -> value.other_config?.iscsi_iqn

          memory: {} # TODO

          power_state: 'Running' # TODO

          SRs: [] # TODO

          VMs: [] # TODO

          $PBDs: [] # TODO

          $pool: null # TODO

          $running_VMs: [] # TODO

          $vCPUs: []

      VM:

        test: (value) ->
          value.$type is @rule.name and
            not value.is_control_domain and
            not value.is_a_template

        value:

          type: -> @rule.name

          UUID: -> @key

          name_label: get('name_label')

          name_description: get('name_description')

          tags: -> retrieveTags @value.UUID

          address: -> null # TODO

          memory: # TODO
            usage: 0
            size: 0

          power_state: get('power_state')

          CPUs: [] # TODO

          $CPU_usage: ->
            n = @value.CPUs.length
            return undefined unless n
            sum = 0
            sum += CPU.usage for CPU in @value.CPUs
            sum / n

          $container: null # TODO

          $VBDs: [] # TODO

      'VM-controller':
        extends: 'VM'

        test: (value) ->
          value.$type is 'VM' and value.is_control_domain

      SR:

        test: test

        value:

          type: -> @rule.name

          UUID: -> @key

          name_label: get('name_label')

          name_description: get('name_description')

          tags: -> retrieveTags @value.UUID

          SR_type: get('type')

          physical_usage: get('physical_utilization')

          usage: get('virtual_allocation')

          size: get('physical_size')

          $container: null # TODO

          $PBDs: [] # TODO

          $VDIs: [] # TODO

      PBD:

        test: test

        value:

          type: -> @rule.name

          UUID: -> @key

          attached: get('currently_attached')

          host: get('host')

          SR: get('SR')

      VDI:

        test: test

        value:

          type: -> @rule.name

          UUID: -> @key

          name_label: get('name_label')

          name_description: get('name_description')

          # TODO: determine whether or not tags are required for a VDI.
          #tags: -> retrieveTags @value.UUID

          usage: get('physical_utilization')

          size: get('virtual_size')

          # FIXME: SR.VDIs -> VDI instead of VDI.SR -> SR.
          SR: get('SR')

          $VBD: null # TODO

      VBD:

        test: test

        value:

          type: -> @rule.name

          UUID: -> @key

          VDI: get('VDI')

          VM: get('VM')
