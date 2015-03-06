{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

delete_ = $coroutine ({message}) ->
  xapi = @getXAPI message

  $wait xapi.call 'message.destroy', message.ref

  return true

delete_.params = {
  id: { type: 'string' },
}

delete_.resolve = {
  message: ['id', 'message']
}

exports.delete = delete_
