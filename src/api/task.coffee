{$wait} = require '../fibers-utils'

#=====================================================================

exports.cancel = ({id}) ->
  try
    task = @getObject id, 'task'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI task

  $wait xapi.call 'task.cancel', task.ref

  return true
exports.cancel.permission = 'admin'
exports.cancel.params = {
  id: { type: 'string' }
}
