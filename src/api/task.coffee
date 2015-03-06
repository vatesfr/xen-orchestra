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
  task: ['id', 'task'],
}

exports.cancel = cancel
