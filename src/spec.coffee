$_ = require 'underscore'

#---------------------------------------------------------------------

$xml2js = require 'xml2js'

#---------------------------------------------------------------------

$helpers = require './helpers'

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

$toTimestamp = (date) ->
  # Weird behavior from the XAPI.
  return null if date is '1969-12-31T23:00:00.000Z'

  if date?
    Math.round (Date.parse date) / 1000
  else
    null

#=====================================================================

module.exports = ->

  # Binds the helpers to the collection.
  {
    $set
    $sum
    $val
  } = do =>
    helpers = {}
    helpers[name] = fn.bind this for name, fn of $helpers
    helpers

  collection = this
  # do (emit = collection.emit) ->
  #   collection.emit = (event, items) ->
  #     console.log event
  #     emit.call collection, event, items

  $link = (keyFn, valFn = (-> @val), once = false) ->
    valuePerItem = Object.create null
    updating = false

    ->
      {key} = this

      # Returns the value if already defined.
      return valuePerItem[key] if key of valuePerItem

      # Gets the key of the remote object.
      remoteKey = keyFn.call this

      # Special case for `OpaqueRef:NULL`.
      if remoteKey is 'OpaqueRef:NULL'
        return valuePerItem[key] = null

      # Tries to find the remote object in the collection.
      try
        return valuePerItem[key] = valFn.call (collection.getRaw remoteKey)

      # If not found, listens for its apparition.
      eventName = "key=#{remoteKey}"
      listener = (event, item) ->
        # If the events are due to an update of this link or if the item is
        # exiting, just returns.
        return if updating or event isnt 'enter'

        # Register its value.
        valuePerItem[key] = valFn.call item

        if once
          # Removes the now unnecessary listener.
          collection.removeListener eventName, listener

        # Force the object to update.
        try
          updating = true
          collection.touch key
        finally
          updating = false
      collection.on eventName, listener

      # Returns `null` for now.
      valuePerItem[key] = null

  $map = (valFn) ->
    map = Object.create null
    subscribers = Object.create null
    updating = false

    # First, initializes the map with existing items.
    $_.each collection.getRaw(), (item) ->
      val = valFn.call item
      map[val[0]] = val[1] if val

    # Listens to any new item.
    collection.on 'any', (event, items) ->
      # If the events are due to an update of this map or if items are exiting,
      # just returns.
      return if updating or event isnt 'enter'

      # No need to trigger an update if nothing has changed.
      changed = false

      $_.each items, (item) ->
        val = valFn.call item
        if val and map[val[0]] isnt val[1]
          changed = true
          map[val[0]] = val[1]

      if changed
        try
          updating = true
          collection.touch subscribers
        finally
          updating = false

    generator = ->
      subscribers[@key] = true
      map
    generator.unsubscribe = ->
      delete subscribers[@key]

    generator

  # Shared watchers.
  UUIDsToKeys = $map ->
    {UUID} = @val
    return false unless UUID
    [UUID, "#{@key}"]
  messages = $set {
    rule: 'message'
    bind: -> @val.$object or @val.poolRef
  }

  # Classes in XAPI are not always delivered with the same case,
  # therefore a map is needed to make sure they always map to the same
  # rule.
  rulesMap = {}

  # Defines which rule should be used for this item.
  #
  # Note: If the rule does not exists, a temporary item is created. FIXME
  @dispatch = ->
    {$type: type} = @genval

    # Normalizes the type.
    type = rulesMap[type.toLowerCase()] ? type

    # Subtypes handling for VMs.
    if type is 'VM'
      return 'VM-controller' if @genval.is_control_domain
      return 'VM-snapshot' if @genval.is_a_snapshot
      return 'VM-template' if @genval.is_a_template

    type

  # Missing rules should be created.
  @missingRule = @rule

  # Rule conflicts are possible (e.g. VM-template to VM).
  @ruleConflict = ( -> )

  # Used to apply common definition to rules.
  @hook afterRule: ->
    # Registers this rule in the map.
    rulesMap[@name.toLowerCase()] = @name

    # TODO: explain.
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

        @val.tags = $retrieveTags

  # Helper to create multiple rules with the same definition.
  rules = (rules, definition) =>
    @rule rule, definition for rule in rules

  # An item is equivalent to a rule but one and only one instance of
  # this rule is created without any generator.
  @item xo: ->
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
      $memory: {
        usage: $sum {
          rule: 'host'
          if: -> @val?.memory?.usage?
          val: -> @val.memory.usage
        }
        size: $sum {
          rule: 'host'
          if: -> @val?.memory?.size?
          val: -> @val.memory.size
        }
      }

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

      default_SR: ->
        SR = @genval.default_SR
        if SR is 'OpaqueRef:NULL'
          null
        else
          SR

      HA_enabled: -> @genval.ha_enabled

      hosts: $set {
        rule: 'host'
        bind: -> @genval.$poolRef
      }

      master: -> @genval.master

      networks: $set {
        rule: 'network'
        bind: -> @genval.$poolRef
      }

      templates: $set {
        rule: 'VM-template'
        bind: -> @val.$container
      }

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

      # FIXME: Should be remove ASAP!
      $sessionId : -> @genval.$sessionId ? @val.$sessionId
    }

  @rule host: ->
    # Private properties used to helps construction.
    @data = {
      metrics: $link -> @genval.metrics
    }

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

      memory: ->
        {metrics} = @data
        if metrics
          {
            usage: +metrics.memory_total - metrics.memory_free
            size: +metrics.memory_total
          }
        else
          {
            usage: 0
            size: 0
          }

      # TODO
      power_state: 'Running'

      # Local SRs are handled directly in `SR.$container`.
      SRs: $set {
        rule: 'SR'
        bind: -> @val.$container
      }

      # What are local templates?
      templates: $set {
        rule: 'VM-template'
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
    @data = {
      metrics: $link -> @genval.metrics
      guest_metrics: $link -> @genval.guest_metrics
    }

    @val = {
      name_label: -> @genval.name_label

      name_description: -> @genval.name_description

      addresses: ->
        {guest_metrics} = @data
        if guest_metrics
          guest_metrics.networks
        else
          null

      consoles: $set {
        rule: 'console'
        bind: -> @genval.VM
        val: -> @val
      }

      current_operations: -> @genval.current_operations

      os_version: ->
        {guest_metrics} = @data
        if guest_metrics
          guest_metrics.os_version
        else
          null

      memory: ->
        {metrics, guest_metrics} = @data

        memory = {
          dynamic: [
            +@genval.memory_dynamic_min
            +@genval.memory_dynamic_max
          ]
          static: [
            +@genval.memory_static_min
            +@genval.memory_static_max
          ]
        }

        memory.size = if not $isVMRunning.call this
          +@genval.memory_dynamic_max
        else if (gmmemory = guest_metrics?.memory)?.used
          memory.usage = +gmmemory.used
          +gmmemory.total
        else if metrics
          +metrics.memory_actual
        else
          +@genval.memory_dynamic_max

        memory

      power_state: -> @genval.power_state

      PV_drivers: ->
        {guest_metrics} = @data
        if guest_metrics
          guest_metrics.PV_drivers_up_to_date
        else
          false

      CPUs: ->
        {metrics} = @data

        CPUs = {
          max: +@genval.VCPUs_max
          number: if ($isVMRunning.call this) and metrics
            +metrics.VCPUs_number
          else
            +@genval.VCPUs_at_startup
        }

      $CPU_usage: null #TODO

      # FIXME: $container should contains the pool UUID when the VM is
      # not on a host.
      $container: ->
        if $isVMRunning.call this
          @genval.resident_on
        else
          # TODO: Handle local VMs. (`get_possible_hosts()`).
          @genval.$poolRef

      snapshots: -> @genval.snapshots

      snapshot_time: -> $toTimestamp @genval.snapshot_time

      $VBDs: -> @genval.VBDs

      VIFs: -> @genval.VIFs
    }
  @rule VM: VMdef
  @rule 'VM-controller': VMdef
  @rule 'VM-snapshot': VMdef

  # VM-template starts with the same definition but extends it.
  @rule 'VM-template': ->
    VMdef.call this

    @val.CPUs.number = -> +@genval.VCPUs_at_startup

    @val.template_info = {
      arch: -> @genval.other_config?['install-arch']
      disks: ->
        #console.log @genval.other_config
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
    @data = {
      # Note: not dynamic.
      host: $link(
        -> @genval.PBDs[0] ? 'OpaqueRef:NULL'
        -> @val.host
      )
    }

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
          @data.host

      $PBDs: -> @genval.PBDs

      VDIs: -> @genval.VDIs
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

      $host: -> @genval.host

      MAC: -> @genval.MAC

      # TODO: Find a more meaningful name.
      management: -> @genval.management

      mode: -> @genval.ip_configuration_mode

      MTU: -> +@genval.MTU

      netmask: -> @genval.netmask

      $network: -> @genval.network

      vlan: -> @genval.VLAN

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

      snapshots: -> @genval.snapshots

      # TODO: Does the name fit?
      #snapshot_time: -> @genval.snapshot_time

      $SR: -> @genval.SR

      $VBDs: -> @genval.VBDs

      $VBD: -> # Deprecated
        {VBDs} = @genval

        if VBDs.length is 0 then null else VBDs[0]
    }

  @rule VBD: ->
    @val = {
      attached: -> @genval.currently_attached

      bootable: -> @genval.bootable

      read_only: -> @genval.mode is 'RO'

      is_cd_drive: -> @genval.type is 'CD'

      # null if empty.
      #
      # TODO: Is it really equivalent?
      VDI: ->
        VDI = @genval.VDI
        if VDI is 'OpaqueRef:NULL'
          null
        else
          VDI

      VM: -> @genval.VM
    }

  @rule VIF: ->
    @val = {
      attached: -> @genval.currently_attached

      # TODO: Should it be cast to a number?
      device: -> @genval.device

      MAC: -> @genval.MAC

      MTU: -> +@genval.MTU

      $network: -> @genval.network

      $VM: -> @genval.VM
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
      time: -> $toTimestamp @genval.timestamp

      $object: ->
        # If the key of the concerned object has already be resolved
        # returns the known value.
        return @val.$object if @val.$object?

        # Tries to resolve the key of the concerned object.
        object = (UUIDsToKeys.call this)[@genval.obj_uuid]

        # If resolved, unregister from the watcher.
        UUIDsToKeys.unsubscribe.call this if object?

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

      created: -> @genval.created

      finished: -> @genval.finished

      current_operations: -> @genval.current_operations

      status: -> @genval.status
    }
