$debug = (require 'debug') 'xo:api:vm'
$findWhere = require 'lodash.find'
$result = require 'lodash.result'
$forEach = require 'lodash.foreach'
$isArray = require 'lodash.isarray'
$findIndex = require 'lodash.findindex'
$request = require('bluebird').promisify(require('request'))

{$coroutine, $wait} = require '../fibers-utils'
{formatXml: $js2xml} = require '../utils'
{parseXml} = require '../utils'

$isVMRunning = do ->
  runningStates = {
    'Paused': true
    'Running': true
  }

  (VM) -> !!runningStates[VM.power_state]

#=====================================================================

# TODO: Implement ACLs
# FIXME: Make the method as atomic as possible.
create = $coroutine ({
  installation
  name_label
  template
  VDIs
  VIFs
}) ->
  # Gets the corresponding connection.
  xapi = @getXAPI template

  # Clones the VM from the template.
  ref = $wait xapi.call 'VM.clone', template.ref, name_label

  # TODO: if there is an error from now, removes this VM.

  # TODO: remove existing VIFs.
  # Creates associated virtual interfaces.
  #
  # FIXME: device n may already exists, we have to find the first
  # free device number.
  deviceId = 0
  $forEach VIFs, (VIF) =>
    network = @getObject VIF.network, 'network'

    $wait xapi.call 'VIF.create', {

      device: String(deviceId++)
      MAC: VIF.MAC ? ''
      MTU: '1500'
      network: network.ref
      other_config: {}
      qos_algorithm_params: {}
      qos_algorithm_type: ''
      VM: ref
    }

    return

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
    $forEach VDIs, (VDI, key) ->
      VDI.bootable = if VDI.bootable then 'true' else 'false'
      VDI.size = "#{VDI.size}"
      VDI.sr = VDI.SR
      delete VDI.SR

      # Preparation for the XML generation.
      VDIs[key] = { $: VDI }

      return

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
        VDIref = (@getObject installation.repository, 'VDI').ref
      catch
        @throw 'NO_SUCH_OBJECT', 'installation.repository'

      # Finds the VBD associated to the newly created VM which is a
      # CD.
      CD_drive = null
      $forEach VM.VBDs, (ref) ->
        VBD = $wait xapi.call 'VBD.get_record', ref
        # TODO: Checks it has been correctly retrieved.
        if VBD.type is 'CD'
          CD_drive = VBD.ref
          return false
        return

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

create.permission = 'admin'

create.params = {
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

create.resolve = {
  template: ['template', 'VM-template'],
}

exports.create = create

#---------------------------------------------------------------------

delete_ = $coroutine ({vm, delete_disks: deleteDisks}) ->
  if $isVMRunning vm
    @throw 'INVALID_PARAMS', 'The VM can only be deleted when halted'

  xapi = @getXAPI vm

  if deleteDisks
    $forEach vm.$VBDs, (ref) =>
      try
        VBD = @getObject ref, 'VBD'
      catch e
        return

      return if VBD.read_only or not VBD.VDI?

      $wait xapi.call 'VDI.destroy', VBD.VDI

      return

  $wait xapi.call 'VM.destroy', vm.ref

  return true

delete_.params = {
  id: { type: 'string' }

  delete_disks: {
    optional: true
    type: 'boolean'
  }
}
delete_.permission = 'admin'
delete_.resolve = {
  vm: ['id', ['VM', 'VM-snapshot']]
}

exports.delete = delete_

#---------------------------------------------------------------------

ejectCd = $coroutine ({vm}) ->
  xapi = @getXAPI vm

  # Finds the CD drive.
  cdDriveRef = null
  $forEach (@getObjects vm.$VBDs), (VBD) ->
    if VBD.is_cd_drive
      cdDriveRef = VBD.ref
      return false
    return

  if cdDriveRef
    $wait xapi.call 'VBD.eject', cdDriveRef
    $wait xapi.call 'VBD.destroy', cdDriveRef

  return true

ejectCd.params = {
  id: { type: 'string' }
}

ejectCd.resolve = {
  vm: ['id', 'VM']
}
ejectCd.permission = 'admin'
exports.ejectCd = ejectCd

#---------------------------------------------------------------------

insertCd = $coroutine ({vm, vdi, force}) ->
  xapi = @getXAPI vm

  # Finds the CD drive.
  cdDrive = null
  $forEach (@getObjects vm.$VBDs), (VBD) ->
    if VBD.is_cd_drive
      cdDrive = VBD
      return false
    return

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
      userdevice: ($wait xapi.call 'VM.get_allowed_VBD_devices', vm.ref)[0]
      VDI: 'OpaqueRef:NULL'
      VM: vm.ref
    }

  $wait xapi.call 'VBD.insert', cdDriveRef, vdi.ref

  return true

insertCd.params = {
  id: { type: 'string' }
  cd_id: { type: 'string' }
  force: { type: 'boolean' }
}

insertCd.resolve = {
  vm: ['id', 'VM'],
  vdi: ['cd_id', 'VDI'],
}
insertCd.permission = 'admin'
exports.insertCd = insertCd

#---------------------------------------------------------------------

migrate = $coroutine ({vm, host}) ->
  unless $isVMRunning vm
    @throw 'INVALID_PARAMS', 'The VM can only be migrated when running'

  xapi = @getXAPI vm

  $wait xapi.call 'VM.pool_migrate', vm.ref, host.ref, {'force': 'true'}

  return true

migrate.params = {
  # Identifier of the VM to migrate.
  id: { type: 'string' }

  # Identifier of the host to migrate to.
  host_id: { type: 'string' }
}

migrate.resolve = {
  vm: ['id', 'VM']
  host: ['host_id', 'host']
}

exports.migrate = migrate

#---------------------------------------------------------------------

migratePool = $coroutine ({
  vm: VM,
  host
  sr: SR
  network
  migrationNetwork
}) ->
  try
    # TODO: map multiple VDI and VIF

    # Optional parameters
    # if no network given, try to use the management network
    unless network
      PIF = $findWhere (@getObjects host.$PIFs), management: true
      network = @getObject PIF.$network, 'network'

    # if no migrationNetwork, use the network
    migrationNetwork ?= network

    # if no sr is given, try to find the default Pool SR
    unless SR
      pool = @getObject host.poolRef, 'pool'
      target_sr_id = pool.default_SR
      SR = @getObject target_sr_id, 'SR'

  catch
    @throw 'NO_SUCH_OBJECT'

  unless $isVMRunning VM
    @throw 'INVALID_PARAMS', 'The VM can only be migrated when running'

  vdiMap = {}
  for vbdId in VM.$VBDs
    VBD = @getObject vbdId, 'VBD'
    continue if VBD.is_cd_drive
    VDI = @getObject VBD.VDI, 'VDI'
    vdiMap[VDI.ref] = SR.ref

  vifMap = {}
  for vifId in VM.VIFs
    VIF = @getObject vifId, 'VIF'
    vifMap[VIF.ref] = network.ref

  token = $wait (@getXAPI host).call(
    'host.migrate_receive'
    host.ref
    migrationNetwork.ref
    {} # Other parameters
  )

  $wait (@getXAPI VM).call(
    'VM.migrate_send'
    VM.ref
    token
    true # Live migration
    vdiMap
    vifMap
    {'force': 'true'} # Force migration even if CPUs are different
  )

  return true

migratePool.params = {

  # Identifier of the VM to migrate.
  id: { type: 'string' }

  # Identifier of the host to migrate to.
  target_host_id: { type: 'string' }

  # Identifier of the target SR
  target_sr_id: { type: 'string', optional: true }

  # Identifier of the target Network
  target_network_id: { type: 'string', optional: true }

  # Identifier of the Network use for the migration
  migration_network_id: { type: 'string', optional: true }
}

migratePool.resolve = {
  vm: ['id', 'VM'],
  host: ['target_host_id', 'host'],
  sr: ['target_sr_id', 'SR'],
  network: ['target_network_id', 'network'],
  migrationNetwork: ['migration_network_id', 'network'],
}

# TODO: camel case.
exports.migrate_pool = migratePool

#---------------------------------------------------------------------

# FIXME: human readable strings should be handled.
set = $coroutine (params) ->
  {VM} = params
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

  # HA policy
  # TODO: also handle "best-effort" case
  if 'high_availability' of params
    {high_availability} = params

    if high_availability
      $wait xapi.call 'VM.set_ha_restart_priority', ref, "restart"
    else
      $wait xapi.call 'VM.set_ha_restart_priority', ref, ""

  if 'auto_poweron' of params
    {auto_poweron} = params

    if auto_poweron
      $wait xapi.call 'VM.add_to_other_config', ref, 'auto_poweron', 'true'
    else
      $wait xapi.call 'VM.remove_from_other_config', ref, 'auto_poweron'

  # Other fields.
  for param, fields of {
    'name_label'
    'name_description'
  }
    continue unless param of params

    for field in (if $isArray fields then fields else [fields])
      $wait xapi.call "VM.set_#{field}", ref, "#{params[param]}"

  return true

set.params = {
  # Identifier of the VM to update.
  id: { type: 'string' }

  name_label: { type: 'string', optional: true }

  name_description: { type: 'string', optional: true }

  # TODO: provides better filtering of values for HA possible values: "best-
  # effort" meaning "try to restart this VM if possible but don't consider the
  # Pool to be overcommitted if this is not possible"; "restart" meaning "this
  # VM should be restarted"; "" meaning "do not try to restart this VM"
  high_availability: { type: 'boolean', optional: true }

  # Number of virtual CPUs to allocate.
  CPUs: { type: 'integer', optional: true }

  # Memory to allocate (in bytes).
  #
  # Note: static_min ≤ dynamic_min ≤ dynamic_max ≤ static_max
  memory: { type: 'integer', optional: true }
}
set.permission = 'admin'
set.resolve = {
  VM: ['id', ['VM', 'VM-snapshot']]
}

exports.set = set

#---------------------------------------------------------------------

restart = $coroutine ({vm, force}) ->
  xapi = @getXAPI(vm)

  if force
    $wait xapi.call 'VM.hard_reboot', vm.ref
  else
    $wait xapi.call 'VM.clean_reboot', vm.ref

  return true

restart.params = {
  id: { type: 'string' }
  force: { type: 'boolean' }
}

restart.resolve = {
  vm: ['id', 'VM']
}

exports.restart = restart

#---------------------------------------------------------------------

clone = $coroutine ({vm, name, full_copy}) ->
  xapi = @getXAPI vm
  if full_copy
    $wait xapi.call 'VM.copy', vm.ref, name, ''
  else
    $wait xapi.call 'VM.clone', vm.ref, name

  return true

# Having permission on a VM is not enough to be able to clone it.
clone.permission = 'admin'

clone.params = {
  id: { type: 'string' }
  name: { type: 'string' }
  full_copy: { type: 'boolean' }
}

clone.resolve = {
  # TODO: is it necessary for snapshots?
  vm: ['id', 'VM']
}

exports.clone = clone

#---------------------------------------------------------------------

# TODO: rename convertToTemplate()
convert = $coroutine ({vm}) ->
  $wait @getXAPI(vm).call 'VM.set_is_a_template', vm.ref, true

  return true

convert.params = {
  id: { type: 'string' }
}

convert.resolve = {
  vm: ['id', ['VM', 'VM-snapshot']]
}
convert.permission = 'admin'
exports.convert = convert

#---------------------------------------------------------------------

snapshot = $coroutine ({vm, name}) ->
  return $wait @getXAPI(vm).call 'VM.snapshot', vm.ref, name

snapshot.params = {
  id: { type: 'string' }
  name: { type: 'string' }
}

snapshot.resolve = {
  vm: ['id', 'VM']
}
snapshot.permission = 'admin'
exports.snapshot = snapshot

#---------------------------------------------------------------------

start = $coroutine ({vm}) ->
  $wait @getXAPI(vm).call(
    'VM.start', vm.ref
    false # Start paused?
    false # Skips the pre-boot checks?
  )

  return true

start.params = {
  id: { type: 'string' }
}

start.resolve = {
  vm: ['id', 'VM']
}

exports.start = start

#---------------------------------------------------------------------

# TODO: implements timeout.
# - if !force → clean shutdown
# - if force is true → hard shutdown
# - if force is integer → clean shutdown and after force seconds, hard shutdown.
stop = $coroutine ({vm, force}) ->
  xapi = @getXAPI vm

  # Hard shutdown
  if force
    $wait xapi.call 'VM.hard_shutdown', vm.ref
    return true

  # Clean shutdown
  try
    $wait xapi.call 'VM.clean_shutdown', vm.ref
  catch error
    if error.code is 'VM_MISSING_PV_DRIVERS'
      # TODO: Improve reporting: this message is unclear.
      @throw 'INVALID_PARAMS'
    else
      throw error

  return true

stop.params = {
  id: { type: 'string' }
  force: { type: 'boolean', optional: true }
}

stop.resolve = {
  vm: ['id', 'VM']
}

exports.stop = stop

#---------------------------------------------------------------------

suspend = $coroutine ({vm}) ->
  $wait @getXAPI(vm).call 'VM.suspend', vm.ref

  return true

suspend.params = {
  id: { type: 'string' }
}

suspend.resolve = {
  vm: ['id', 'VM']
}
suspend.permission = 'admin'
exports.suspend = suspend

#---------------------------------------------------------------------

resume = $coroutine ({vm, force}) ->
  # FIXME: WTF this is?
  if not force
    force = true

  $wait @getXAPI(vm).call 'VM.resume', vm.ref, false, force

  return true

resume.params = {
  id: { type: 'string' }
  force: { type: 'boolean', optional: true }
}

resume.resolve = {
  vm: ['id', 'VM']
}
resume.permission = 'admin'
exports.resume = resume

#---------------------------------------------------------------------

# revert a snapshot to its parent VM
revert = $coroutine ({snapshot}) ->
  # Attempts a revert from this snapshot to its parent VM
  $wait @getXAPI(snapshot).call 'VM.revert', snapshot.ref

  return true

revert.params = {
  id: { type: 'string' }
}

revert.resolve = {
  snapshot: ['id', 'VM-snapshot']
}
revert.permission = 'admin'
exports.revert = revert

#---------------------------------------------------------------------

export_ = $coroutine ({vm, compress}) ->
  compress ?= true

  xapi = @getXAPI vm

  # if the VM is running, we can't export it directly
  # that's why we export the snapshot
  exportRef = if vm.power_state is 'Running'
    $debug 'VM is running, creating temp snapshot...'
    snapshotRef = $wait xapi.call 'VM.snapshot', vm.ref, vm.name_label
    # convert the template to a VM
    $wait xapi.call 'VM.set_is_a_template', snapshotRef, false

    snapshotRef
  else
    vm.ref

  host = @getObject vm.$container
  do (type = host.type) =>
    if type is 'pool'
      host = @getObject host.master, 'host'
    else unless type is 'host'
      throw new Error "unexpected type: got #{type} instead of host"

  taskRef = $wait xapi.call 'task.create', 'VM export via Xen Orchestra', 'Export VM '+vm.name_label
  @watchTask taskRef
    .then (result) ->
      $debug 'export succeeded'
      return
    .catch (error) ->
      $debug 'export failed: %j', error
      return
    .finally $coroutine =>
      xapi.call 'task.destroy', taskRef

      if snapshotRef?
        $debug 'deleting temp snapshot...'
        $wait exports.delete.call this, id: snapshotRef, delete_disks: true

      return

  url = $wait @registerProxyRequest {
    method: 'get'
    hostname: host.address
    pathname: '/export/'
    query: {
      session_id: xapi.sessionId
      ref: exportRef
      task_id: taskRef
      use_compression: if compress then 'true' else false
    }
  }

  return {
    $getFrom: url
  }

export_.params = {
  vm: { type: 'string' }
  compress: { type: 'boolean', optional: true }
}

export_.resolve = {
  vm: ['vm', ['VM', 'VM-snapshot']],
}
export_.permission = 'admin'
exports.export = export_;

#---------------------------------------------------------------------

# FIXME
# TODO: "sr_id" can be passed in URL to target a specific SR
import_ = $coroutine ({host}) ->

  {sessionId} = @getXAPI(host)

  url = $wait @registerProxyRequest {
    # Receive a POST but send a PUT.
    method: 'put'
    proxyMethod: 'post'

    hostname: host.address
    pathname: '/import/'
    query: {
      session_id: sessionId
    }
  }
  return {
    $sendTo: url
  }

import_.params = {
  host: { type: 'string' }
}

import_.resolve = {
  host: ['host', 'host']
}
import_.permission = 'admin'
exports.import = import_

#---------------------------------------------------------------------

# FIXME: position should be optional and default to last.
#
# FIXME: if position is used, all other disks after this position
# should be shifted.
attachDisk = $coroutine ({vm, vdi, position, mode, bootable}) ->
  xapi = @getXAPI vm

  VBD_ref = $wait xapi.call 'VBD.create', {
    VM: vm.ref
    VDI: vdi.ref
    mode: mode
    type: 'Disk'
    userdevice: position
    bootable: bootable ? false
    empty: false
    other_config: {}
    qos_algorithm_type: ''
    qos_algorithm_params: {}
  }

  $wait xapi.call 'VBD.plug', VBD_ref

  return true

attachDisk.params = {
  bootable: {
    type: 'boolean'
    optional: true
  }
  mode: { type: 'string' }
  position: { type: 'string' }
  vdi: { type: 'string' }
  vm: { type: 'string' }
}

attachDisk.resolve = {
  vm: ['vm', 'VM'],
  vdi: ['vdi', 'VDI'],
}
attachDisk.permission = 'admin'
exports.attachDisk = attachDisk

#---------------------------------------------------------------------

# FIXME: position should be optional and default to last.

createInterface = $coroutine ({vm, network, position, mtu, mac}) ->
  xapi = @getXAPI vm

  VIF_ref = $wait xapi.call 'VIF.create', {
    VM: vm.ref
    network: network.ref
    device: position
    MTU: mtu ? '1500'
    MAC: mac ? ''
    other_config: {}
    qos_algorithm_type: ''
    qos_algorithm_params: {}
  }

  return $wait(xapi.call( 'VIF.get_record', VIF_ref)).uuid


createInterface.params = {
  vm: { type: 'string' }
  network: { type: 'string' }
  position: { type: 'string' }
  mtu: { type: 'string', optional: true }
  mac: { type: 'string', optional: true }
}

createInterface.resolve = {
  vm: ['vm', 'VM'],
  network: ['network', 'network'],
}
createInterface.permission = 'admin'
exports.createInterface = createInterface

#---------------------------------------------------------------------

attachPci = $coroutine ({vm, pciId}) ->
  xapi = @getXAPI vm

  $wait xapi.call 'VM.add_to_other_config', vm.ref, 'pci', pciId

  return true


attachPci.params = {
  vm: { type: 'string' }
  pciId: { type: 'string' }
}

attachPci.resolve = {
  vm: ['vm', 'VM'],
}
attachPci.permission = 'admin'
exports.attachPci = attachPci

#---------------------------------------------------------------------

detachPci = $coroutine ({vm}) ->
  xapi = @getXAPI vm

  $wait xapi.call 'VM.remove_from_other_config', vm.ref, 'pci'

  return true


detachPci.params = {
  vm: { type: 'string' }
}

detachPci.resolve = {
  vm: ['vm', 'VM'],
}
detachPci.permission = 'admin'
exports.detachPci = detachPci
#---------------------------------------------------------------------


stats = $coroutine ({vm}) ->

  xapi = @getXAPI vm

  host = @getObject vm.$container
  do (type = host.type) =>
    if type is 'pool'
      host = @getObject host.master, 'host'
    else unless type is 'host'
      throw new Error "unexpected type: got #{type} instead of host"

  [response, body] = $wait $request {
    method: 'get'
    rejectUnauthorized: false
    url: 'https://'+host.address+'/vm_rrd?session_id='+xapi.sessionId+'&uuid='+vm.UUID
  }

  if response.statusCode isnt 200
    throw new Error('Cannot fetch the RRDs')

  json = parseXml(body)
  # Find index of needed objects for getting their values after
  cpusIndexes = []
  index = 0
  while (pos = $findIndex(json.rrd.ds, 'name', 'cpu' + index++)) isnt -1
    cpusIndexes.push(pos)
  vifsIndexes = []
  index = 0
  while (pos = $findIndex(json.rrd.ds, 'name', 'vif_' + index + '_rx')) isnt -1
    vifsIndexes.push(pos)
    vifsIndexes.push($findIndex(json.rrd.ds, 'name', 'vif_' + (index++) + '_tx'))
  xvdsIndexes = []
  index = 97 # Starting to browse ascii table from 'a' to 'z' (122)
  while index <= 122 and (pos = $findIndex(json.rrd.ds, 'name', 'vbd_xvd' + String.fromCharCode(index) + '_read')) isnt -1
    xvdsIndexes.push(pos)
    xvdsIndexes.push($findIndex(json.rrd.ds, 'name', 'vbd_xvd' + String.fromCharCode(index++) + '_write'))

  memoryFreeIndex = $findIndex(json.rrd.ds, 'name': 'memory_internal_free')
  memoryIndex = $findIndex(json.rrd.ds, 'name': 'memory')

  memoryFree = []
  memoryUsed = []
  memory = []
  cpus = []
  vifs = []
  xvds = []
  date = [] #TODO
  baseDate = json.rrd.lastupdate
  dateStep = json.rrd.step
  numStep = json.rrd.rra[0].database.row.length - 1

  $forEach json.rrd.rra[0].database.row, (n, key) ->
    # WARNING! memoryFree is in Kb not in b, memory is in b
    memoryFree.push(n.v[memoryFreeIndex]*1024)
    memoryUsed.push(Math.round(parseInt(n.v[memoryIndex])-(n.v[memoryFreeIndex]*1024)))
    memory.push(parseInt(n.v[memoryIndex]))
    date.push(baseDate - (dateStep * (numStep - key)))
    # build the multi dimensional arrays
    $forEach cpusIndexes, (value, key) ->
      cpus[key] ?= []
      cpus[key].push(n.v[value]*100)
      return
    $forEach vifsIndexes, (value, key) ->
      vifs[key] ?= []
      vifs[key].push(if n.v[value] == 'NaN' then null else n.v[value]) # * (if key % 2 then -1 else 1))
      return
    $forEach xvdsIndexes, (value, key) ->
      xvds[key] ?= []
      xvds[key].push(if n.v[value] == 'NaN' then null else n.v[value]) # * (if key % 2 then -1 else 1))
      return
    return


  # the final object
  return {
    memoryFree: memoryFree
    memoryUsed: memoryUsed
    memory: memory
    date: date
    cpus: cpus
    vifs: vifs
    xvds: xvds
  }

stats.params = {
  id: { type: 'string' }
}

stats.resolve = {
  vm: ['id', ['VM', 'VM-snapshot']],
}

exports.stats = stats;

#---------------------------------------------------------------------

enableDocker = $coroutine ({vm}) ->
  xapi = @getXAPI vm

  $wait xapi.call 'VM.remove_from_other_config', vm.ref, 'xscontainer-monitor'
  $wait xapi.call 'VM.add_to_other_config', vm.ref, 'xscontainer-monitor', 'True'

  return true


enableDocker.params = {
  vm: { type: 'string' }
}

enableDocker.resolve = {
  vm: ['vm', 'VM'],
}
enableDocker.permission = 'admin'
exports.enableDocker = enableDocker
#---------------------------------------------------------------------

disableDocker = $coroutine ({vm}) ->
  xapi = @getXAPI vm

  $wait xapi.call 'VM.remove_from_other_config', vm.ref, 'xscontainer-monitor'
  $wait xapi.call 'VM.add_to_other_config', vm.ref, 'xscontainer-monitor', 'False'

  return true


disableDocker.params = {
  vm: { type: 'string' }
}

disableDocker.resolve = {
  vm: ['vm', 'VM'],
}
disableDocker.permission = 'admin'
exports.disableDocker = disableDocker
