{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

exports.delete = $coroutine ({id}) ->
  try
    VIF = @getObject id, 'VIF'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VIF

  # TODO: check if VIF is attached before
  $wait xapi.call 'VIF.destroy', VIF.ref

  return true
exports.delete.permission = 'admin'
exports.delete.params = {
  id: { type: 'string' }
}

exports.disconnect = $coroutine ({id}) ->
  try
    VIF = @getObject id, 'VIF'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VIF

  # TODO: check if VIF is attached before
  $wait xapi.call 'VIF.unplug_force', VIF.ref

  return true
exports.disconnect.permission = 'admin'
exports.disconnect.params = {
  id: { type: 'string' }
}

exports.connect = $coroutine ({id}) ->
  try
    VIF = @getObject id, 'VIF'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VIF

  # TODO: check if VIF is attached before
  $wait xapi.call 'VIF.plug', VIF.ref

  return true
exports.disconnect.permission = 'admin'
exports.disconnect.params = {
  id: { type: 'string' }
}
