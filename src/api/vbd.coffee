# FIXME: too low level, should be removed.

{coroutine: $coroutine} = require 'bluebird'

#=====================================================================

delete_ = $coroutine ({vbd}) ->
  xapi = @getXAPI vbd

  # TODO: check if VBD is attached before
  yield xapi.call 'VBD.destroy', vbd.ref

  return true

delete_.params = {
  id: { type: 'string' }
}

delete_.resolve = {
  vbd: ['id', 'VBD', 'administrate'],
}

exports.delete = delete_

#---------------------------------------------------------------------

disconnect = $coroutine ({vbd}) ->
  xapi = @getXAPI vbd

  # TODO: check if VBD is attached before
  yield xapi.call 'VBD.unplug_force', vbd.ref

  return true

disconnect.params = {
  id: { type: 'string' }
}

disconnect.resolve = {
  vbd: ['id', 'VBD', 'administrate'],
}

exports.disconnect = disconnect

#---------------------------------------------------------------------

connect = $coroutine ({vbd}) ->
  xapi = @getXAPI vbd

  # TODO: check if VBD is attached before
  yield xapi.call 'VBD.plug', vbd.ref

  return true

connect.params = {
  id: { type: 'string' }
}

connect.resolve = {
  vbd: ['id', 'VBD', 'administrate'],
}

exports.connect = connect

#---------------------------------------------------------------------

set = $coroutine (params) ->
  {vbd} = params
  xapi = @getXAPI vbd

  {ref} = vbd

  # VBD position
  if 'position' of params
    yield xapi.call 'VBD.set_userdevice', ref, params.position

set.params = {
  # Identifier of the VBD to update.
  id: { type: 'string' }

  position: { type: 'string', optional: true }

}

set.resolve = {
  vbd: ['id', 'VBD', 'administrate'],
}

exports.set = set
