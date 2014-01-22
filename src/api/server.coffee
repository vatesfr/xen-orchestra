{$wait} = require '../fibers-utils'

#=====================================================================

# FIXME: We are storing passwords which is bad!
#        Could we use tokens instead?

# Adds a new server.
exports.add = ->
  {host, username, password} = @getParams {
    host: { type: 'string' }
    username: { type: 'string' }
    password: { type: 'string' }
  }

  # Current user must be administrator.
  @checkPermission 'admin'

  # Adds the server.
  server = $wait @servers.add {
    host
    username
    password
  }

  # Returns the identifier of the newly registered server.
  server.id

# Removes an existing server.
exports.remove = ->
  {id} = @getParams {
    id: { type: 'string' }
  }

  # Current user must be administrator.
  @checkPermission 'admin'

  # Throws an error if the server did not exist.
  @throw 'NO_SUCH_OBJECT' unless $wait @servers.remove id

  # Returns true.
  true

# Returns all servers.
exports.getAll = ->
  # Only an administrator can see all servers.
  @checkPermission 'admin'

  # Retrieves the servers.
  servers = $wait @servers.get()

  # Filters out private properties.
  for server, i in servers
    servers[i] = @getServerPublicProperties server

  # Returns the servers.
  servers

# Changes the properties of an existing server.
exports.set = ->
  {id, host, username, password} = @getParams {
    id: { type: 'string' }
    host: { type: 'string', optional: true }
    username: { type: 'string', optional: true }
    password: { type: 'string', optional: true }
  }

  # Only an administrator can modify an server.
  @checkPermission 'admin'

  # Retrieves the server.
  server = $wait @servers.first id

  # Throws an error if it did not exist.
  @throw 'NO_SUCH_OBJECT' unless server

  # Updates the provided properties.
  server.set {host} if host?
  server.set {username} if username?
  server.set {password} if password?

  # Updates the server.
  $wait @servers.update server

  # Returns true.
  true

# Connects to an existing server.
exports.connect = ->
  @throw 'NOT_IMPLEMENTED'

# Disconnects from an existing server.
exports.disconnect = ->
  @throw 'NOT_IMPLEMENTED'
