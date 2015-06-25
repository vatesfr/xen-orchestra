# FIXME: rename to disk.*

$isArray = require 'lodash.isarray'
{coroutine: $coroutine} = require 'bluebird'

{InvalidParameters} = require '../api-errors'
{parseSize} = require '../utils'

#=====================================================================

delete_ = $coroutine ({vdi}) ->
  yield @getXAPI(vdi).deleteVdi(vdi.id)

  return

delete_.params = {
  id: { type: 'string' },
}

delete_.resolve = {
  vdi: ['id', 'VDI', 'administrate'],
}

exports.delete = delete_

#---------------------------------------------------------------------

# FIXME: human readable strings should be handled.
set = $coroutine (params) ->
  {vdi} = params
  xapi = @getXAPI vdi

  {ref} = vdi

  # Size.
  if 'size' of params
    size = parseSize(params.size)

    if size < vdi.size
      throw new InvalidParameters(
        "cannot set new size (#{size}) below the current size (#{vdi.size})"
      )

    yield xapi.call 'VDI.resize_online', ref, "#{size}"

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
  vdi: ['id', 'VDI', 'administrate'],
}

exports.set = set

#---------------------------------------------------------------------

migrate = $coroutine ({vdi, sr}) ->
  xapi = @getXAPI vdi

  # TODO: check if VDI is attached before
  yield xapi.call 'VDI.pool_migrate', vdi.ref, sr.ref, {}

  return true

migrate.params = {
  id: { type: 'string' }
  sr_id: { type: 'string' }
}

migrate.resolve = {
  vdi: ['id', 'VDI', 'administrate'],
  sr: ['sr_id', 'SR', 'administrate'],
}

exports.migrate = migrate
