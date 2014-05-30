{
  isArray: $isArray
} = require 'underscore'

{
  $each
} = require '../utils'

{
  $wait
} = require '../fibers-utils'

$js2xml = do ->
  {Builder} = require 'xml2js'
  builder = new Builder {
    xmldec: {
      # Do not include an XML header.
      #
      # This is not how this setting should be set but due to the
      # implementation of both xml2js and xmlbuilder-js it works.
      #
      # TODO: Find a better alternative.
      headless: true
    }
  }
  builder.buildObject.bind builder

$isVMRunning = do ->
  runningStates = {
    'Paused': true
    'Running': true
  }

  (VM) -> !!runningStates[VM.power_state]

#=====================================================================

# FIXME: Make the method as atomic as possible.
exports.create = ({
  installation
  name_label
  template
  VDIs
  VIFs
}) ->
  # Gets the template.
  template = @getObject template
  @throw 'NO_SUCH_OBJECT' unless template


  # Gets the corresponding connection.
  xapi = @getXAPI template

  # Clones the VM from the template.
  ref = $wait xapi.call 'VM.clone', template.ref, name_label

  # TODO: if there is an error from now, removes this VM.

  # TODO: remove existing VIFs.
  # Creates associated virtual interfaces.
  $each VIFs, (VIF) =>
    network = @getObject VIF.network

    $wait xapi.call 'VIF.create', {
      # FIXME: device n may already exists, we have to find the first
      # free device number.

      device: '0'
      MAC: VIF.MAC ? ''
      MTU: '1500'
      network: network.ref
      other_config: {}
      qos_algorithm_params: {}
      qos_algorithm_type: ''
      VM: ref
    }

  # TODO: ? $wait xapi.call 'VM.set_PV_args', ref, 'noninteractive'

  # Updates the number of existing vCPUs.
  if CPUs?
    $wait xapi.call 'VM.set_VCPUs_at_startup', ref, CPUs

  # TODO: remove existing VDIs (o make sure we have only those we
  # asked.
  #
  # Problem: how to know which VMs to clones for instance.
  if VDIs?
    # Transform the VDIs specs to conform to XAPI.
    $each VDIs, (VDI, key) ->
      VDI.bootable = if VDI.bootable then 'true' else 'false'
      VDI.size = "#{VDI.size}"
      VDI.sr = VDI.SR
      delete VDI.SR

      # Preparation for the XML generation.
      VDIs[key] = { $: VDI }

    # Converts the provision disks spec to XML.
    VDIs = $js2xml {
      provision: {
        disk: VDIs
      }
    }

    # Replace the existing entry in the VM object.
    try $wait xapi.call 'VM.remove_from_other_config', ref, 'disks'
    $wait xapi.call 'VM.add_to_other_config', ref, 'disks', VDIs

  try $wait xapi.call(
    'VM.remove_from_other_config'
    ref
    'install-repository'
  )
  if installation
    switch installation.method
      when 'cdrom'
        $wait xapi.call(
          'VM.add_to_other_config', ref
          'install-repository', 'cdrom'
        )
      when 'ftp', 'http', 'nfs'
        $wait xapi.call(
          'VM.add_to_other_config', ref
          'install-repository', installation.repository
        )
      else
        @throw(
          'INVALID_PARAMS'
          "Unsupported installation method #{installation.method}"
        )

    # Creates the VDIs and executes the initial steps of the
    # installation.
    $wait xapi.call 'VM.provision', ref

    # Gets the VM record.
    VM = $wait xapi.call 'VM.get_record', ref

    if installation.method is 'cdrom'
      # Gets the VDI containing the ISO to mount.
      try
        VDIref = (@getObject installation.repository).ref
      catch
        @throw 'NO_SUCH_OBJECT', 'installation.repository'

      # Finds the VBD associated to the newly created VM which is a
      # CD.
      CD_drive = null
      $each VM.VBDs, (ref, _1, _2, done) ->
        VBD = $wait xapi.call 'VBD.get_record', ref
        # TODO: Checks it has been correctly retrieved.
        if VBD.type is 'CD'
          CD_drive = VBD.ref
          done

      # No CD drives have been found, creates one.
      unless CD_drive
        # See: https://github.com/xenserver/xenadmin/blob/da00b13bb94603b369b873b0a555d44f15fa0ca5/XenModel/Actions/VM/CreateVMAction.cs#L370
        CD_drive = $wait xapi.call 'VBD.create', {
          bootable: true
          device: ''
          empty: true
          mode: 'RO'
          other_config: {}
          qos_algorithm_params: {}
          qos_algorithm_type: ''
          type: 'CD'
          unpluggable: true
          userdevice: ($wait xapi.call 'VM.get_allowed_VBD_devices', ref)[0]
          VDI: 'OpaqueRef:NULL'
          VM: ref
        }

      # If the CD drive as not been found, throws.
      @throw 'NO_SUCH_OBJECT' unless CD_drive

      # Mounts the VDI into the VBD.
      $wait xapi.call 'VBD.insert', CD_drive, VDIref
  else
    $wait xapi.call 'VM.provision', ref
    VM = $wait xapi.call 'VM.get_record', ref

  # The VM should be properly created.
  return VM.uuid
exports.create.permission = 'admin'
exports.create.params = {
  installation: {
    type: 'object'
    optional: true
    properties: {
      method: { type: 'string' }
      repository: { type: 'string' }
    }
  }

  # Name of the new VM.
  name_label: { type: 'string' }

  # TODO: add the install repository!
  # VBD.insert/eject
  # Also for the console!

  # UUID of the template the VM will be created from.
  template: { type: 'string' }

  # Virtual interfaces to create for the new VM.
  VIFs: {
    type: 'array'
    items: {
      type: 'object'
      properties: {
        # UUID of the network to create the interface in.
        network: { type: 'string' }

        MAC: {
          optional: true # Auto-generated per default.
          type: 'string'
        }
      }
    }
  }

  # Virtual disks to create for the new VM.
  VDIs: {
    optional: true # If not defined, use the template parameters.
    type: 'array'
    items: {
      type: 'object'
      properties: {
        bootable: { type: 'boolean' }
        device: { type: 'string' }
        size: { type: 'integer' }
        SR: { type: 'string' }
        type: { type: 'string' }
      }
    }
  }
}

exports.delete = ({id, delete_disks: deleteDisks}) ->
  try
    VM = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  if $isVMRunning VM
    @throw 'INVALID_PARAMS', 'The VM can only be deleted when halted'

  xapi = @getXAPI VM

  if deleteDisks
    $each VM.$VBDs, (ref) =>
      try
        VBD = @getObject ref
      catch e
        return

      return if VBD.read_only or not VBD.VDI?

      $wait xapi.call 'VDI.destroy', VBD.VDI

  $wait xapi.call 'VM.destroy', VM.ref

  return true
exports.delete.permission = 'admin'
exports.delete.params = {
  id: { type: 'string' }

  delete_disks: {
    optional: true
    type: 'boolean'
  }
}

exports.ejectCd = ({id}) ->
  try
    VM = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM

  # Finds the CD drive.
  cdDriveRef = null
  $each (@getObjects VM.$VBDs), (VBD, _1, _2, done) ->
    if VBD.is_cd_drive
      cdDriveRef = VBD.ref
      done

  if cdDriveRef
    $wait xapi.call 'VBD.eject', cdDriveRef
    $wait xapi.call 'VBD.destroy', cdDriveRef

  return true
exports.ejectCd.permission = 'admin'
exports.ejectCd.params = {
  id: { type: 'string' }
}

exports.insertCd = ({id, cd_id, force}) ->
  try
    VM = @getObject id
    VDI = @getObject cd_id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM

  # Finds the CD drive.
  cdDrive = null
  $each (@getObjects VM.$VBDs), (VBD, _1, _2, done) ->
    if VBD.is_cd_drive
      cdDrive = VBD
      done

  if cdDrive
    cdDriveRef = cdDrive.ref

    if cdDrive.VDI
      @throw 'INVALID_PARAMS' unless force
      $wait xapi.call 'VBD.eject', cdDriveRef
  else
    cdDriveRef = $wait xapi.call 'VBD.create', {
      bootable: true
      device: ''
      empty: true
      mode: 'RO'
      other_config: {}
      qos_algorithm_params: {}
      qos_algorithm_type: ''
      type: 'CD'
      unpluggable: true
      userdevice: ($wait xapi.call 'VM.get_allowed_VBD_devices', VM.ref)[0]
      VDI: 'OpaqueRef:NULL'
      VM: VM.ref
    }

  $wait xapi.call 'VBD.insert', cdDriveRef, VDI.ref

  return true
exports.insertCd.permission = 'admin'
exports.insertCd.params = {
  id: { type: 'string' }
  cd_id: { type: 'string' }
  force: { type: 'boolean' }
}

exports.migrate = ({id, host_id}) ->
  try
    VM = @getObject id
    host = @getObject host_id
  catch
    @throw 'NO_SUCH_OBJECT'

  unless $isVMRunning VM
    @throw 'INVALID_PARAMS', 'The VM can only be migrated when running'

  xapi = @getXAPI VM

  $wait xapi.call 'VM.pool_migrate', VM.ref, host.ref, {}

  return true
exports.migrate.permission = 'admin'
exports.migrate.params = {
  # Identifier of the VM to migrate.
  id: { type: 'string' }

  # Identifier of the host to migrate to.
  host_id: { type: 'string' }
}

exports.set = (params) ->
  try
    VM = @getObject params.id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM

  {ref} = VM

  # Memory.
  if 'memory' of params
    {memory} = params

    if memory < VM.memory.static[0]
      @throw(
        'INVALID_PARAMS'
        "cannot set memory below the static minimum (#{VM.memory.static[0]})"
      )

    if ($isVMRunning VM) and memory > VM.memory.static[1]
      @throw(
        'INVALID_PARAMS'
        "cannot set memory above the static maximum (#{VM.memory.static[1]}) "+
          "for a running VM"
      )

    if memory < VM.memory.dynamic[0]
      $wait xapi.call 'VM.set_memory_dynamic_min', ref, "#{memory}"
    else if memory > VM.memory.static[1]
      $wait xapi.call 'VM.set_memory_static_max', ref, "#{memory}"
    $wait xapi.call 'VM.set_memory_dynamic_max', ref, "#{memory}"

  # Number of CPUs.
  if 'CPUs' of params
    {CPUs} = params

    if $isVMRunning VM
      if CPUs > VM.CPUs.max
        @throw(
          'INVALID_PARAMS'
          "cannot set CPUs above the static maximum (#{VM.CPUs.max}) "+
            "for a running VM"
        )
      $wait xapi.call 'VM.set_VCPUs_number_live', ref, "#{CPUs}"
    else
      if CPUs > VM.CPUs.max
        $wait xapi.call 'VM.set_VCPUs_max', ref, "#{CPUs}"
      $wait xapi.call 'VM.set_VCPUs_at_startup', ref, "#{CPUs}"

  # Other fields.
  for param, fields of {
    'name_label'
    'name_description'
  }
    continue unless param of params

    for field in (if $isArray fields then fields else [fields])
      $wait xapi.call "VM.set_#{field}", ref, "#{params[param]}"

  return true
exports.set.permission = 'admin'
exports.set.params = {
  # Identifier of the VM to update.
  id: { type: 'string' }

  name_label: { type: 'string', optional: true }

  name_description: { type: 'string', optional: true }

  # Number of virtual CPUs to allocate.
  CPUs: { type: 'integer', optional: true }

  # Memory to allocate (in bytes).
  #
  # Note: static_min ≤ dynamic_min ≤ dynamic_max ≤ static_max
  memory: { type: 'integer', optional: true }
}

exports.restart = ({id, force}) ->
  try
    VM = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM

  try
    # Attempts a clean reboot.
    $wait xapi.call 'VM.clean_reboot', VM.ref
  catch error
    return unless error[0] is 'VM_MISSING_PV_DRIVERS'

    @throw 'INVALID_PARAMS' unless force

    $wait xapi.call 'VM.hard_reboot', VM.ref

  return true
exports.restart.permission = 'admin'
exports.restart.params = {
  id: { type: 'string' }
  force: { type: 'boolean' }
}

exports.clone = ({id, name, full_copy}) ->
  try
    VM = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM
  if full_copy
    $wait xapi.call 'VM.copy', VM.ref, name, ''
  else
    $wait xapi.call 'VM.clone', VM.ref, name

  return true
exports.clone.permission = 'admin'
exports.clone.params = {
  id: { type: 'string' }
  name: { type: 'string' }
  full_copy: { type: 'boolean' }
}

# TODO: rename convertToTemplate()
exports.convert = ({id}) ->
  try
    VM = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM
  $wait xapi.call 'VM.set_is_a_template', VM.ref, true

  return true
exports.convert.permission = 'admin'
exports.convert.params = {
  id: { type: 'string' }
}

exports.snapshot = ({id, name}) ->
  try
    VM = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM

  $wait xapi.call 'VM.snapshot', VM.ref, name

  return true
exports.snapshot.permission = 'admin'
exports.snapshot.params = {
  id: { type: 'string' }
  name: { type: 'string' }
}

exports.start = ({id}) ->
  try
    VM = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  $wait (@getXAPI VM).call(
    'VM.start', VM.ref
    false # Start paused?
    false # Skips the pre-boot checks?
  )

  return true
exports.start.permission = 'admin'
exports.start.params = {
  id: { type: 'string' }
}

exports.stop = ({id, force}) ->
  try
    VM = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM

  try
    # Attempts a clean shutdown.
    $wait xapi.call 'VM.clean_shutdown', VM.ref
  catch error
    return unless error[0] is 'VM_MISSING_PV_DRIVERS'

    @throw 'INVALID_PARAMS' unless force

    $wait xapi.call 'VM.hard_shutdown', VM.ref

  return true
exports.stop.permission = 'admin'
exports.stop.params = {
  id: { type: 'string' }
  force: { type: 'boolean' }
}

# revert a snapshot to its parent VM
exports.revert = ({id}) ->
  try
    VM = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM

  # Attempts a revert from this snapshot to its parent VM
  $wait xapi.call 'VM.revert', VM.ref

  return true
exports.revert.permission = 'admin'
exports.revert.params = {
  id: { type: 'string' }
}

# export a VM
exports.export = ({id, compress}) ->
  @throw 'NOT_IMPLEMENTED'
  compress ?= true
  try
    VM = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM

  # get the session ID
  sessionId = xapi.sessionId
  # HTTP object connected to the pool master
  http.put "/export/?session_id=#{sessionId}&ref=#{VM.ref}&use_compression=#{compress}"

  # @TODO: we need to get the file somehow

  return true
exports.export.permission = 'admin'
exports.export.params = {
  id: { type: 'string' }
  compress: { type: 'boolean', optional:true }
}

# import a VM
exports.import = ({id, file}) ->
  @throw 'NOT_IMPLEMENTED'
  try
    VM = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VM

  # get the session ID
  sessionId = xapi.sessionId

  # HTTP object connected to the pool master
  http.put "/import/?session_id=#{sessionId}"

  # @TODO: we need to put the file somehow

  return true
exports.import.permission = 'admin'
exports.import.params = {
  id: { type: 'string' }
  file: { type: 'string' }
}
