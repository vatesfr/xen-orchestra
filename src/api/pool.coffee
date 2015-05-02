$debug = (require 'debug') 'xo:api:vm'
{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

set = $coroutine (params) ->
  {pool} = params
  xapi = @getXAPI pool

  for param, field of {
    'name_label'
    'name_description'
  }
    continue unless param of params

    $wait xapi.call "pool.set_#{field}", pool.ref, params[param]

  return true

set.params = {
  id: {
    type: 'string',
  },
  name_label: {
    type: 'string',
    optional: true,
  },
  name_description: {
    type: 'string',
    optional: true,
  },
}

set.resolve = {
  pool: ['id', 'pool'],
}

exports.set = set

#---------------------------------------------------------------------
# Upload a patch and apply it
# If host is given, only apply to a host and not the whole pool

# FIXME
patch = $coroutine ({pool, host}) ->
  xapi = @getXAPI pool

  taskRef = $wait xapi.call 'task.create', 'Patch upload from XO', ''
  @watchTask taskRef
    .then $coroutine (patchRef) ->
      $debug 'Patch upload succeeded'
      if not host
        xapi.call 'pool_patch.pool_apply', patchRef
      else
        host = @getObject host
        xapi.call 'pool_patch.apply', patchRef, host.ref
      return
    .catch (error) ->
      $debug 'Patch upload failed: %j', error
      return
    .finally $coroutine ->
      xapi.call 'task.destroy', taskRef
      return

  if not host
    host = @getObject pool.master, 'host'

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

patch.params = {
  pool: { type: 'string' },
  host: { type: 'string', optional: true },
}

patch.resolve = {
  pool: ['pool', 'pool'],
}

exports.patch = patch
