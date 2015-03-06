{$coroutine, $wait} = require '../fibers-utils'

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

restart = $coroutine ({id}) ->
  @checkPermission 'admin'

  try
    host = @getObject id, 'host'
  catch
    @throw 'NO_SUCH_OBJECT'

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

restartAgent = $coroutine ({id}) ->
  try
    host = @getObject id, 'host'
  catch
    @throw 'NO_SUCH_OBJECT'

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

start = $coroutine ({id}) ->
  try
    host = @getObject id, 'host'
  catch
    @throw 'NO_SUCH_OBJECT'

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

stop = $coroutine ({id}) ->
  try
    host = @getObject id, 'host'
  catch
    @throw 'NO_SUCH_OBJECT'

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

detach = $coroutine ({id}) ->
  try
    host = @getObject id, 'host'
  catch
    @throw 'NO_SUCH_OBJECT'

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

enable = $coroutine ({id}) ->
  try
    host = @getObject id, 'host'
  catch
    @throw 'NO_SUCH_OBJECT'

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

disable = $coroutine ({id}) ->
  try
    host = @getObject id, 'host'
  catch
    @throw 'NO_SUCH_OBJECT'

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
