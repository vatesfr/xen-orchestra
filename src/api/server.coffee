{$coroutine, $wait} = require '../fibers-utils'

#=====================================================================

# FIXME: We are storing passwords which is bad!
#        Could we use tokens instead?

# Adds a new server.
exports.add = $coroutine ({host, username, password}) ->
  server = $wait @servers.add {
    host
    username
    password
  }

  return server.id
exports.add.description = 'Add a new Xen server to XO'
exports.add.permission = 'admin'
exports.add.params =
  host:
    type: 'string'
  username:
    type: 'string'
  password:
    type: 'string'

# Removes an existing server.
exports.remove = $coroutine ({id}) ->
  # Throws an error if the server did not exist.
  @throw 'NO_SUCH_OBJECT' unless $wait @servers.remove id

  return true
exports.remove.permission = 'admin'
exports.remove.params =
  id:
    type: 'string'

# Returns all servers.
exports.getAll = $coroutine ->
  # Retrieves the servers.
  servers = $wait @servers.get()

  # Filters out private properties.
  for server, i in servers
    servers[i] = @getServerPublicProperties server

  return servers
exports.getAll.permission = 'admin'

# Changes the properties of an existing server.
exports.set = $coroutine ({id, host, username, password}) ->
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

  return true
exports.set.permission = 'admin'
exports.set.params =
  id:
    type: 'string'
  host:
    type: 'string'
    optional: true
  username:
    type: 'string'
    optional: true
  password:
    type: 'string'
    optional: true


# Connects to an existing server.
exports.connect = ->
  @throw 'NOT_IMPLEMENTED'

# Disconnects from an existing server.
exports.disconnect = ->
  @throw 'NOT_IMPLEMENTED'
