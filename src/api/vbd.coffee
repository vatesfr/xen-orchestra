{$wait} = require '../fibers-utils'

#=====================================================================

exports.delete = ({id}) ->
  # Current user must be an administrator.
  @checkPermission 'admin'

  try
    VBD = @getObject params.id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VBD

  # TODO: check if VBD is attached before
  $wait xapi.call "VBD.destroy", VBD.ref

  return
exports.delete.params = {
  id: { type: 'string' }
}

exports.disconnect = ({id}) ->
  # Current user must be an administrator.
  @checkPermission 'admin'

  try
    VBD = @getObject params.id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VBD

  # TODO: check if VBD is attached before
  $wait xapi.call "VBD.unplug_force", VBD.ref

  return
exports.disconnect.params = {
  id: { type: 'string' }
}
