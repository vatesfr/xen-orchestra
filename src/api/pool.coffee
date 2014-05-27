{$wait} = require '../fibers-utils'

#=====================================================================

exports.set = ->
  try
    pool = @getObject params.id
  catch
    @throw 'NO_SUCH_OBJECT'

  xapi = @getXAPI pool

  for param, field of {
    'name_label'
    'name_description'
  }
    continue unless param of params

    $wait xapi.call "pool.set_#{field}", pool.ref, params[param]

  return true
exports.set.permission = 'admin'
exports.set.params =
  id:
    type: 'string'
  name_label:
    type: 'string'
    optional: true
  name_description:
    type: 'string'
    optional: true
