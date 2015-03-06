# FIXME: too low level, should be removed.

{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

delete_ = $coroutine ({vbd}) ->
  xapi = @getXAPI vbd

  # TODO: check if VBD is attached before
  $wait xapi.call 'VBD.destroy', vbd.ref

  return true

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  vbd: ['id', 'VBD'],
}

exports.delete = delete_

#---------------------------------------------------------------------

disconnect = $coroutine ({vbd}) ->
  xapi = @getXAPI vbd

  # TODO: check if VBD is attached before
  $wait xapi.call 'VBD.unplug_force', vbd.ref

  return true

disconnect.params = {
  id: { type: 'string' }
}

disconnect.resolve = {
  vbd: ['id', 'VBD'],
}

exports.disconnect = disconnect

#---------------------------------------------------------------------

connect = $coroutine ({vbd}) ->
  xapi = @getXAPI vbd

  # TODO: check if VBD is attached before
  $wait xapi.call 'VBD.plug', vbd.ref

  return true

connect.params = {
  id: { type: 'string' }
}

connect.resolve = {
  vbd: ['id', 'VBD'],
}

exports.connect = connect
