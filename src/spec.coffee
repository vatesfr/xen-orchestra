retrieveTags = (UUID) -> [] # TODO

test = (value) -> value.$type is @rule.name

remove = (array, value) ->
  index = array.indexOf value

  array.splice(index, 1) unless index is -1

####

module.exports = (refsToUUIDs) ->

  get = (name, defaultValue) ->
    (value) ->
      if value[name] is undefined
        return defaultValue

      value = value[name]

      # If the value looks like an OpaqueRef, resolve it to a UUID.
      helper = (value) ->
        if value instanceof Array
          (helper value_ for value_ in value)
        else if refsToUUIDs[value] isnt undefined
          refsToUUIDs[value]
        else
          value

      helper value

  number = (fn) ->
    (args...) -> +(fn.apply this, args)

  ->
    key: (value, key) -> value.uuid ? key

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
              enter: (host) -> @field += +host.CPUs["cpu_count"]
              exit:  (host) -> @field -= +host.CPUs["cpu_count"]

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
              enter: (VM) ->
                if VM.power_state in ['Paused', 'Running']
                  @field += VM.CPUs.number
              exit: (VM) ->
                if VM.power_state in ['Paused', 'Running']
                  @field -= VM.CPUs.number

          $memory: @dynamic { usage: 0, size: 0 },
            host_metrics:
              # No `update`: `exit` then `enter` will be called instead.
              enter: (metrics) ->
                free = +metrics.memory_free
                total = +metrics.memory_total

                @field.usage += total - free
                @field.size += total
              exit: (metrics) ->
                free = +metrics.memory_free
                total = +metrics.memory_total

                @field.usage -= total - free
                @field.size -= total

      pool:

        test: test

        value:

          type: -> @rule.name

          UUID: -> @key

          name_label: get('name_label')

          name_description: get('name_description')

          tags: -> retrieveTags @value.UUID

          SRs: @dynamic [],
            SR:
              update: (value) ->
                remove @field, value.UUID
                if value.$shared and value.$pool is @value.UUID
                  @field.push value.UUID
              exit: (value) -> remove @field, value.UUID

          HA_enabled: get('ha_enabled')

          hosts: @dynamic [],
            host:
              enter: (value) ->
                if value.$pool is @value.UUID
                  @field.push value.UUID
              exit: (value) -> remove @field, value.UUID

          master: get('master')

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

                remove @field, VM.UUID

                # If this VM is running or paused, it is necessarily on
                # a host.
                state = VM.power_state
                return if state is 'Paused' or state is 'Running'

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

          controller: @dynamic (
            ->
              for ref in @generator.resident_VMs
                UUID = refsToUUIDs[ref]
                VM = @collection.get UUID
                return UUID if VM?.type is 'VM-controller'
              null
          ), {
            'VM-controller': {
              enter: (controller, UUID) ->
                if controller.$container is @value.UUID
                  @field = UUID
            }
          }

          CPUs: get('cpu_info')

          enabled: get('enabled')

          hostname: get('hostname')

          iSCSI_name: (value) -> value.other_config?.iscsi_iqn

          memory: @dynamic {usage: 0, size: 0},
            host_metrics:
              update: (metrics, UUID) ->
                metrics_UUID = refsToUUIDs[@generator.metrics]
                return if UUID isnt metrics_UUID
                {memory_free, memory_total} = metrics
                @field.usage = +memory_total - memory_free
                @field.size = +memory_total

          power_state: 'Running' # TODO

          SRs: [] # TODO

          # FIXME: Ugly code.
          VMs: @dynamic (
            ->
              value = []

              for ref in @generator.resident_VMs
                UUID = refsToUUIDs[ref]
                continue unless UUID?
                VM = @collection.get UUID
                continue unless VM?
                {type, $container, power_state: state} = VM
                if type is 'VM' and $container is @key and state in ['Paused', 'Running']
                  value.push UUID

              value
          ), {
            VM: {
              update: (VM, key) ->
                remove @field, key
                # console.log VM.name_label, @key, VM.$container
                if VM.$container is @value.UUID
                  @field.push key
              exit: (_, key) ->
                remove @field, key
            }
          }

          $PBDs: get('PBDs')

          $PIFs: @dynamic [], {
            PIF: {
              update: (PIF, UUID) ->
                remove @field, UUID

                # Adds this VBD to this VM if it belongs to it..
                @field.push UUID if do =>
                  for ref in @generator.PIFs
                    return true if refsToUUIDs[ref] is UUID
                  false
            }
          }

          $pool: get('$pool')

          $running_VMs: [] # TODO

          $vCPUs: @dynamic 0,
            VM:
              # No `update`: `exit` then `enter` will be called instead.
              # TODO: fix problem with vCPU count
              enter: (VM) ->
                if VM.power_state in ['Paused', 'Running']
                  @field += VM.CPUs.number
              exit: (VM) ->
                if VM.power_state in ['Paused', 'Running']
                  @field -= VM.CPUs.number

      host_metrics:

        test: test

        # Internal object, not exposed.
        private: true

        value: -> @generator

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

          address: @dynamic {
            ip: null
            }, {
            VM_guest_metrics: {
              update: (guest_metrics, UUID) ->
                return if UUID isnt refsToUUIDs[@generator.guest_metrics]

                @field.ip = guest_metrics.networks
            }
          }

          consoles: @dynamic [],
            console: {
              # TODO: handle updates and exits.
              enter: (console, UUID) ->
                found = do =>
                  for ref in @generator.consoles
                    return true if refsToUUIDs[ref] is UUID
                  false
                @field.push console if found
            }

          # TODO: `0` should not be used when the value is unknown.
          memory: @dynamic {
            usage: null
            size: number get 'memory_dynamic_min'
          }, {
            VM_metrics: {
              update: (metrics, UUID) ->
                return if UUID isnt refsToUUIDs[@generator.metrics]

                # Do not trust the metrics if the VM is not running.
                {power_state: state} = @value
                return unless state in ['Paused', 'Running']

                @field.size = +metrics.memory_actual
            }
          }

          power_state: get('power_state')

          # TODO: initialize this value with `VCPUs_at_startup`.
          # TODO: Should we use a map like the XAPI?
          # FIXME: use the RRDs to get this information.

          CPUs: @dynamic {
            number: number get('VCPUs_at_startup')
          }, {
            VM_metrics: {
              update: (metrics, UUID) ->
                return if UUID isnt refsToUUIDs[@generator.metrics]

                # Do not trust the metrics if the VM is not running.
                {power_state: state} = @value
                return unless state in ['Paused', 'Running']

                @field.number = +metrics.VCPUs_number
            }
          }

          $CPU_usage: ->
            n = @value.CPUs.length
            return undefined unless n
            sum = 0
            sum += CPU.usage for CPU in @value.CPUs
            sum / n

          # FIXME: $container should contains the pool UUID when the
          # VM is not on a host.
          $container: get('resident_on')

          # TODO: removes it when hooks have access to the generator.
          $pool: get '$pool'

          $snapshots: get ('snapshots')

          $VBDs: @dynamic [], {
            VBD: {
              update: (VBD, UUID) ->
                remove @field, UUID

                # Adds this VBD to this VM if it belongs to it..
                @field.push UUID if do =>
                  for ref in @generator.VBDs
                    return true if refsToUUIDs[ref] is UUID
                  false
            }
          }

          $VIFs: @dynamic [], {
            VIF: {
              update: (VIF, UUID) ->
                remove @field, UUID

                # Adds this VBD to this VM if it belongs to it..
                @field.push UUID if do =>
                  for ref in @generator.VIFs
                    return true if refsToUUIDs[ref] is UUID
                  false
            }
          }

          # The reference is necessary for operations with the XAPI.
          $ref: -> @generatorKey

      'VM-controller':
        extends: 'VM'

        test: (value) ->
          value.$type is 'VM' and value.is_control_domain

      'VM_metrics':

        test: test

        private: true

        value: -> @generator

      # /!\: Do not contains memory nor disks information (probably
      # deprecated).
      # The RRD will be used for that.
      'VM_guest_metrics':

        test: test

        private: true

        value: -> @generator

      SR:

        test: test

        value:

          type: -> @rule.name

          UUID: -> @key

          name_label: get('name_label')

          name_description: get('name_description')

          tags: -> retrieveTags @value.UUID

          SR_type: get('type')

          physical_usage: number get 'physical_utilisation'

          usage: number get 'virtual_allocation'

          size: number get 'physical_size'

          $container: null # TODO

          $PBDs: get('PBDs')

          $VDIs: get('VDIs')

          # FIXME: only here for pools.
          $pool: get '$pool'
          $shared: get 'shared'

      PBD:

        test: test

        value:

          type: -> @rule.name

          UUID: -> @key

          attached: get('currently_attached')

          host: get('host')

          SR: get('SR')

      PIF:

        test: (value) ->
          return false if value.$type isnt @rule.name

          # TODO: Sometimes a network does not have an associated PIF,
          # find out why.
          refsToUUIDs[value.PIF] isnt null

        value:

          type: -> @rule.name

          UUID: -> @key

          attached: get('currently_attached')

          device: get('device')

          ip: get('IP')

          host: get('host')

          mac: get('MAC')

          management: get('management')

          mode: get('ip_configuration_mode')

          mtu: get('MTU')

          netmask: get('netmask')

          # TODO: networks
          network: get('network')

          physical: get('physical')


      VDI:

        test: test

        value:

          type: -> @rule.name

          UUID: -> @key

          name_label: get('name_label')

          name_description: get('name_description')

          # TODO: determine whether or not tags are required for a VDI.
          #tags: -> retrieveTags @value.UUID

          usage: get('physical_utilisation')

          size: get('virtual_size')

          snapshot_of: get('snapshot_of')

          snapshots: get('snapshots')

          # TODO: Is the name fit?
          #snapshot_time: get('snapshot_time')

          # FIXME: SR.VDIs -> VDI instead of VDI.SR -> SR.
          SR: get('SR')

          $VBD: (value) ->
            {VBDs} = value

            if VBDs.length is 0
              null
            else
              refsToUUIDs[VBDs[0]]

      VBD:

        test: (value) ->
          return false if value.$type isnt @rule.name

          # TODO: Sometimes a VBD does not have an associated VDI,
          # find out why.
          refsToUUIDs[value.VDI] isnt null

        value:

          type: -> @rule.name

          UUID: -> @key

          VDI: get('VDI')

          VM: get('VM')

      VIF:

        test: (value) ->
          return false if value.$type isnt @rule.name

          # TODO: Sometimes a network does not have an associated VIF,
          # find out why.
          refsToUUIDs[value.VIF] isnt null

        value:

          type: -> @rule.name

          UUID: -> @key

          attached: get('currently_attached')

          device: get('device')

          mac: get('MAC')

          mtu: get('MTU')

          # TODO: networks
          network: get('network')

          VM: get('VM')

      console:

        test: test

        private: true

        value: -> @generator
