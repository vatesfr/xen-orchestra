exports.set = ->
  params = @getParams {
    id: { type: 'string' }

    name_label: { type: 'string', optional: true }

    name_description: { type: 'string', optional: true }
  }

  # Current user must be an administrator.
  @checkPermission 'admin'

  try
    SR = @getObject params.id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI SR

  for param, field of {
    'name_label'
    'name_description'
  }
    continue unless param of params

    xapi.call "SR.set_#{field}", SR.ref, params[param]

exports.scan = ->
  params = @getParams {
    id: { type: 'string' }
  }

  # Current user must be an administrator.
  @checkPermission 'admin'

  try
    SR = @getObject params.id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI SR

  xapi.call "SR.scan", SR.ref
