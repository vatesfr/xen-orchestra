$_ = require 'underscore'

#=====================================================================

$isVMRunning = ->
  switch @val.power_state
    when 'Paused', 'Running'
      true
    else
      false

$isHostRunning = ->
  @val.power_state is 'Running'

$isTaskLive = ->
  @val.status is 'pending' or @val.status is 'cancelling'

$retrieveTags = -> [] # TODO

#=====================================================================

module.exports = ->

  {
    $set
    $sum
    $val
  } = @helpers

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
      @key = -> @genkey
      @val.UUID = -> @genval.uuid
      @val.XAPIRef = -> @genval.$ref
      @val.poolRef = -> @genval.$pool

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
    }

  @rule pool: ->
    @val = {
      name_label: -> @genval.name_label

      name_description: -> @genval.name_description

      tags: -> $retrieveTags @key

      SRs: $set {
        rule: 'SR'
        bind: -> @genval.$container
      }

      HA_enabled: -> @genval.ha_enabled

      hosts: $set {
        rule: 'host'
        bind: -> @genval.$pool
      }

      master: -> @genval.master

      VMs: $set {
        rule: 'VM'
        bind: -> @genval.$container
      }

      $running_hosts: $set {
        rule: 'host'
        bind: -> @genval.$pool
        if: $isHostRunning
      }

      $running_VMs: $set {
        rule: 'VM'
        bind: -> @genval.$pool
        if: $isVMRunning
      }

      $VMs: $set {
        rule: 'VM'
        bind: -> @genval.$pool
      }
    }

  @rule host: ->
    @val = {
      name_label: -> @genval.name_label

      name_description: -> @genval.name_description

      tags: -> $retrieveTags @key

      address: -> @genval.address

      controller: $val {
        rule: 'VM-controller'
        bind: -> @genval.$container
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

      # $PIFs: $set {
      #   key: -> @genval.PIFs # FIXME
      # }

      $messages: $set {
        rule: 'message'
        bind: -> @genval.object
      }

      $tasks: $set {
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

  @rule VM: ->
    @val = {
      name_label: -> @genval.name_label

      name_description: -> @genval.name_description

      tags: -> $retrieveTags @key

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
        # size: $val {
        #   key: -> @genval.guest_metrics # FIXME
        #   val: -> +@val.memory_actual
        #   default: +@genval.memory_dynamic_min
        # }
      }

      $messages: $set {
        rule: 'message'
        bind: -> @genval.object
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
      $container: -> @genval.resident_on

      snapshots: -> @genval.snapshots

      # TODO: Replace with a timestamp.
      snapshot_time: -> @genval.snapshot_time

      $VBDs: -> @genval.VBDs

      $VIFs: -> @genval.VIFs
    }
