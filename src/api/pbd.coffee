# FIXME: too low level, should be removed.

{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================
# Delete

exports.delete = $coroutine ({PBD}) ->
  xapi = @getXAPI PBD

  # TODO: check if PBD is attached before
  $wait xapi.call 'PBD.destroy', PBD.ref

  return true
exports.delete.params = {
  id: { type: 'string' }
}
exports.delete.resolve = {
  PBD: ['id', 'PBD']
}

#=====================================================================
# Disconnect

exports.disconnect = $coroutine ({PBD}) ->
  xapi = @getXAPI PBD

  # TODO: check if PBD is attached before
  $wait xapi.call 'PBD.unplug', PBD.ref

  return true
exports.disconnect.params = {
  id: { type: 'string' }
}
exports.disconnect.resolve = {
  PBD: ['id', 'PBD']
}

#=====================================================================
# Connect

exports.connect = $coroutine ({PBD}) ->
  xapi = @getXAPI PBD

  # TODO: check if PBD is attached before
  $wait xapi.call 'PBD.plug', PBD.ref

  return true
exports.connect.params = {
  id: { type: 'string' }
}
exports.connect.resolve = {
  PBD: ['id', 'PBD']
}
