$_ = require 'underscore'

#=====================================================================

# Definitions of the methods to generate.
defs = {
  pause: {}

  # TODO: If XS tools are unavailable, do a hard reboot.
  reboot: 'clean_reboot'

  # TODO: If XS tools are unavailable, do a hard shutdown.
  shutdown: 'clean_shutdown'

  start: [
    false # Start paused?
    false # Skip the pre-boot checks?
  ]

  unpause: {}
}

#=====================================================================

# We are generating methods in the `xapi.vm` namespace.
vm = exports.vm = {}

$_.each defs, (def, name) ->
  method = name
  params = []

  if $_.isString def
    method = def
  else if $_.isArray def
    params = def
  else if $_.isObject def
    method = def.method if def.method?
    params = def.params if def.params?

  vm[name] = (session, req) ->

    # This method expect to the VM's UUID.
    {id} = req.params.id
    @throw 'INVALID_PARAMS' unless id?

    # The current session MUST have the `write`
    # permission.
    @checkPermission session, 'write'

    # Retrieves the VM with this UUID.
    vm = @xo.xobjs.get id
    @throw 'NO_SUCH_OBJECT' unless vm?

    # Gets the corresponding connection.
    xapi = @xo.xapis[vm.$pool]
    xapi.call.apply xapi, ["VM.#{method}", vm.$ref].concat params

    # Returns true.
    true
