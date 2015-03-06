{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

delete_ = $coroutine ({vif}) ->
  xapi = @getXAPI vif

  # TODO: check if VIF is attached before
  $wait xapi.call 'VIF.destroy', vif.ref

  return true

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  vif: ['id', 'VIF']
}

exports.delete = delete_

#---------------------------------------------------------------------

disconnect = $coroutine ({vif}) ->
  xapi = @getXAPI vif

  # TODO: check if VIF is attached before
  $wait xapi.call 'VIF.unplug_force', vif.ref

  return true

disconnect.params = {
  id: { type: 'string' }
}

disconnect.resolve = {
  vif: ['id', 'VIF']
}

exports.disconnect = disconnect

#---------------------------------------------------------------------

connect = $coroutine ({vif}) ->
  xapi = @getXAPI vif

  # TODO: check if VIF is attached before
  $wait xapi.call 'VIF.plug', vif.ref

  return true

connect.params = {
  id: { type: 'string' }
}

connect.resolve = {
  vif: ['id', 'VIF']
}

exports.connect = connect
