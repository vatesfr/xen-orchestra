$debug = (require 'debug') 'xo:api:vm'
$findIndex = require 'lodash.findindex'
$findWhere = require 'lodash.find'
$forEach = require 'lodash.foreach'
$isArray = require 'lodash.isarray'
$request = require('bluebird').promisify(require('request'))
$result = require 'lodash.result'
Bluebird = require 'bluebird'
endsWith = require 'lodash.endswith'
map = require 'lodash.map'
startsWith = require 'lodash.startswith'
{coroutine: $coroutine} = require 'bluebird'

{
  formatXml: $js2xml,
  parseXml,
  pFinally
} = require '../utils'

$isVMRunning = do ->
  runningStates = {
    'Paused': true
    'Running': true
  }

  (VM) -> !!runningStates[VM.power_state]

#=====================================================================

# TODO: Implement ACLs
create = $coroutine ({
  installation
  name_description
  name_label
  template
  VDIs
  VIFs
}) ->
  vm = yield @getXAPI(template).createVm(template.id, {
    installRepository: installation && installation.repository,
    nameDescription: name_description,
    nameLabel: name_label,
    vdis: VDIs,
    vifs: VIFs
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
        size: { type: 'integer' }
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
  return @getXAPI(vm).deleteVm(vm.id, deleteDisks)

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
  yield @getXAPI(vm).ejectCdFromVm(vm.id)
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
  yield @getXAPI(vm).insertCdIntoVm(vdi.id, vm.id, {force})
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
  unless $isVMRunning vm
    @throw 'INVALID_PARAMS', 'The VM can only be migrated when running'

  xapi = @getXAPI vm

  yield xapi.call 'VM.pool_migrate', vm.ref, host.ref, {'force': 'true'}

  return true

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
  vm: VM,
  host
  sr: SR
  network
  migrationNetwork
}) ->
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

  token = yield (@getXAPI host).call(
    'host.migrate_receive'
    host.ref
    migrationNetwork.ref
    {} # Other parameters
  )

  yield (@getXAPI VM).call(
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
    else
      yield xapi.call 'VM.remove_from_other_config', ref, 'auto_poweron'

  # Other fields.
  for param, fields of {
    'name_label'
    'name_description'
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
  memory: { type: 'integer', optional: true }
}

set.resolve = {
  VM: ['id', ['VM', 'VM-snapshot'], 'administrate']
}

exports.set = set

#---------------------------------------------------------------------

restart = $coroutine ({vm, force}) ->
  xapi = @getXAPI(vm)

  if force
    yield xapi.call 'VM.hard_reboot', vm.ref
  else
    yield xapi.call 'VM.clean_reboot', vm.ref

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
  xapi = @getXAPI(vm)

  newVm = yield if full_copy
    xapi.copyVm(vm.ref, null, name)
  else
    xapi.cloneVm(vm.ref, name)

  return newVm.$id

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

# TODO: rename convertToTemplate()
convert = $coroutine ({vm}) ->
  yield @getXAPI(vm).call 'VM.set_is_a_template', vm.ref, true

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
  snapshot = yield @getXAPI(vm).snapshotVm(vm.ref, name)
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
  snapshot = yield @getXAPI(vm).rollingSnapshotVm(vm.ref, tag, depth)
  return snapshot.$id

rollingSnapshot.params = {
  id: { type: 'string'}
  tag: {type: 'string'}
  depth: {type: 'number'}
}

rollingSnapshot.resolve = {
  vm: ['id', 'VM', 'administrate']
}

rollingSnapshot.description = 'Snaphots a VM with a tagged name, and removes the oldest snapshot with the same tag according to depth'

exports.rollingSnapshot = rollingSnapshot

#---------------------------------------------------------------------

start = $coroutine ({vm}) ->
  yield @getXAPI(vm).call(
    'VM.start', vm.ref
    false # Start paused?
    false # Skips the pre-boot checks?
  )

  return true

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
    yield xapi.call 'VM.hard_shutdown', vm.ref
    return true

  # Clean shutdown
  try
    yield xapi.call 'VM.clean_shutdown', vm.ref
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
  vm: ['id', 'VM', 'operate']
}

exports.stop = stop

#---------------------------------------------------------------------

suspend = $coroutine ({vm}) ->
  yield @getXAPI(vm).call 'VM.suspend', vm.ref

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

  yield @getXAPI(vm).call 'VM.resume', vm.ref, false, force

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
  yield @getXAPI(snapshot).call 'VM.revert', snapshot.ref

  return true

revert.params = {
  id: { type: 'string' }
}

revert.resolve = {
  snapshot: ['id', 'VM-snapshot', 'administrate']
}
exports.revert = revert

#---------------------------------------------------------------------

handleExport = (req, res, {stream, response: upstream}) ->
  res.writeHead(
    upstream.statusCode,
    upstream.statusMessage ? '',
    upstream.headers
  )
  stream.pipe(res)
  return

# TODO: integrate in xapi.js
export_ = $coroutine ({vm, compress}) ->
  stream = yield @getXAPI(vm).exportVm(vm.id, {compress: compress ? true})

  return {
    $getFrom: yield @registerHttpRequest(handleExport, {
      stream,
      response: yield stream.response
    })
  }

export_.params = {
  vm: { type: 'string' }
  compress: { type: 'boolean', optional: true }
}

export_.resolve = {
  vm: ['vm', ['VM', 'VM-snapshot'], 'administrate'],
}
exports.export = export_;

#---------------------------------------------------------------------

# FIXME
# TODO: "sr_id" can be passed in URL to target a specific SR
import_ = $coroutine ({host}) ->

  {sessionId} = @getXAPI(host)

  url = yield @registerProxyRequest {
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
  host: ['host', 'host', 'administrate']
}
exports.import = import_

#---------------------------------------------------------------------

# FIXME: if position is used, all other disks after this position
# should be shifted.
attachDisk = $coroutine ({vm, vdi, position, mode, bootable}) ->
  yield @getXAPI(vm).attachVdiToVm(vdi.id, vm.id, {
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
  vif = yield @getXAPI(vm).createVif(vm.id, network.id, {
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

  yield xapi.call 'VM.add_to_other_config', vm.ref, 'pci', pciId

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

  yield xapi.call 'VM.remove_from_other_config', vm.ref, 'pci'

  return true


detachPci.params = {
  vm: { type: 'string' }
}

detachPci.resolve = {
  vm: ['vm', 'VM', 'administrate'],
}
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

  [response, body] = yield $request {
    method: 'get'
    rejectUnauthorized: false
    url: 'https://'+host.address+'/vm_rrd?session_id='+xapi.sessionId+'&uuid='+vm.id
  }

  if response.statusCode isnt 200
    throw new Error('Cannot fetch the RRDs')

  json = parseXml(body)
  # Find index of needed objects for getting their values after
  cpusIndexes = []
  vifsIndexes = []
  xvdsIndexes = []
  memoryFreeIndex = []
  memoryIndex = []
  index = 0

  $forEach(json.rrd.ds, (value, i) ->
    if /^cpu[0-9]+$/.test(value.name)
      cpusIndexes.push(i)
    else if startsWith(value.name, 'vif_') && endsWith(value.name, '_tx')
      vifsIndexes.push(i)
    else if startsWith(value.name, 'vif_') && endsWith(value.name, '_rx')
      vifsIndexes.push(i)
    else if startsWith(value.name, 'vbd_xvd') && endsWith(value.name, '_write', 14)
      xvdsIndexes.push(i)
    else if startsWith(value.name, 'vbd_xvd') && endsWith(value.name, '_read', 13)
      xvdsIndexes.push(i)
    else if startsWith(value.name, 'memory_internal_free')
      memoryFreeIndex.push(i)
    else if endsWith(value.name, 'memory')
      memoryIndex.push(i)

    return
  )

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
  vm: ['id', ['VM', 'VM-snapshot'], 'view'],
}

exports.stats = stats;

#---------------------------------------------------------------------

# TODO: rename to setBootOrder
# TODO: check current VM is HVM
bootOrder = $coroutine ({vm, order}) ->
  xapi = @getXAPI vm

  order = {order: order}

  yield xapi.call 'VM.set_HVM_boot_params', vm.ref, order

  return true


bootOrder.params = {
  vm: { type: 'string' },
  order: { type: 'string' }
}

bootOrder.resolve = {
  vm: ['vm', 'VM', 'operate'],
}
exports.bootOrder = bootOrder
#---------------------------------------------------------------------
