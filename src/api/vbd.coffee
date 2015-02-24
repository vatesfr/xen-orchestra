# FIXME: too low level, should be removed.

{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

exports.delete = $coroutine ({id}) ->
  try
    VBD = @getObject id, 'VBD'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VBD

  # TODO: check if VBD is attached before
  $wait xapi.call 'VBD.destroy', VBD.ref

  return true
exports.delete.permission = 'admin'
exports.delete.params = {
  id: { type: 'string' }
}

exports.disconnect = $coroutine ({id}) ->
  try
    VBD = @getObject id, 'VBD'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VBD

  # TODO: check if VBD is attached before
  $wait xapi.call 'VBD.unplug_force', VBD.ref

  return true
exports.disconnect.permission = 'admin'
exports.disconnect.params = {
  id: { type: 'string' }
}

exports.connect = $coroutine ({id}) ->
  try
    VBD = @getObject id, 'VBD'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VBD

  # TODO: check if VBD is attached before
  $wait xapi.call 'VBD.plug', VBD.ref

  return true
exports.disconnect.permission = 'admin'
exports.disconnect.params = {
  id: { type: 'string' }
}
