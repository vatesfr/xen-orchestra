{$wait} = require '../fibers-utils'

#=====================================================================

exports.delete = ({id}) ->
  try
    PIF = @getObject id, 'PIF'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI PIF

  # TODO: check if PIF is attached before
  $wait xapi.call 'PIF.destroy', PIF.ref

  return true
exports.delete.permission = 'admin'
exports.delete.params = {
  id: { type: 'string' }
}

exports.disconnect = ({id}) ->
  try
    PIF = @getObject id, 'PIF'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI PIF

  # TODO: check if PIF is attached before
  $wait xapi.call 'PIF.unplug', PIF.ref

  return true
exports.disconnect.permission = 'admin'
exports.disconnect.params = {
  id: { type: 'string' }
}

exports.connect = ({id}) ->
  try
    PIF = @getObject id, 'PIF'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI PIF

  # TODO: check if PIF is attached before
  $wait xapi.call 'PIF.plug', PIF.ref

  return true
exports.disconnect.permission = 'admin'
exports.disconnect.params = {
  id: { type: 'string' }
}
