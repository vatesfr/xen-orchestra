$_ = require 'underscore'

{$wait} = require '../../fibers-utils'

#=====================================================================

# Generates method to delete objects.
do ->
  types = [
    'message'
    'task'
  ]
  $_.each types, (type) ->
    exports[type] ?= {}
    exports[type].destroy = ->
      {id} = @getParams {
        id: { type: 'string' }
      }

      # FIXME: For now, the current user must be an administrator, but
      # eventually, the user only need to have the “write” permission
      # over the object linked to the message or task.
      @checkPermission 'admin'

      # Retrieves the object.
      object = @xobjs.get id
      @throw 'NO_SUCH_OBJECT' unless object?

      # Gets the corresponding connection.
      xapi = @xapis[object.$pool]
      $wait xapi.call "#{type}.destroy", object.$ref

      return true
