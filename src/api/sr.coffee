{$wait} = require '../fibers-utils'

#=====================================================================

exports.set = (params) ->
  try
    SR = @getObject params.id, 'SR'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI SR

  for param, field of {
    'name_label'
    'name_description'
  }
    continue unless param of params

    $wait xapi.call "SR.set_#{field}", SR.ref, params[param]

  return true
exports.set.permission = 'admin'
exports.set.params = {
  id: { type: 'string' }

  name_label: { type: 'string', optional: true }

  name_description: { type: 'string', optional: true }
}


exports.scan = ({id}) ->
  try
    SR = @getObject id, 'SR'
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI SR

  $wait xapi.call 'SR.scan', SR.ref

  return true
exports.scan.permission = 'admin'
exports.scan.params = {
  id: { type: 'string' }
}
