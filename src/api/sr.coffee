{$wait} = require '../fibers-utils'

#=====================================================================

exports.set = (params) ->
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

    $wait xapi.call "SR.set_#{field}", SR.ref, params[param]

  return
exports.set.params = {
  id: { type: 'string' }

  name_label: { type: 'string', optional: true }

  name_description: { type: 'string', optional: true }
}


exports.scan = (params) ->
  # Current user must be an administrator.
  @checkPermission 'admin'

  try
    SR = @getObject params.id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI SR

  $wait xapi.call 'SR.scan', SR.ref

  return
exports.scan.params = {
  id: { type: 'string' }
}
