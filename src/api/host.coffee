{$coroutine, $wait} = require '../fibers-utils'
$debug = (require 'debug') 'xo:api:vm'
$request = require('bluebird').promisify(require('request'))
{parseXml} = require '../utils'
$forEach = require 'lodash.foreach'
$find = require 'lodash.find'
$findIndex = require 'lodash.findindex'
startsWith = require 'lodash.startswith'
endsWith = require 'lodash.endswith'

#=====================================================================

set = $coroutine (params) ->
  {host} = params
  xapi = @getXAPI host

  for param, field of {
    'name_label'
    'name_description'
    'enabled'
  }
    continue unless param of params

    $wait xapi.call "host.set_#{field}", host.ref, params[param]

  return true

set.params =
  id: type: 'string'
  name_label:
    type: 'string'
    optional: true
  name_description:
    type: 'string'
    optional: true
  enabled:
    type: 'boolean'
    optional: true

set.resolve = {
  host: ['id', 'host', 'administrate'],
}

exports.set = set

#---------------------------------------------------------------------

restart = $coroutine ({host}) ->
  xapi = @getXAPI host

  $wait xapi.call 'host.disable', host.ref
  $wait xapi.call 'host.reboot', host.ref

  return true

restart.params = {
  id: { type: 'string' }
}

restart.resolve = {
  host: ['id', 'host', 'operate'],
}

exports.restart = restart

#---------------------------------------------------------------------

restartAgent = $coroutine ({host}) ->
  xapi = @getXAPI host

  $wait xapi.call 'host.restart_agent', host.ref

  return true

restartAgent.params = {
  id: { type: 'string' }
}

restartAgent.resolve = {
  host: ['id', 'host', 'operate'],
}

# TODO camel case
exports.restart_agent = restartAgent

#---------------------------------------------------------------------

start = $coroutine ({host}) ->
  xapi = @getXAPI host

  $wait xapi.call 'host.power_on', host.ref

  return true

start.params = {
  id: { type: 'string' }
}

start.resolve = {
  host: ['id', 'host', 'operate'],
}

exports.start = start

#---------------------------------------------------------------------

stop = $coroutine ({host}) ->
  xapi = @getXAPI host

  $wait xapi.call 'host.disable', host.ref
  $wait xapi.call 'host.shutdown', host.ref

  return true

stop.params = {
  id: { type: 'string' }
}

stop.resolve = {
  host: ['id', 'host', 'operate'],
}

exports.stop = stop

#---------------------------------------------------------------------

detach = $coroutine ({host}) ->
  xapi = @getXAPI host

  $wait xapi.call 'pool.eject', host.ref

  return true

detach.params = {
  id: { type: 'string' }
}

detach.resolve = {
  host: ['id', 'host', 'administrate'],
}

exports.detach = detach

#---------------------------------------------------------------------

enable = $coroutine ({host}) ->
  xapi = @getXAPI host

  $wait xapi.call 'host.enable', host.ref

  return true

enable.params = {
  id: { type: 'string' }
}

enable.resolve = {
  host: ['id', 'host', 'administrate'],
}

exports.enable = enable

#---------------------------------------------------------------------

disable = $coroutine ({host}) ->
  xapi = @getXAPI host

  $wait xapi.call 'host.disable', host.ref

  return true

disable.params = {
  id: { type: 'string' }
}

disable.resolve = {
  host: ['id', 'host', 'administrate'],
}

exports.disable = disable

#---------------------------------------------------------------------

createNetwork = $coroutine ({host, name, description, pif, mtu, vlan}) ->
  xapi = @getXAPI host

  description = description ? 'Created with Xen Orchestra'

  network_ref = $wait xapi.call 'network.create', {
    name_label: name,
    name_description: description,
    MTU: mtu ? '1500'
    other_config: {}
  }

  if pif?
    vlan = vlan ? '0'
    pif = @getObject pif, 'PIF'
    $wait xapi.call 'pool.create_VLAN_from_PIF', pif.ref, network_ref, vlan

  return true

createNetwork.params = {
  host: { type: 'string' }
  name: { type: 'string' }
  description: { type: 'string', optional: true }
  pif: { type: 'string', optional: true }
  mtu: { type: 'string', optional: true }
  vlan: { type: 'string', optional: true }
}

createNetwork.resolve = {
  host: ['host', 'host', 'administrate'],
}
createNetwork.permission = 'admin'
exports.createNetwork = createNetwork

#---------------------------------------------------------------------
# Returns an array of missing new patches in the host
# Returns an empty array if up-to-date
# Throws an error if the host is not running the latest XS version

listMissingPatches = ({host}) ->
  return @getXAPI(host).listMissingPoolPatchesOnHost(host.id)

listMissingPatches.params = {
  host: { type: 'string' }
}

listMissingPatches.resolve = {
  host: ['host', 'host', 'view'],
}

exports.listMissingPatches = listMissingPatches

#---------------------------------------------------------------------

installPatch = ({host, patch: patchUuid}) ->
  return @getXAPI(host).installPoolPatchOnHost(patchUuid, host.id)

installPatch.params = {
  host: { type: 'string' }
  patch: { type: 'string' }
}

installPatch.resolve = {
  host: ['host', 'host', 'administrate']
}

exports.installPatch = installPatch

#---------------------------------------------------------------------


stats = $coroutine ({host}) ->

  xapi = @getXAPI host

  [response, body] = $wait $request {
    method: 'get'
    rejectUnauthorized: false
    url: 'https://'+host.address+'/host_rrd?session_id='+xapi.sessionId
  }

  if response.statusCode isnt 200
    throw new Error('Cannot fetch the RRDs')

  json = parseXml(body)

  # Find index of needed objects for getting their values after
  cpusIndexes = []
  pifsIndexes = []
  memoryFreeIndex = []
  memoryIndex = []
  loadIndex = []
  index = 0

  $forEach(json.rrd.ds, (value, i) ->
    if /^cpu[0-9]+$/.test(value.name)
      cpusIndexes.push(i)
    else if startsWith(value.name, 'pif_eth') && endsWith(value.name, '_tx')
      pifsIndexes.push(i)
    else if startsWith(value.name, 'pif_eth') && endsWith(value.name, '_rx')
      pifsIndexes.push(i)
    else if startsWith(value.name, 'loadavg')
      loadIndex.push(i)
    else if startsWith(value.name, 'memory_free_kib')
      memoryFreeIndex.push(i)
    else if startsWith(value.name, 'memory_total_kib')
      memoryIndex.push(i)

    return
  )

  memoryFree = []
  memoryUsed = []
  memory = []
  load = []
  cpus = []
  pifs = []
  date = [] #TODO
  baseDate = json.rrd.lastupdate
  dateStep = json.rrd.step
  numStep = json.rrd.rra[0].database.row.length - 1

  $forEach json.rrd.rra[0].database.row, (n, key) ->
    memoryFree.push(Math.round(parseInt(n.v[memoryFreeIndex])))
    memoryUsed.push(Math.round(parseInt(n.v[memoryIndex])-(n.v[memoryFreeIndex])))
    memory.push(parseInt(n.v[memoryIndex]))
    load.push(n.v[loadIndex])
    date.push(baseDate - (dateStep * (numStep - key)))
    # build the multi dimensional arrays
    $forEach cpusIndexes, (value, key) ->
      cpus[key] ?= []
      cpus[key].push(n.v[value]*100)
      return
    $forEach pifsIndexes, (value, key) ->
      pifs[key] ?= []
      pifs[key].push(if n.v[value] == 'NaN' then null else n.v[value]) # * (if key % 2 then -1 else 1))
      return
    return


  # the final object
  return {
    memoryFree: memoryFree
    memoryUsed: memoryUsed
    memory: memory
    date: date
    cpus: cpus
    pifs: pifs
    load: load
  }

stats.params = {
  host: { type: 'string' }
}

stats.resolve = {
  host: ['host', 'host', 'view']
}

exports.stats = stats;
