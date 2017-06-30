# FIXME: rename to disk.*

{coroutine: $coroutine} = require 'bluebird'

{format} = require 'json-rpc-peer'
{invalidParameters, unauthorized} = require 'xo-common/api-errors'
{isArray: $isArray, parseSize} = require '../utils'
{JsonRpcError} = require 'json-rpc-peer'

#=====================================================================

delete_ = $coroutine ({vdi}) ->
  yield @getXapi(vdi).deleteVdi(vdi._xapiId)

  return

delete_.params = {
  id: { type: 'string' },
}

delete_.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'administrate'],
}

exports.delete = delete_

#---------------------------------------------------------------------

# FIXME: human readable strings should be handled.
set = $coroutine (params) ->
  {vdi} = params
  xapi = @getXapi vdi
  ref = vdi._xapiRef

  # Size.
  if 'size' of params
    size = parseSize(params.size)

    if size < vdi.size
      throw invalidParameters(
        "cannot set new size (#{size}) below the current size (#{vdi.size})"
      )

    vbds = vdi.$VBDs
    if (
      vbds.length == 1 &&
      (resourceSetId = xapi.xo.getData(@getObject(vbds[0], 'VBD'), 'resourceSet')) != undefined
    )
      if @user.permission != 'admin'
        yield @checkResourceSetConstraints(resourceSetId, @user.id)

      yield @allocateLimitsInResourceSet({ disk: size - vdi.size }, resourceSetId)
    else if !(
      @user.permission == 'admin' ||
      yield @hasPermissions(@user.id, [ [ vdi.$SR, 'operate' ] ])
    )
      throw unauthorized()

    yield xapi.resizeVdi(ref, size)

  # Other fields.
  for param, fields of {
    'name_label'
    'name_description'
  }
    continue unless param of params

    for field in (if $isArray fields then fields else [fields])
      yield xapi.call "VDI.set_#{field}", ref, "#{params[param]}"

  return true

set.params = {
  # Identifier of the VDI to update.
  id: { type: 'string' }

  name_label: { type: 'string', optional: true }

  name_description: { type: 'string', optional: true }

  # size of VDI
  size: { type: ['integer', 'string'], optional: true }
}

set.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'administrate'],
}

exports.set = set

#---------------------------------------------------------------------

migrate = $coroutine ({vdi, sr}) ->
  xapi = @getXapi vdi

  yield xapi.moveVdi(vdi._xapiRef, sr._xapiRef)

  return true

migrate.params = {
  id: { type: 'string' }
  sr_id: { type: 'string' }
}

migrate.resolve = {
  vdi: ['id', ['VDI', 'VDI-snapshot'], 'administrate'],
  sr: ['sr_id', 'SR', 'administrate'],
}

exports.migrate = migrate

#=====================================================================

Object.defineProperty(exports, '__esModule', {
  value: true
})
