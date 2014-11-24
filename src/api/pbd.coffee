{$wait} = require '../fibers-utils'

#=====================================================================

exports.delete = ({id}) ->
  try
    VBD = @getObject id, 'PBD'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI PBD

  # TODO: check if PBD is attached before
  $wait xapi.call 'PBD.destroy', PBD.ref

  return true
exports.delete.permission = 'admin'
exports.delete.params = {
  id: { type: 'string' }
}

exports.disconnect = ({id}) ->
  try
    PBD = @getObject id, 'PBD'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI PBD

  # TODO: check if PBD is attached before
  $wait xapi.call 'PBD.unplug', PBD.ref

  return true
exports.disconnect.permission = 'admin'
exports.disconnect.params = {
  id: { type: 'string' }
}

exports.connect = ({id}) ->
  try
    PBD = @getObject id, 'PBD'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI PBD

  # TODO: check if PBD is attached before
  $wait xapi.call 'PBD.plug', PBD.ref

  return true
exports.disconnect.permission = 'admin'
exports.disconnect.params = {
  id: { type: 'string' }
}
