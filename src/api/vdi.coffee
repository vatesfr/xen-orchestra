exports.delete = ->
  params = @getParams {
    id: { type: 'string' }
  }

  # Current user must be an administrator.
  @checkPermission 'admin'

  try
    VDI = @getObject params.id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI VDI

  # TODO: check if VDI is attached before
  xapi.call "VDI.destroy", VDI.ref
