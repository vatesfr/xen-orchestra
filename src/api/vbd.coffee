# FIXME: too low level, should be removed.

{coroutine: $coroutine} = require 'bluebird'

#=====================================================================

delete_ = $coroutine ({vbd}) ->
  xapi = @getXapi vbd

  # TODO: check if VBD is attached before
  yield xapi.call 'VBD.destroy', vbd._xapiRef

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
  xapi = @getXapi vbd
  yield xapi.disconnectVbd(vbd._xapiRef)
  return

disconnect.params = {
  id: { type: 'string' }
}

disconnect.resolve = {
  vbd: ['id', 'VBD', 'administrate'],
}

exports.disconnect = disconnect

#---------------------------------------------------------------------

connect = $coroutine ({vbd}) ->
  xapi = @getXapi vbd
  yield xapi.connectVbd(vbd._xapiRef)
  return

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
  xapi = @getXapi vbd

  { _xapiRef: ref } = vbd

  # VBD position
  if 'position' of params
    yield xapi.call 'VBD.set_userdevice', ref, String(params.position)

set.params = {
  # Identifier of the VBD to update.
  id: { type: 'string' }

  position: { type: ['string', 'number'], optional: true }

}

set.resolve = {
  vbd: ['id', 'VBD', 'administrate'],
}

exports.set = set

#---------------------------------------------------------------------

setBootable = $coroutine ({vbd, bootable}) ->
  xapi = @getXapi vbd
  { _xapiRef: ref } = vbd

  yield xapi.call 'VBD.set_bootable', ref, bootable
  return

setBootable.params = {
  vbd: { type: 'string' }
  bootable: { type: 'boolean' }
}

setBootable.resolve = {
  vbd: ['vbd', 'VBD', 'administrate'],
}

exports.setBootable = setBootable

#=====================================================================

Object.defineProperty(exports, '__esModule', {
  value: true
})
