$debug = (require 'debug') 'xo:api:vm'
$find = require 'lodash.find'
$findIndex = require 'lodash.findindex'
$forEach = require 'lodash.foreach'
endsWith = require 'lodash.endswith'
startsWith = require 'lodash.startswith'
{coroutine: $coroutine} = require 'bluebird'
{
  extractProperty,
  parseXml,
  promisify
} = require '../utils'

#=====================================================================

set = ({
  host,

  # TODO: use camel case.
  name_label: nameLabel,
  name_description: nameDescription
}) ->
  return @getXapi(host).setHostProperties(host._xapiId, {
    nameLabel,
    nameDescription
  })

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
  return @getXapi(host).rebootHost(host._xapiId, force)

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
  return @getXapi(host).restartHostAgent(host._xapiId)

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
  return @getXapi(host).powerOnHost(host._xapiId)

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
  return @getXapi(host).shutdownHost(host._xapiId)

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
  return @getXapi(host).ejectHostFromPool(host._xapiId)

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
  return @getXapi(host).enableHost(host._xapiId)

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
  return @getXapi(host).disableHost(host._xapiId)

disable.description = 'disable to create VM on the hsot'

disable.params = {
  id: { type: 'string' }
}

disable.resolve = {
  host: ['id', 'host', 'administrate'],
}

exports.disable = disable

#---------------------------------------------------------------------
# Returns an array of missing new patches in the host
# Returns an empty array if up-to-date
# Throws an error if the host is not running the latest XS version

listMissingPatches = ({host}) ->
  return @getXapi(host).listMissingPoolPatchesOnHost(host._xapiId)

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
  return @getXapi(host).installPoolPatchOnHost(patchUuid, host._xapiId)

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
  return @getXapi(host).installAllPoolPatchesOnHost(host._xapiId)

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
  return @getXapi(host).emergencyShutdownHost(host._xapiId)

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
