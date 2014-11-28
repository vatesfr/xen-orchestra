$debug = (require 'debug') 'xo:api:vm'
{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

exports.set = (params) ->
  try
    pool = @getObject params.id, 'pool'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI pool

  for param, field of {
    'name_label'
    'name_description'
  }
    continue unless param of params

    $wait xapi.call "pool.set_#{field}", pool.ref, params[param]

  return true
exports.set.permission = 'admin'
exports.set.params =
  id:
    type: 'string'
  name_label:
    type: 'string'
    optional: true
  name_description:
    type: 'string'
    optional: true

# FIXME
exports.patch = ({pool}) ->
  try
    pool = @getObject pool, 'pool'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI pool
  host = @getObject pool.master, 'host'

  taskRef = $wait xapi.call 'task.create', 'Patch upload from XO', ''
  @watchTask taskRef
    .then $coroutine (patchRef) ->
      $debug 'Patch upload succeeded'
      xapi.call 'pool_patch.pool_apply', patchRef
      return
    .catch (error) ->
      $debug 'Patch upload failed: %j', error
      return
    .finally $coroutine ->
      xapi.call 'task.destroy', taskRef
      return

  url = $wait @registerProxyRequest {
    # Receive a POST but send a PUT.
    method: 'put'
    proxyMethod: 'post'
    hostname: host.address
    pathname: '/pool_patch_upload'
    query: {
      session_id: xapi.sessionId
      task_id: taskRef
    }
  }

  return {
    $sendTo: url
  }
exports.patch.permission = 'admin'
exports.patch.params = {
  pool: { type: 'string' }
}
