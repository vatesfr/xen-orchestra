# FIXME: function executed each time vs dynamic fields.

$set = ({
  # Identifier of the “remote” object watched.
  #
  # If it is a function, it is evaluated in the scope of the “current”
  # object.
  #
  # TODO: Can also be an array.
  #
  # Default: undefined
  key

  # Rule to watch (everything if null/undefined).
  #
  # Default: undefined
  rule

  # Value to add to the set.
  #
  # If it is a function, it is evaluated in the scope of the “remote”
  # object.
  #
  # Default: -> @key
  val

  # Predicates which must be fulfilled for the “remote” object to be
  # used.
  #
  # Default: true
  if: cond

  # Identifier of the object to update (usually the current one).
  #
  # Usually this entry is a function which is evaluated in the scope
  # of the “remote” object.
  #
  # TODO: Can also be an array.
  #
  # Default: undefined
  bind
}) ->
  val ?= -> @key
  # TODO

$sum = ({rule, val, if: cond, bind}) ->
  # TODO

$map = ({key, rule, val, if: cond, bind}) ->
  # TODO

isVMRunning = ->
  switch @power_state
    when 'Paused', 'Running'
      true
    else
      false

isHostRunning = ->
  @power_state is 'Running'

module.export = ->

  {$set, $sum} = @helpers

  # Defines which rule should be used for this item.
  #
  # Note: If the rule does not exists, a temporary item is created. FIXME
  @dispatch -> @genval.$type

  # Register a hook to run before processing an item for any rule.
  @hook beforeUpdate: ->
    # No need to worry about missing property, if the @key is
    # undefined the MappedCollection will throw (TODO).
    @key = @val.$ref

  # Register a hook to run before saving an item for any rule.
  @hook beforeSave: ->
    throw new Error 'the value should be an object' unless $_.isObject @val

    # Injects the name of the rule to `item.val.type`.
    @val.type = @rule

    # Only for items which have a generator.
    if @gen?
      # Injects the UUID.
      @val.UUID = @genval.uuid if @genval.uuid?

      # Injects the XAPI reference.
      @val.XAPIRef = @genval.$ref

      # Injects the XAPI reference of the current pool.
      @val.poolRef = @genval.$pool

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
        val: -> @val.CPUs.length
      }

      $running_VMs: $set {
        rule: 'VM'
        if: isVMRunning
      }

      $vCPUs: $sum {
        rule: 'VM'
        val: -> @val.CPUs.length
        if: isVMRunning
      }

      $memory: $sum {
        rule: 'host'
        val: -> @val.memory
        init: {
          usage: 0
          size: 0
        }
      }
    }

  @rule pool: ->
    @val = {
      name_label: @genval.name_label

      name_description: @genval.name_description

      tags: retrieveTags @key

      SRs: $set {
        rule: 'SR'
        bind: -> @val.$container
      }

      HA_enabled: @genval.ha_enabled

      hosts: $set {
        rule: 'host'
        bind: -> @genval.$pool
      }

      master: @val.master

      VMs: $set {
        rule: 'VM'
        bind: -> @val.$container
      }

      $running_hosts: $set {
        rule: 'host'
        bind: -> @genval.$pool
        if: isHostRunning
      }

      $running_VMs: $set {
        rule: 'VM'
        bind: -> @genval.$pool
        if: isVMRunning
      }

      $VMs: $set {
        rule: 'VM'
        bind: -> @genval.$pool
      }
    }

  @rule host: ->
    @val = {
      name_label: @genval.name_label

      name_description: @genval.name_description

      tags: retrieveTags @key

      address: @genval.address

      controller: $import {
        rule: 'VM-controller'
        bind: -> @genval.$container
      }

      CPUs: @genval.cpu_info

      enabled: @genval.enabled

      hostname: @genval.hostname

      iSCSI_name: @genval.other_config?.iscsi_iqn ? null

      memory: $sum {
        key: -> @genval.metrics
      }

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

      $PBDs: @genval.PBDs

      $PIFs: $set {
        key: -> @genval.PIFs
      }

      $messages: $set {
        rule: 'message'
        bind: -> @genval.object
      }

      $tasks: $set {
        rule: 'task'
        bind: -> @val.$container
        if: -> @val.status is 'pending' or @val.status is 'cancelling'
      }

      $running_VMs: $set {
        rule: 'VM'
        bind: -> @val.$container
        if: isVMRunning
      }

      $vCPUs: $sum {
        rule: 'VM'
        bind: -> @val.$container
        if: isVMRunning
        value: -> @val.CPUs.number
      }
    }

  @rule VM: ->
    @val = {
      name_label: @genval.name_label

      name_description: @genval.name_description

      tags: retrieveTags @key

      address: {
        ip: $import {
          key: -> @genval.guest_metrics
          val: -> @val.networks
          default: null
        }
      }

      consoles: $set {
        key: -> @genval.consoles
      }

      # TODO: parses XML and converts it to an object.
      # @genval.other_config?.disks
      disks: [
        {
          device: '0'
          name_description: 'Created with Xen-Orchestra'
          size: 8589934592
          SR: null
        }
      ]

      memory: {
        usage: null
        size: $import {
          key: -> @genval.guest_metrics
          val: -> +@val.memory_actual
          default: +@genval.memory_dynamic_min
        }
      }

      $messages: $set {
        rule: 'message'
        bind: -> @genval.object
      }

      power_state: @genval.power_state

      CPUs: {
        number: $import {
          key: -> @genval.metrics
          val: -> +@genval.VCPUs_number

          # FIXME: must be evaluated in the context of the current object.
          if: -> @gen
        }
      }
    }
