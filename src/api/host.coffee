{$wait} = require '../fibers-utils'

#=====================================================================

exports.set = (params) ->
  try
    host = @getObject params.id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI host

  for param, field of {
    'name_label'
    'name_description'
    'enabled'
  }
    continue unless param of params

    $wait xapi.call "host.set_#{field}", host.ref, params[param]

  return true
exports.set.permission = 'admin'
exports.set.params =
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

exports.restart = ({id}) ->
  @checkPermission 'admin'

  try
    host = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI host

  $wait xapi.call 'host.disable', host.ref
  $wait xapi.call 'host.reboot', host.ref

  return true
exports.restart.permission = 'admin'
exports.restart.params = {
  id: { type: 'string' }
}

exports.restart_agent = ({id}) ->
  try
    host = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI host

  $wait xapi.call 'host.restart_agent', host.ref

  return true
exports.restart_agent.permission = 'admin'
exports.restart_agent.params = {
  id: { type: 'string' }
}

exports.stop = ({id}) ->
  try
    host = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI host

  $wait xapi.call 'host.disable', host.ref
  $wait xapi.call 'host.shutdown', host.ref

  return true
exports.stop.permission = 'admin'
exports.stop.params = {
  id: { type: 'string' }
}

exports.detach = ({id}) ->
  try
    host = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI host

  $wait xapi.call 'pool.eject', host.ref

  return true
exports.detach.permission = 'admin'
exports.detach.params = {
  id: { type: 'string' }
}
