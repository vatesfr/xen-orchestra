$debug = (require 'debug') 'xo:api:vm'
$filter = require 'lodash.filter'
$findIndex = require 'lodash.findindex'
$findWhere = require 'lodash.find'
$isArray = require 'lodash.isarray'
endsWith = require 'lodash.endswith'
escapeStringRegexp = require 'escape-string-regexp'
eventToPromise = require 'event-to-promise'
got = require('got')
sortBy = require 'lodash.sortby'
startsWith = require 'lodash.startswith'
{coroutine: $coroutine} = require 'bluebird'
{format} = require 'json-rpc-peer'

{
  JsonRpcError,
  Unauthorized
} = require('../api-errors')
{
  forEach,
  formatXml: $js2xml,
  mapToArray,
  parseSize,
  parseXml,
  pFinally
} = require '../utils'
{isVmRunning: $isVMRunning} = require('../xapi')

#=====================================================================

checkPermissionOnSrs = (vm, permission = 'operate') -> (
  permissions = []
  forEach(vm.$VBDs, (vbdId) =>
    vbd = @getObject(vbdId, 'VBD')
    vdiId = vbd.VDI

    if vbd.is_cd_drive or not vdiId
      return

    permissions.push([
      @getObject(vdiId, 'VDI').$SR,
      permission
    ])
  )

  return @hasPermissions(@session.get('user_id'), permissions).then((success) => (
    throw new Unauthorized() unless success
  ))
)

#=====================================================================

# TODO: Implement ACLs
create = $coroutine ({
  installation
  name_description
  name_label
  template
  pv_args
  VDIs
  VIFs
  existingDisks
}) ->
  vm = yield @getXAPI(template).createVm(template._xapiId, {
    installRepository: installation && installation.repository,
    nameDescription: name_description,
    nameLabel: name_label,
    pvArgs: pv_args,
    vdis: VDIs,
    vifs: VIFs,
    existingDisks
  })

  return vm.$id

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

  # Name/description of the new VM.
  name_label: { type: 'string' }
  name_description: { type: 'string', optional: true }

  # PV Args
  pv_args: { type: 'string', optional: true }

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
        device: { type: 'string' }
        size: { type: ['integer', 'string'] }
        SR: { type: 'string' }
        type: { type: 'string' }
      }
    }
  }
}

create.resolve = {
  template: ['template', 'VM-template', 'administrate'],
}

exports.create = create

#---------------------------------------------------------------------

delete_ = ({vm, delete_disks: deleteDisks}) ->
  return @getXAPI(vm).deleteVm(vm._xapiId, deleteDisks)

delete_.params = {
  id: { type: 'string' }

  delete_disks: {
    optional: true
    type: 'boolean'
  }
}
delete_.resolve = {
  vm: ['id', ['VM', 'VM-snapshot', 'VM-template'], 'administrate']
}

exports.delete = delete_

#---------------------------------------------------------------------

ejectCd = $coroutine ({vm}) ->
  yield @getXAPI(vm).ejectCdFromVm(vm._xapiId)
  return

ejectCd.params = {
  id: { type: 'string' }
}

ejectCd.resolve = {
  vm: ['id', 'VM', 'operate']
}
exports.ejectCd = ejectCd

#---------------------------------------------------------------------

insertCd = $coroutine ({vm, vdi, force}) ->
  yield @getXAPI(vm).insertCdIntoVm(vdi._xapiId, vm._xapiId, {force})
  return

insertCd.params = {
  id: { type: 'string' }
  cd_id: { type: 'string' }
  force: { type: 'boolean' }
}

insertCd.resolve = {
  vm: ['id', 'VM', 'operate'],
  vdi: ['cd_id', 'VDI', 'view'],
}
exports.insertCd = insertCd

#---------------------------------------------------------------------

migrate = $coroutine ({vm, host}) ->
  yield @getXAPI(vm).migrateVm(vm._xapiId, @getXAPI(host), host._xapiId)
  return

migrate.params = {
  # Identifier of the VM to migrate.
  id: { type: 'string' }

  # Identifier of the host to migrate to.
  host_id: { type: 'string' }
}

migrate.resolve = {
  vm: ['id', 'VM']
  host: ['host_id', 'host', 'administrate']
}

exports.migrate = migrate

#---------------------------------------------------------------------

migratePool = $coroutine ({
  vm,
  host
  sr
  network
  migrationNetwork
}) ->
  yield @getXAPI(vm).migrateVm(vm._xapiId, @getXAPI(host), host._xapiId, {
    migrationNetworkId: migrationNetwork?._xapiId
    networkId: network?._xapiId,
    srId: sr?._xapiId,
  })
  return

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
  vm: ['id', 'VM', 'administrate'],
  host: ['target_host_id', 'host', 'administrate'],
  sr: ['target_sr_id', 'SR', 'administrate'],
  network: ['target_network_id', 'network', 'administrate'],
  migrationNetwork: ['migration_network_id', 'network', 'administrate'],
}

# TODO: camel case.
exports.migrate_pool = migratePool

#---------------------------------------------------------------------

# FIXME: human readable strings should be handled.
set = $coroutine (params) ->
  {VM} = params
  xapi = @getXAPI VM

  {_xapiRef: ref} = VM

  # Memory.
  if 'memory' of params
    memory = size(params.memory)

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
      yield xapi.call 'VM.set_memory_dynamic_min', ref, "#{memory}"
    else if memory > VM.memory.static[1]
      yield xapi.call 'VM.set_memory_static_max', ref, "#{memory}"
    yield xapi.call 'VM.set_memory_dynamic_max', ref, "#{memory}"

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
      yield xapi.call 'VM.set_VCPUs_number_live', ref, "#{CPUs}"
    else
      if CPUs > VM.CPUs.max
        yield xapi.call 'VM.set_VCPUs_max', ref, "#{CPUs}"
      yield xapi.call 'VM.set_VCPUs_at_startup', ref, "#{CPUs}"

  # HA policy
  # TODO: also handle "best-effort" case
  if 'high_availability' of params
    {high_availability} = params

    if high_availability
      yield xapi.call 'VM.set_ha_restart_priority', ref, "restart"
    else
      yield xapi.call 'VM.set_ha_restart_priority', ref, ""

  if 'auto_poweron' of params
    {auto_poweron} = params

    if auto_poweron
      yield xapi.call 'VM.add_to_other_config', ref, 'auto_poweron', 'true'
      yield xapi.setPoolProperties({autoPowerOn: true})
    else
      yield xapi.call 'VM.remove_from_other_config', ref, 'auto_poweron'

  # Other fields.
  for param, fields of {
    'name_label'
    'name_description'
    'PV_args'
  }
    continue unless param of params

    for field in (if $isArray fields then fields else [fields])
      yield xapi.call "VM.set_#{field}", ref, "#{params[param]}"

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
  memory: { type: ['integer', 'string'], optional: true }

  # Kernel arguments for PV VM.
  PV_args: { type: 'string', optional: true }
}

set.resolve = {
  VM: ['id', ['VM', 'VM-snapshot'], 'administrate']
}

exports.set = set

#---------------------------------------------------------------------

restart = $coroutine ({vm, force}) ->
  xapi = @getXAPI(vm)

  if force
    yield xapi.call 'VM.hard_reboot', vm._xapiRef
  else
    yield xapi.call 'VM.clean_reboot', vm._xapiRef

  return true

restart.params = {
  id: { type: 'string' }
  force: { type: 'boolean' }
}

restart.resolve = {
  vm: ['id', 'VM', 'operate']
}

exports.restart = restart

#---------------------------------------------------------------------

clone = $coroutine ({vm, name, full_copy}) ->
  yield checkPermissionOnSrs.call(this, vm)

  return @getXAPI(vm).cloneVm(vm._xapiRef, {
    nameLabel: name,
    fast: not full_copy
  }).then((vm) -> vm.$id)

clone.params = {
  id: { type: 'string' }
  name: { type: 'string' }
  full_copy: { type: 'boolean' }
}

clone.resolve = {
  # TODO: is it necessary for snapshots?
  vm: ['id', 'VM', 'administrate']
}

exports.clone = clone

#---------------------------------------------------------------------

copy = $coroutine ({
  compress,
  name: nameLabel,
  sr,
  vm
}) ->
  if vm.$pool == sr.$pool
    if vm.power_state is 'Running'
      yield checkPermissionOnSrs.call(this, vm)

    return @getXAPI(vm).copyVm(vm._xapiId, sr._xapiId, {
      nameLabel
    }).then((vm) -> vm.$id)

  return @getXAPI(vm).remoteCopyVm(vm._xapiId, @getXAPI(sr), sr._xapiId, {
    compress,
    nameLabel
  }).then((vm) -> vm.$id)

copy.params = {
  compress: {
    type: 'boolean',
    optional: true
  },
  name: {
    type: 'string',
    optional: true
  },
  vm: { type: 'string' },
  sr: { type: 'string' }
}

copy.resolve = {
  vm: [ 'vm', 'VM', 'administrate' ]
  sr: [ 'sr', 'SR', 'operate' ]
}

exports.copy = copy

#---------------------------------------------------------------------

# TODO: rename convertToTemplate()
convert = $coroutine ({vm}) ->
  yield @getXAPI(vm).call 'VM.set_is_a_template', vm._xapiRef, true

  return true

convert.params = {
  id: { type: 'string' }
}

convert.resolve = {
  vm: ['id', ['VM', 'VM-snapshot'], 'administrate']
}
exports.convert = convert

#---------------------------------------------------------------------

snapshot = $coroutine ({vm, name}) ->
  yield checkPermissionOnSrs.call(this, vm)

  snapshot = yield @getXAPI(vm).snapshotVm(vm._xapiRef, name)
  return snapshot.$id

snapshot.params = {
  id: { type: 'string' }
  name: { type: 'string' }
}

snapshot.resolve = {
  vm: ['id', 'VM', 'administrate']
}
exports.snapshot = snapshot

#---------------------------------------------------------------------

rollingSnapshot = $coroutine ({vm, tag, depth}) ->
  yield checkPermissionOnSrs.call(this, vm)
  yield @rollingSnapshotVm(vm, tag, depth)

rollingSnapshot.params = {
  id: { type: 'string' }
  tag: { type: 'string' }
  depth: { type: 'number' }
}

rollingSnapshot.resolve = {
  vm: ['id', 'VM', 'administrate']
}

rollingSnapshot.description = 'Snapshots a VM with a tagged name, and removes the oldest snapshot with the same tag according to depth'

exports.rollingSnapshot = rollingSnapshot

#---------------------------------------------------------------------

backup = $coroutine ({vm, pathToFile, compress, onlyMetadata}) ->
  yield @backupVm({vm, pathToFile, compress, onlyMetadata})

backup.params = {
  id: { type: 'string' }
  pathToFile: { type: 'string' }
  compress: { type: 'boolean', optional: true }
  onlyMetadata: { type: 'boolean', optional: true }
}

backup.resolve = {
  vm: ['id', 'VM', 'administrate']
}

backup.description = 'Exports a VM to the file system'

exports.backup = backup

#---------------------------------------------------------------------

rollingBackup = $coroutine ({vm, remoteId, tag, depth, compress, onlyMetadata}) ->
  remote = yield @getRemote remoteId
  if not remote?.path?
    throw new Error "No such Remote #{remoteId}"
  if not remote.enabled
    throw new Error "Backup remote #{remoteId} is disabled"
  return yield @rollingBackupVm({
    vm,
    path: remote.path,
    tag,
    depth,
    compress,
    onlyMetadata
  })

rollingBackup.params = {
  id: { type: 'string' }
  remoteId: { type: 'string' }
  tag: { type: 'string'}
  depth: { type: 'number' }
  compress: { type: 'boolean', optional: true }
}

rollingBackup.resolve = {
  vm: ['id', ['VM', 'VM-snapshot'], 'administrate']
}

rollingBackup.description = 'Exports a VM to the file system with a tagged name, and removes the oldest backup with the same tag according to depth'

exports.rollingBackup = rollingBackup

#---------------------------------------------------------------------

rollingDrCopy = ({vm, pool, tag, depth}) ->
  if vm.$pool is pool.id
    throw new JsonRpcError('Disaster Recovery attempts to copy on the same pool')
  return @rollingDrCopyVm({vm, sr: @getObject(pool.default_SR, 'SR'), tag, depth})

rollingDrCopy.params = {
  id: { type: 'string' }
  pool: { type: 'string' }
  tag: { type: 'string'}
  depth: { type: 'number' }
}

rollingDrCopy.resolve = {
  vm: ['id', ['VM', 'VM-snapshot'], 'administrate'],
  pool: ['pool', 'pool', 'administrate']
}

rollingDrCopy.description = 'Copies a VM to a different pool, with a tagged name, and removes the oldest VM with the same tag from this pool, according to depth'

exports.rollingDrCopy = rollingDrCopy

#---------------------------------------------------------------------

start = ({vm}) ->
  return @getXAPI(vm).startVm(vm._xapiId)

start.params = {
  id: { type: 'string' }
}

start.resolve = {
  vm: ['id', 'VM', 'operate']
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
    yield xapi.call 'VM.hard_shutdown', vm._xapiRef
    return true

  # Clean shutdown
  try
    yield xapi.call 'VM.clean_shutdown', vm._xapiRef
  catch error
    if error.code is 'VM_MISSING_PV_DRIVERS' or error.code is 'VM_LACKS_FEATURE_SHUTDOWN'
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
  vm: ['id', 'VM', 'operate']
}

exports.stop = stop

#---------------------------------------------------------------------

suspend = $coroutine ({vm}) ->
  yield @getXAPI(vm).call 'VM.suspend', vm._xapiRef

  return true

suspend.params = {
  id: { type: 'string' }
}

suspend.resolve = {
  vm: ['id', 'VM', 'operate']
}
exports.suspend = suspend

#---------------------------------------------------------------------

resume = $coroutine ({vm, force}) ->
  # FIXME: WTF this is?
  if not force
    force = true

  yield @getXAPI(vm).call 'VM.resume', vm._xapiRef, false, force

  return true

resume.params = {
  id: { type: 'string' }
  force: { type: 'boolean', optional: true }
}

resume.resolve = {
  vm: ['id', 'VM', 'operate']
}
exports.resume = resume

#---------------------------------------------------------------------

# revert a snapshot to its parent VM
revert = $coroutine ({snapshot}) ->
  # Attempts a revert from this snapshot to its parent VM
  yield @getXAPI(snapshot).call 'VM.revert', snapshot._xapiRef

  return true

revert.params = {
  id: { type: 'string' }
}

revert.resolve = {
  snapshot: ['id', 'VM-snapshot', 'administrate']
}
exports.revert = revert

#---------------------------------------------------------------------

handleExport = $coroutine (req, res, {xapi, id, compress, onlyMetadata}) ->
  stream = yield xapi.exportVm(id, {
    compress: compress ? true,
    onlyMetadata: onlyMetadata ? false
  })
  upstream = stream.response
  res.on('close', () ->
    stream.cancel()
  )
  # Remove the filename as it is already part of the URL.
  upstream.headers['content-disposition'] = 'attachment'

  res.writeHead(
    upstream.statusCode,
    upstream.statusMessage ? '',
    upstream.headers
  )
  stream.pipe(res)
  return

# TODO: integrate in xapi.js
export_ = $coroutine ({vm, compress, onlyMetadata}) ->
  if vm.power_state is 'Running'
    yield checkPermissionOnSrs.call(this, vm)

  data = {
    xapi: @getXAPI(vm),
    id: vm._xapiId,
    compress,
    onlyMetadata
  }

  return {
    $getFrom: yield @registerHttpRequest(handleExport, data, {
      suffix: encodeURI("/#{vm.name_label}.xva")
    })
  }

export_.params = {
  vm: { type: 'string' }
  compress: { type: 'boolean', optional: true }
  onlyMetadata: { type: 'boolean', optional: true }
}

export_.resolve = {
  vm: ['vm', ['VM', 'VM-snapshot'], 'administrate'],
}
exports.export = export_;

#---------------------------------------------------------------------

handleVmImport = $coroutine (req, res, { xapi }) ->
  # Timeout seems to be broken in Node 4.
  # See https://github.com/nodejs/node/issues/3319
  req.setTimeout(43200000) # 12 hours

  contentLength = req.headers['content-length']
  if !contentLength
    res.writeHead(411)
    res.end('Content length is mandatory')
    return

  try
    vm = yield xapi.importVm(req, contentLength)
    res.end(format.response(0, vm.$id))
  catch e
    res.writeHead(500)
    res.end(format.error(new JsonRpcError(e.message)))

  return

# TODO: "sr_id" can be passed in URL to target a specific SR
import_ = $coroutine ({host}) ->
  xapi = @getXAPI(host)

  return {
    $sendTo: yield @registerHttpRequest(handleVmImport, { xapi })
  }

import_.params = {
  host: { type: 'string' }
}

import_.resolve = {
  host: ['host', 'host', 'administrate']
}
exports.import = import_

#---------------------------------------------------------------------

# FIXME: if position is used, all other disks after this position
# should be shifted.
attachDisk = $coroutine ({vm, vdi, position, mode, bootable}) ->
  yield @getXAPI(vm).attachVdiToVm(vdi._xapiId, vm._xapiId, {
    bootable,
    position,
    readOnly: mode is 'RO'
  })
  return

attachDisk.params = {
  bootable: {
    type: 'boolean'
    optional: true
  }
  mode: { type: 'string', optional: true }
  position: { type: 'string', optional: true }
  vdi: { type: 'string' }
  vm: { type: 'string' }
}

attachDisk.resolve = {
  vm: ['vm', 'VM', 'administrate'],
  vdi: ['vdi', 'VDI', 'administrate'],
}
exports.attachDisk = attachDisk

#---------------------------------------------------------------------

# FIXME: position should be optional and default to last.

createInterface = $coroutine ({vm, network, position, mtu, mac}) ->
  vif = yield @getXAPI(vm).createVif(vm._xapiId, network._xapiId, {
    mac,
    mtu,
    position
  })

  return vif.$id

createInterface.params = {
  vm: { type: 'string' }
  network: { type: 'string' }
  position: { type: 'string' }
  mtu: { type: 'string', optional: true }
  mac: { type: 'string', optional: true }
}

createInterface.resolve = {
  vm: ['vm', 'VM', 'administrate'],
  network: ['network', 'network', 'view'],
}
exports.createInterface = createInterface

#---------------------------------------------------------------------

attachPci = $coroutine ({vm, pciId}) ->
  xapi = @getXAPI vm

  yield xapi.call 'VM.add_to_other_config', vm._xapiRef, 'pci', pciId

  return true


attachPci.params = {
  vm: { type: 'string' }
  pciId: { type: 'string' }
}

attachPci.resolve = {
  vm: ['vm', 'VM', 'administrate'],
}
exports.attachPci = attachPci

#---------------------------------------------------------------------

detachPci = $coroutine ({vm}) ->
  xapi = @getXAPI vm

  yield xapi.call 'VM.remove_from_other_config', vm._xapiRef, 'pci'

  return true


detachPci.params = {
  vm: { type: 'string' }
}

detachPci.resolve = {
  vm: ['vm', 'VM', 'administrate'],
}
exports.detachPci = detachPci
#---------------------------------------------------------------------

stats = $coroutine ({vm, granularity}) ->
  stats = yield @getXapiVmStats(vm, granularity)
  return stats

stats.description = 'returns statistics about the VM'

stats.params = {
  id: { type: 'string' },
  granularity: {
    type: 'string',
    optional: true
  }
}

stats.resolve = {
  vm: ['id', ['VM', 'VM-snapshot'], 'view'],
}

exports.stats = stats;

#---------------------------------------------------------------------

setBootOrder = $coroutine ({vm, order}) ->
  xapi = @getXAPI vm

  order = {order: order}
  if vm.virtualizationMode == 'hvm'
    yield xapi.call 'VM.set_HVM_boot_params', vm._xapiRef, order
    return true

  @throw(
    'INVALID_PARAMS'
    'You can only set the boot order on a HVM guest'
  )

setBootOrder.params = {
  vm: { type: 'string' },
  order: { type: 'string' }
}

setBootOrder.resolve = {
  vm: ['vm', 'VM', 'operate'],
}
exports.setBootOrder = setBootOrder

#---------------------------------------------------------------------

recoveryStart = ({vm}) ->
  return @getXAPI(vm).startVmOnCd(vm._xapiId)

recoveryStart.params = {
  id: { type: 'string' }
}

recoveryStart.resolve = {
  vm: ['id', 'VM', 'operate'],
}
exports.recoveryStart = recoveryStart

#---------------------------------------------------------------------

getCloudInitConfig = $coroutine ({template}) ->
  return yield @getXAPI(template).getCloudInitConfig(template._xapiId)

getCloudInitConfig.params = {
  template: { type: 'string' }
}

getCloudInitConfig.resolve = {
  template: ['template', 'VM-template', 'administrate'],
}
exports.getCloudInitConfig = getCloudInitConfig

#---------------------------------------------------------------------

createCloudInitConfigDrive = $coroutine ({vm, sr, config}) ->
  xapi = @getXAPI vm
  yield xapi.createCloudInitConfigDrive(vm._xapiId, sr._xapiId, config)
  return true

createCloudInitConfigDrive.params = {
  vm: { type: 'string' },
  sr: { type: 'string' },
  config: { type: 'string' }
}

createCloudInitConfigDrive.resolve = {
  vm: ['vm', 'VM', 'administrate'],
  sr: [ 'sr', 'SR', 'operate' ]
}
exports.createCloudInitConfigDrive = createCloudInitConfigDrive

#=====================================================================

Object.defineProperty(exports, '__esModule', {
  value: true
})
