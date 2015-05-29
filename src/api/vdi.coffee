# FIXME: rename to disk.*

$isArray = require 'lodash.isarray'

#---------------------------------------------------------------------

{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

delete_ = $coroutine ({vdi}) ->
  xapi = @getXAPI vdi

  # TODO: check if VDI is attached before
  $wait xapi.call 'VDI.destroy', vdi.ref

  return true

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
    {size} = params

    if size < vdi.size
      @throw(
        'INVALID_SIZE'
        "cannot set new size below the current size (#{vdi.size})"
      )

    $wait xapi.call 'VDI.resize_online', ref, "#{size}"

  # Other fields.
  for param, fields of {
    'name_label'
    'name_description'
  }
    continue unless param of params

    for field in (if $isArray fields then fields else [fields])
      $wait xapi.call "VDI.set_#{field}", ref, "#{params[param]}"

  return true

set.params = {
  # Identifier of the VDI to update.
  id: { type: 'string' }

  name_label: { type: 'string', optional: true }

  name_description: { type: 'string', optional: true }

  # size of VDI
  size: { type: 'integer', optional: true }
}

set.resolve = {
  vdi: ['id', 'VDI', 'administrate'],
}

exports.set = set

#---------------------------------------------------------------------

migrate = $coroutine ({vdi, sr}) ->
  xapi = @getXAPI vdi

  # TODO: check if VDI is attached before
  $wait xapi.call 'VDI.pool_migrate', vdi.ref, sr.ref, {}

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
