{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

cancel = $coroutine ({id}) ->
  try
    task = @getObject id, 'task'
  catch
    @throw 'NO_SUCH_OBJECT'

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
