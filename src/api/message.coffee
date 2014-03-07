{$wait} = require '../fibers-utils'

#=====================================================================

exports.delete = ->
  {
    id
  } = @getParams {
    id: { type: 'string' }
  }

  # Current user must be an administrator.
  @checkPermission 'admin'

  try
    message = @getObject id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI message

  $wait xapi.call 'message.destroy', message.ref

  return true