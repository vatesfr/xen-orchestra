{$coroutine, $wait} = require '../fibers-utils'
$request = require('bluebird').promisify(require('request'))
{parseXml} = require '../utils'
$forEach = require 'lodash.foreach'
$find = require 'lodash.find'

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
  host: ['id', 'host'],
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
  host: ['id', 'host'],
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
  host: ['id', 'host'],
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
  host: ['id', 'host'],
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
  host: ['id', 'host'],
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
  host: ['id', 'host'],
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
  host: ['id', 'host'],
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
  host: ['id', 'host'],
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
  host: ['host', 'host'],
}
createNetwork.permission = 'admin'
exports.createNetwork = createNetwork

#---------------------------------------------------------------------
# Returns an array of missing new patches in the host
# Returns an empty array if up-to-date
# Throws an error if the host is not running the latest XS version

listMissingPatches = $coroutine ({host}) ->
  return @getXAPI(host).listMissingHostPatches(host)

listMissingPatches.params = {
  id: { type: 'string' }
}

listMissingPatches.resolve = {
  host: ['id', 'host'],
}

exports.listMissingPatches = listMissingPatches;
