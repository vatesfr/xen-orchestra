{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

cancel = $coroutine ({task}) ->
  xapi = @getXAPI task

  $wait xapi.call 'task.cancel', task.ref

  return true

cancel.params = {
  id: { type: 'string' },
}

cancel.resolve = {
  task: ['id', 'task', 'administrate'],
}

exports.cancel = cancel

#---------------------------------------------------------------------
destroy = $coroutine ({task}) ->
  xapi = @getXAPI task

  $wait xapi.call 'task.destroy', task.ref

  return true

destroy.params = {
  id: { type: 'string' },
}

destroy.resolve = {
  task: ['id', 'task', 'administrate'],
}

exports.destroy = destroy
