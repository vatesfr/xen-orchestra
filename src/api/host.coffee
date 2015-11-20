$debug = (require 'debug') 'xo:api:vm'
$find = require 'lodash.find'
$findIndex = require 'lodash.findindex'
$forEach = require 'lodash.foreach'
endsWith = require 'lodash.endswith'
got = require('got')
startsWith = require 'lodash.startswith'
{coroutine: $coroutine} = require 'bluebird'
{
  extractProperty,
  parseXml,
  promisify
} = require '../utils'

#=====================================================================

set = (params) ->
  host = extractProperty(params, 'host')

  return @getXAPI(host).setHostProperties(host._xapiId, params)

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

# FIXME: set force to false per default when correctly implemented in
# UI.
restart = ({host, force = true}) ->
  return @getXAPI(host).rebootHost(host._xapiId, force)

restart.description = 'restart the host'

restart.params = {
  id: { type: 'string' },
  force: {
    type: 'boolean',
    optional: true
  }
}

restart.resolve = {
  host: ['id', 'host', 'operate'],
}

exports.restart = restart

#---------------------------------------------------------------------

restartAgent = ({host}) ->
  return @getXAPI(host).restartHostAgent(host._xapiId)

restartAgent.description = 'restart the Xen agent on the host'

restartAgent.params = {
  id: { type: 'string' }
}

restartAgent.resolve = {
  host: ['id', 'host', 'administrate'],
}

# TODO camel case
exports.restart_agent = restartAgent

#---------------------------------------------------------------------

start = ({host}) ->
  return @getXAPI(host).powerOnHost(host._xapiId)

start.description = 'start the host'

start.params = {
  id: { type: 'string' }
}

start.resolve = {
  host: ['id', 'host', 'operate'],
}

exports.start = start

#---------------------------------------------------------------------

stop = ({host}) ->
  return @getXAPI(host).shutdownHost(host._xapiId)

stop.description = 'stop the host'

stop.params = {
  id: { type: 'string' }
}

stop.resolve = {
  host: ['id', 'host', 'operate'],
}

exports.stop = stop

#---------------------------------------------------------------------

detach = ({host}) ->
  return @getXAPI(host).ejectHostFromPool(host._xapiId)

detach.description = 'eject the host of a pool'

detach.params = {
  id: { type: 'string' }
}

detach.resolve = {
  host: ['id', 'host', 'administrate'],
}

exports.detach = detach

#---------------------------------------------------------------------

enable = ({host}) ->
  return @getXAPI(host).enableHost(host._xapiId)

enable.description = 'enable to create VM on the host'

enable.params = {
  id: { type: 'string' }
}

enable.resolve = {
  host: ['id', 'host', 'administrate'],
}

exports.enable = enable

#---------------------------------------------------------------------

disable = ({host}) ->
  return @getXAPI(host).disableHost(host._xapiId)

disable.description = 'disable to create VM on the hsot'

disable.params = {
  id: { type: 'string' }
}

disable.resolve = {
  host: ['id', 'host', 'administrate'],
}

exports.disable = disable

#---------------------------------------------------------------------

# TODO: to test and to fix.
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
    yield xapi.call 'pool.create_VLAN_from_PIF', pif._xapiRef, network_ref, vlan

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
  return @getXAPI(host).listMissingPoolPatchesOnHost(host._xapiId)

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
  return @getXAPI(host).installPoolPatchOnHost(patchUuid, host._xapiId)

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
  return @getXAPI(host).installAllPoolPatchesOnHost(host._xapiId)

installAllPatches.description = 'install all the missing patches on a host'

installAllPatches.params = {
  host: { type: 'string' }
}

installAllPatches.resolve = {
  host: ['host', 'host', 'administrate']
}

exports.installAllPatches = installAllPatches

#---------------------------------------------------------------------

emergencyShutdownHost = ({host}) ->
  return @getXAPI(host).emergencyShutdownHost(host._xapiId)

emergencyShutdownHost.description = 'suspend all VMs and shutdown host'

emergencyShutdownHost.params = {
  host: { type: 'string' }
}

emergencyShutdownHost.resolve = {
  host: ['host', 'host', 'administrate']
}

exports.emergencyShutdownHost = emergencyShutdownHost

#---------------------------------------------------------------------

stats = ({host, granularity}) ->
  return @getXapiHostStats(host, granularity)

stats.description = 'returns statistic of the host'

stats.params = {
  host: { type: 'string' },
  granularity: {
    type: 'string',
    optional: true
  }
}

stats.resolve = {
  host: ['host', 'host', 'view']
}

exports.stats = stats;

#=====================================================================

Object.defineProperty(exports, '__esModule', {
  value: true
})
