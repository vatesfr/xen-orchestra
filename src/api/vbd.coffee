{$wait} = require '../fibers-utils'

#=====================================================================

exports.delete = ->
  params = @getParams {
    id: { type: 'string' }
  }

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

exports.disconnect = ->
  params = @getParams {
    id: { type: 'string' }
  }

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
