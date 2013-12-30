{$waitPromise} = require '../fibers-utils'

#=====================================================================

# FIXME: We are storing passwords which is bad!
#        Could we use tokens instead?

# Adds a new server.
exports.add = (session, request) ->
  {host, username, password} = request.params
  @throw 'INVALID_PARAMS' unless host? and username? and password?

  # Current user must be administrator.
  @checkPermission session, 'admin'

  # Adds the server.
  server = $waitPromise @xo.servers.add {
    host
    username
    password
  }

  # Returns the identifier of the newly registered server.
  server.id

# Removes an existing server.
exports.remove = (session, request) ->
  {id} = request.params
  @throw 'INVALID_PARAMS' unless id?

  # Current user must be administrator.
  @checkPermission session, 'admin'

  # Throws an error if the server did not exist.
  @throw 'NO_SUCH_OBJECT' unless $waitPromise @xo.servers.remove id

  # Returns true.
  true

# Returns all servers.
exports.getAll = (session) ->
  # Only an administrator can see all servers.
  @checkPermission session, 'admin'

  # Retrieves the servers.
  servers = $waitPromise @xo.servers.get()

  # Filters out private properties.
  for server, i in servers
    servers[i] = @getServerPublicProperties server

  # Returns the servers.
  servers

# Changes the properties of an existing server.
exports.set = (session, request) ->
  {id, host, username, password} = request.params
  @throw 'INVALID_PARAMS' unless id? and (host? or username? or password?)

  # Only an administrator can modify an server.
  @checkPermission session, 'admin'

  # Retrieves the server.
  server = $waitPromise @xo.servers.first id

  # Throws an error if it did not exist.
  @throw 'NO_SUCH_OBJECT' unless server

  # Updates the provided properties.
  server.set {host} if host?
  server.set {username} if username?
  server.set {password} if password?

  # Updates the server.
  $waitPromise @xo.servers.update server

  # Returns true.
  true

# Connects to an existing server.
exports.connect = ->
  @throw 'NOT_IMPLEMENTED'

# Disconnects from an existing server.
exports.disconnect = ->
  @throw 'NOT_IMPLEMENTED'
