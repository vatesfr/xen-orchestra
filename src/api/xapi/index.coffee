$_ = require 'underscore'

#=====================================================================

# Generates method to delete objects.
do ->
  types = [
    'message'
    'task'
  ]
  $_.each types, (type) ->
    exports[type] ?= {}
    exports[type].destroy = (session, request) ->
      {id} = request.params
      @throw 'INVALID_PARAMS' unless id?

      # FIXME: For now, the current user must be an administrator, but
      # eventually, the user only need to have the “write” permission
      # over the object linked to the message or task.
      @checkPermission session, 'admin'

      # Retrieves the object.
      object = @xo.xobjs.get id
      @throw 'NO_SUCH_OBJECT' unless object?

      # Gets the corresponding connection.
      xapi = @xo.xapis[object.$pool]
      xapi.call "#{type}.destroy", object.$ref

      # Returns true.
      true
