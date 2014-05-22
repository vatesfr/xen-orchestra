{$wait} = require '../fibers-utils'

#=====================================================================

exports.set = (params) ->
  # Current user must be an administrator.
  @checkPermission 'admin'

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

  return
exports.set.params = {
  id: { type: 'string' }

  name_label: { type: 'string', optional: true }

  name_description: { type: 'string', optional: true }

  enabled: { type: 'boolean', optional: true }
}

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
exports.restart.params = {
  id: { type: 'string' }
}

exports.restart_agent = ({id}) ->
  @checkPermission 'admin'

  try
    host = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI host

  $wait xapi.call 'host.restart_agent', host.ref

  return true
exports.restart_agent.params = {
  id: { type: 'string' }
}

exports.stop = ({id}) ->
  @checkPermission 'admin'

  try
    host = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI host

  $wait xapi.call 'host.disable', host.ref
  $wait xapi.call 'host.shutdown', host.ref

  return true
exports.stop.params = {
  id: { type: 'string' }
}

exports.detach = ({id}) ->
  @checkPermission 'admin'

  try
    host = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI host

  $wait xapi.call 'pool.eject', host.ref

  return true
exports.detach.params = {
  id: { type: 'string' }
}
