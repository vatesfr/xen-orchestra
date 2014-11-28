{$wait} = require '../fibers-utils'

#=====================================================================

exports.delete = ({id}) ->
  try
    message = @getObject id, 'message'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI message

  $wait xapi.call 'message.destroy', message.ref

  return true
exports.delete.permission = 'admin'
exports.delete.params =
  id:
    type: 'string'
