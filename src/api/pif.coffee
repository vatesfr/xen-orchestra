{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================
# Delete

exports.delete = $coroutine ({PIF}) ->
  xapi = @getXAPI PIF

  # TODO: check if PIF is attached before
  $wait xapi.call 'PIF.destroy', PIF.ref

  return true
exports.delete.params = {
  id: { type: 'string' }
}
exports.delete.resolve = {
  PIF: ['id', 'PIF']
}

#=====================================================================
# Disconnect

exports.disconnect = $coroutine ({PIF}) ->
  xapi = @getXAPI PIF

  # TODO: check if PIF is attached before
  $wait xapi.call 'PIF.unplug', PIF.ref

  return true
exports.disconnect.params = {
  id: { type: 'string' }
}
exports.disconnect.resolve = {
  PIF: ['id', 'PIF']
}
#=====================================================================
# Connect

exports.connect = $coroutine ({PIF}) ->
  xapi = @getXAPI PIF

  # TODO: check if PIF is attached before
  $wait xapi.call 'PIF.plug', PIF.ref

  return true
exports.connect.params = {
  id: { type: 'string' }
}
exports.connect.resolve = {
  PIF: ['id', 'PIF']
}
