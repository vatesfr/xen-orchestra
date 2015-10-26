$debug = (require 'debug') 'xo:api:vm'
$find = require 'lodash.find'
$findIndex = require 'lodash.findindex'
$forEach = require 'lodash.foreach'
endsWith = require 'lodash.endswith'
got = require('got')
startsWith = require 'lodash.startswith'
{coroutine: $coroutine} = require 'bluebird'
{parseXml, promisify} = require '../utils'

#=====================================================================

set = $coroutine (params) ->
  {host} = params
  xapi = @getXAPI host

  for param, field of {
    'name_label'
    'name_description'
  }
    continue unless param of params

    yield xapi.call "host.set_#{field}", host.ref, params[param]

  return true

set.description = 'changes the properties of an host'

set.params =
  id: type: 'string'
  name_label:
    type: 'string'
    optional: true
  name_description:
    type: 'string'
    optional: true

set.resolve = {
  host: ['id', 'host', 'administrate'],
}

exports.set = set

#---------------------------------------------------------------------

restart = $coroutine ({host}) ->
  xapi = @getXAPI host

  yield xapi.call 'host.disable', host.ref
  yield xapi.call 'host.reboot', host.ref

  return true

restart.description = 'restart the host'

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

  yield xapi.call 'host.restart_agent', host.ref

  return true

restartAgent.description = 'restart the Xen agent on the host'

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

  yield xapi.call 'host.power_on', host.ref

  return true

start.description = 'start the host'

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

  yield xapi.call 'host.disable', host.ref
  yield xapi.call 'host.shutdown', host.ref

  return true

stop.description = 'stop the host'

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

  yield xapi.call 'pool.eject', host.ref

  return true

detach.description = 'eject the host of a pool'

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

  yield xapi.call 'host.enable', host.ref

  return true

enable.description = 'enable to create VM on the host'

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

  yield xapi.call 'host.disable', host.ref

  return true

disable.description = 'disable to create VM on the hsot'

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

  network_ref = yield xapi.call 'network.create', {
    name_label: name,
    name_description: description,
    MTU: mtu ? '1500'
    other_config: {}
  }

  if pif?
    vlan = vlan ? '0'
    pif = @getObject pif, 'PIF'
    yield xapi.call 'pool.create_VLAN_from_PIF', pif.ref, network_ref, vlan

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

listMissingPatches.description = 'return an array of missing new patches in the host'

#---------------------------------------------------------------------

installPatch = ({host, patch: patchUuid}) ->
  return @getXAPI(host).installPoolPatchOnHost(patchUuid, host.id)

installPatch.description = 'install a patch on an host'

installPatch.params = {
  host: { type: 'string' }
  patch: { type: 'string' }
}

installPatch.resolve = {
  host: ['host', 'host', 'administrate']
}

exports.installPatch = installPatch

#---------------------------------------------------------------------

installAllPatches = ({host}) ->
  return @getXAPI(host).installAllPoolPatchesOnHost(host.id)

installAllPatches.description = 'install all the missing patches on a host'

installAllPatches.params = {
  host: { type: 'string' }
}

installAllPatches.resolve = {
  host: ['host', 'host', 'administrate']
}

exports.installAllPatches = installAllPatches

#---------------------------------------------------------------------

stats = $coroutine ({host, granularity}) ->
  stats = yield @getXapiHostStats(host, granularity)
  return stats

stats.description = 'returns statistic of the host'

stats.params = {
  host: { type: 'string' }
}

stats.resolve = {
  host: ['host', 'host', 'view']
}

exports.stats = stats;
