$_ = require 'underscore'

#---------------------------------------------------------------------

$xml2js = require 'xml2js'

#---------------------------------------------------------------------

# Helpers for dealing with fibers.
{$synchronize} = require './fibers-utils'

#=====================================================================

$isVMRunning = ->
  switch @genval.power_state
    when 'Paused', 'Running'
      true
    else
      false

$isHostRunning = ->
  @val.power_state is 'Running'

$isTaskLive = ->
  @genval.status is 'pending' or @genval.status is 'cancelling'

# $xml2js.parseString() uses callback for synchronous code.
$parseXML = (XML) ->
  options = {
    mergeAttrs: true
    explicitArray: false
  }
  result = null
  $xml2js.parseString XML, options, (error, result_) ->
    throw error if error?
    result = result_
  result

$retrieveTags = -> [] # TODO

#=====================================================================

module.exports = ->

  {
    $map
    $set
    $sum
    $val
  } = @helpers

  # Shared watchers.
  UUIDsToKeys = $map {
    if: -> 'UUID' of @val
    val: -> [@val.UUID, @key]
    loopDetected: ( -> )
  }
  messages = $set {
    rule: 'message'
    bind: -> @val.$object
  }

  # Defines which rule should be used for this item.
  #
  # Note: If the rule does not exists, a temporary item is created. FIXME
  @dispatch = ->
    {$type: type} = @genval

    # Subtypes handling for VMs.
    if type is 'VM'
      return 'VM-controller' if @genval.is_control_domain
      return 'VM-snapshot' if @genval.is_a_snapshot
      return 'VM-template' if @genval.is_a_template

    type

  # Missing rules should be created.
  @missingRule = @rule

  # Used to apply common definition to rules.
  @hook afterRule: ->
    return unless @val?

    unless $_.isObject @val
      throw new Error 'the value should be an object'

    # Injects various common definitions.
    @val.type = @name
    unless @singleton
      # This definition are for non singleton items only.
      @key = -> @genval.$ref
      @val.UUID = -> @genval.uuid
      @val.ref = -> @genval.$ref
      @val.poolRef = -> @genval.$poolRef

      # Main objects all can have associated messages and tags.
      if @name in ['host', 'pool', 'SR', 'VM', 'VM-controller']
        @val.messages = messages
        @val.$messages = -> @val.messages # Deprecated.

        @val.tags = $retrieveTags

  # Helper to create multiple rules with the same definition.
  rules = (rules, definition) =>
    @rule rule, definition for rule in rules

  # An item is equivalent to a rule but one and only one instance of
  # this rule is created without any generator.
  @item xo: ->
    @key = '00000000-0000-0000-0000-000000000000'
    @val = {

      # TODO: Maybe there should be high-level hosts: those who do not
      # belong to a pool.

      pools: $set {
        rule: 'pool'
      }

      $CPUs: $sum {
        rule: 'host'
        val: -> +(@val.CPUs.cpu_count)
      }

      $running_VMs: $set {
        rule: 'VM'
        if: $isVMRunning
      }

      $vCPUs: $sum {
        rule: 'VM'
        val: -> @val.CPUs.number
        if: $isVMRunning
      }

      # Do not work due to problem in host rule.
      # $memory: $sum {
      #   rule: 'host'
      #   val: -> @val.memory
      #   init: {
      #     usage: 0
      #     size: 0
      #   }
      # }

      # Maps the UUIDs to keys (i.e. opaque references).
      $UUIDsToKeys: UUIDsToKeys
    }

  @rule pool: ->
    @val = {
      name_label: -> @genval.name_label

      name_description: -> @genval.name_description

      SRs: $set {
        rule: 'SR'
        bind: -> @val.$container
      }

      HA_enabled: -> @genval.ha_enabled

      hosts: $set {
        rule: 'host'
        bind: -> @genval.$poolRef
      }

      master: -> @genval.master

      VMs: $set {
        rule: 'VM'
        bind: -> @val.$container
      }

      $running_hosts: $set {
        rule: 'host'
        bind: -> @genval.$poolRef
        if: $isHostRunning
      }

      $running_VMs: $set {
        rule: 'VM'
        bind: -> @genval.$poolRef
        if: $isHostRunning
      }

      $VMs: $set {
        rule: 'VM'
        bind: -> @genval.$poolRef
      }
    }

  @rule host: ->
    @val = {
      name_label: -> @genval.name_label

      name_description: -> @genval.name_description

      address: -> @genval.address

      controller: $val {
        rule: 'VM-controller'
        bind: -> @val.$container
        val: -> @key
      }

      CPUs: -> @genval.cpu_info

      enabled: -> @genval.enabled

      hostname: -> @genval.hostname

      iSCSI_name: -> @genval.other_config?.iscsi_iqn ? null

      # memory: $sum {
      #   key: -> @genval.metrics # FIXME
      #   val: -> {
      #     usage: +@val.memory_total - @val.memory_free
      #     size: +@val.memory_total
      #   }
      #   init: {
      #     usage: 0
      #     size: 0
      #   }
      # }

      # TODO
      power_state: 'Running'

      # Local SRs are handled directly in `SR.$container`.
      SRs: $set {
        rule: 'SR'
        bind: -> @val.$container
      }

      # Local VMs are handled directly in `VM.$container`.
      VMs: $set {
        rule: 'VM'
        bind: -> @val.$container
      }

      $PBDs: -> @genval.PBDs

      PIFs: -> @genval.PIFs
      $PIFs: -> @val.PIFs

      tasks: $set {
        rule: 'task'
        bind: -> @val.$container
        if: $isTaskLive
      }
      $tasks: -> @val.tasks # Deprecated.

      $running_VMs: $set {
        rule: 'VM'
        bind: -> @val.$container
        if: $isVMRunning
      }

      $vCPUs: $sum {
        rule: 'VM'
        bind: -> @val.$container
        if: $isVMRunning
        val: -> @val.CPUs.number
      }
    }

  # This definition is shared.
  VMdef = ->
    @val = {
      name_label: -> @genval.name_label

      name_description: -> @genval.name_description

      # address: {
      #   ip: $val {
      #     key: -> @genval.guest_metrics # FIXME
      #     val: -> @val.networks
      #     default: null
      #   }
      # }

      # consoles: $set {
      #   key: -> @genval.consoles # FIXME
      # }

      memory: {
        usage: null
        # size: $val {
        #   key: -> @genval.guest_metrics # FIXME
        #   val: -> +@val.memory_actual
        #   default: +@genval.memory_dynamic_min
        # }
      }

      power_state: -> @genval.power_state

      CPUs: {
        number: 0
        # number: $val {
        #   key: -> @genval.metrics # FIXME
        #   val: -> +@genval.VCPUs_number

        #   # FIXME: must be evaluated in the context of the current object.
        #   if: -> @gen
        # }
      }

      $CPU_usage: null #TODO

      # FIXME: $container should contains the pool UUID when the VM is
      # not on a host.
      $container: ->
        if $isVMRunning.call this
          @genval.resident_on
        else
          # TODO: Handle local VMs.
          @genval.$poolRef

      snapshots: -> @genval.snapshots

      # TODO: Replace with a UNIX timestamp.
      snapshot_time: -> @genval.snapshot_time

      $VBDs: -> @genval.VBDs

      VIFs: -> @genval.VIFs
      $VIFs: -> @val.VIFs # Deprecated
    }
  @rule VM: VMdef
  @rule 'VM-controller': VMdef
  @rule 'VM-snapshot': VMdef

  # VM-template starts with the same definition but extends it.
  @rule 'VM-template': ->
    VMdef.call this

    @val.template_info = {
      arch: -> @genval.other_config?['install-arch']
      disks: ->
        disks = @genval.other_config?.disks
        return [] unless disks?

        disks = ($parseXML disks)?.provision?.disk
        return [] unless disks?

        disks = [disks] unless $_.isArray disks
        # Normalize entries.
        for disk in disks
          disk.bootable = disk.bootable is 'true'
          disk.size = +disk.size
          disk.SR = disk.sr
          delete disk.sr
        disks
      install_methods: ->
        methods = @genval.other_config?['install-methods']
        return [] unless methods?
        methods.split ','
    }

  @rule SR: ->
    @val = {
      name_label: -> @genval.name_label

      name_description: -> @genval.name_description

      SR_type: -> @genval.type

      content_type: -> @genval.content_type

      physical_usage: -> +@genval.physical_utilisation

      usage: -> +@genval.virtual_allocation

      size: -> +@genval.physical_size

      $container: ->
        if @genval.shared
          @genval.$poolRef
        else
          null # TODO

      $PBDs: -> @genval.PBDs

      VDIs: -> @genval.VDIs
      $VDIs: -> @val.VDIs # Deprecated
    }

  @rule PBD: ->
    @val = {
      attached: -> @genval.currently_attached

      host: -> @genval.host

      SR: -> @genval.SR
    }

  @rule PIF: ->
    @val = {
      attached: -> @genval.currently_attached

      device: -> @genval.device

      IP: -> @genval.IP
      ip: -> @val.IP # Deprecated

      $host: -> @genval.host
      #host: -> @val.$host # Deprecated

      MAC: -> @genval.MAC
      mac: -> @val.MAC # Deprecated

      # TODO: Find a more meaningful name.
      management: -> @genval.management

      mode: -> @genval.ip_configuration_mode

      MTU: -> +@genval.MTU
      mtu: -> @val.MTU # Deprecated

      netmask: -> @genval.netmask

      $network: -> @genval.network

      # TODO: What is it?
      #
      # Could it mean “is this a physical interface?”.
      # How could a PIF not be physical?
      #physical: -> @genval.physical
    }

  @rule VDI: ->
    @val = {
      name_label: -> @genval.name_label

      name_description: -> @genval.name_description

      # TODO: determine whether or not tags are required for a VDI.
      #tags: $retrieveTags

      usage: -> +@genval.physical_utilisation

      size: -> +@genval.virtual_size

      $snapshot_of: ->
        original = @genval.snapshot_of
        if original is 'OpaqueRef:NULL'
          null
        else
          original
      snapshot_of: -> @val.$snapshot_of # Deprecated

      snapshots: -> @genval.snapshots

      # TODO: Does the name fit?
      #snapshot_time: -> @genval.snapshot_time

      $SR: -> @genval.SR
      SR: -> @val.$SR # Deprecated

      $VBDs: -> @genval.VBDs

      $VBD: -> # Deprecated
        {VBDs} = @genval

        if VBDs.length is 0 then null else VBDs[0]
    }

  @rule VBD: ->
    @val = {
      attached: -> @genval.currently_attached

      VDI: -> @genval.VDI

      VM: -> @genval.VM
    }

  @rule VIF: ->
    @val = {
      attached: -> @genval.currently_attached

      # TODO: Should it be cast to a number?
      device: -> @genval.device

      MAC: -> @genval.MAC
      mac: -> @val.MAC # Deprecated

      MTU: -> +@genval.MTU
      mtu: -> @val.MTU # Deprecated

      $network: -> @genval.network

      $VM: -> @genval.VM
      VM: -> @val.$VM # Deprecated
    }

  @rule network: ->
    @val = {
      name_label: -> @genval.name_label

      name_description: -> @genval.name_description

      # TODO: determine whether or not tags are required for a VDI.
      #tags: $retrieveTags

      bridge: -> @genval.bridge

      MTU: -> +@genval.MTU

      PIFs: -> @genval.PIFs

      VIFs: -> @genval.VIFs
    }

  @rule message: ->
    @val = {
      # TODO: UNIX timestamp?
      time: -> @genval.timestamp

      $object: ->
        # If the key of the concerned object has already be resolved
        # returns the known value.
        return @val.$object if @val.$object?

        # Tries to resolve the key of the concerned object.
        object = (UUIDsToKeys.call this)[@genval.obj_uuid]

        # If resolved, unregister from the watcher.
        UUIDsToKeys.unregister.call this if object?

        object

      # TODO: Are these names meaningful?
      name: -> @genval.name
      body: -> @genval.body
    }

  @rule task: ->
    @val = {
      name_label: -> @genval.name_label

      name_description: -> @genval.name_description

      progress: -> +@genval.progress

      result: -> @genval.result

      $host: -> @genval.resident_on
      $container: -> @val.$host # Deprecated

      created: -> @genval.created

      finished: -> @genval.finished

      current_operations: -> @genval.current_operations

      status: -> @genval.status
    }
