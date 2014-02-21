{$wait} = require '../fibers-utils'

#=====================================================================

exports.set = ->
  params = @getParams {
    id: { type: 'string' }

    name_label: { type: 'string', optional: true }

    name_description: { type: 'string', optional: true }

    enabled: { type: 'boolean', optional: true }
  }

  # Current user must be an administrator.
  @checkPermission 'admin'

  try
    host = @getObject params.id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI host

  for param, field of {
    'name_label'
    'name_description'
    'enabled'
  }
    continue unless param of params

    $wait xapi.call "host.set_#{field}", host.ref, params[param]

  return
