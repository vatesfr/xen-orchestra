{EventEmitter: $EventEmitter} = require 'events'

$Bluebird = require 'bluebird'
$debug = (require 'debug') 'xo:xo'
$forEach = require 'lodash.foreach'
$isEmpty = require 'lodash.isempty'
$isString = require 'lodash.isstring'
$pluck = require 'lodash.pluck'
$Promise = require 'bluebird'
{createClient: $createRedisClient} = require 'then-redis'
{
  hash: $hash
  needsRehash: $needsRehash
  verify: $verifyHash
} = require 'hashy'

$Connection = require './connection'
$Model = require './model'
$RedisCollection = require './collection/redis'
$spec = require './spec'
$XAPI = require './xapi'
{$coroutine, $fiberize, $wait} = require './fibers-utils'
{$generateToken} = require './utils'
{$MappedCollection} = require './MappedCollection'

#=====================================================================
# Models and collections.

class $Server extends $Model
  validate: -> # TODO

class $Servers extends $RedisCollection
  model: $Server

#---------------------------------------------------------------------

class $Token extends $Model
  @generate: (userId) ->
    return $generateToken().then (token) ->
      return new $Token {
        id: token
        user_id: userId
      }

  validate: -> # TODO

class $Tokens extends $RedisCollection
  model: $Token

  generate: (userId) ->
    return ($Token.generate userId).then (token) =>
      return @add token

#---------------------------------------------------------------------

class $User extends $Model
  default: {
    permission: 'none'
  }

  validate: -> # TODO

  # FIXME: Async function should be explicit and return promise.
  setPassword: (password) ->
    @set 'pw_hash', $wait $hash password
    return

  # Checks the password and updates the hash if necessary.
  #
  # FIXME: Async function should be explicit and return promise.
  checkPassword: (password) ->
    hash = @get 'pw_hash'

    unless $wait $verifyHash password, hash
      return false

    if $needsRehash hash
      @setPassword password

    return true

  hasPermission: (permission) ->
    perms = {
      none: 0
      read: 1
      write: 2
      admin: 3
    }

    perms[@get 'permission'] >= perms[permission]

class $Users extends $RedisCollection
  model: $User

  # FIXME: Async function should be explicit and return promise.
  create: (email, password, permission) ->
    user = new $User {
      email: email
    }
    user.setPassword password
    user.set 'permission', permission unless permission is undefined

    @add user

#=====================================================================

class $XO extends $EventEmitter

  constructor: ->
    # These will be initialized in start().
    @servers = @tokens = @users =  @_UUIDsToKeys = null

    # Connections to Xen servers/pools.
    @_xapis = Object.create null

    # Connections to users.
    @connections = Object.create null
    @_nextConId = 0

    # Collections of XAPI objects mapped to XO API.
    @_xobjs = new $MappedCollection()
    $spec.call @_xobjs

    @_proxyRequests = Object.create null

  start: (config) ->
    # Connects to Redis.
    redis = $createRedisClient config.redis.uri

    # Creates persistent collections.
    @servers = new $Servers {
      connection: redis
      prefix: 'xo:server'
      indexes: ['host']
    }
    @tokens = new $Tokens {
      connection: redis
      prefix: 'xo:token'
      indexes: ['user_id']
    }
    @users = new $Users {
      connection: redis
      prefix: 'xo:user'
      indexes: ['email']
    }

    # Proxies tokens/users related events to XO and removes tokens
    # when their related user is removed.
    @tokens.on 'remove', (ids) =>
      @emit "token.revoked:#{id}" for id in ids
    @users.on 'remove', $fiberize (ids) =>
      @emit "user.revoked:#{id}" for id in ids
      tokens = $wait @tokens.get {user_id: id}
      if tokens.length
        @tokens.remove (token.id for token in tokens)

    # When objects enter or exists, sends a notification to all
    # connected clients.
    do =>
      entered = {}
      exited = {}

      dispatcherRegistered = false
      dispatcher = =>
        unless $isEmpty entered
          enterParams =
            type: 'enter'
            items: $pluck entered, 'val'
          for id, connection of @connections
            connection.notify 'all', enterParams

        unless $isEmpty exited
          exitParams =
            type: 'exit'
            items: $pluck exited, 'val'
          for id, connection of @connections
            connection.notify 'all', exitParams
        dispatcherRegistered = false
        entered = {}
        exited = {}

      @_xobjs.on 'any', (event, items) ->
        unless dispatcherRegistered
          dispatcherRegistered = true
          process.nextTick dispatcher

        if event is 'exit'
          $forEach items, (item) ->
            {key} = item
            delete entered[key]
            exited[key] = item
            return
        else
          $forEach items, (item) ->
            {key} = item
            delete exited[key]
            entered[key] = item
            return

    # Exports the map from UUIDs to keys.
    {$UUIDsToKeys: @_UUIDsToKeys} = (@_xobjs.get 'xo')

    # This function asynchronously connects to a server, retrieves
    # all its objects and monitors events.
    connect = (server) =>
      # Identifier of the connection.
      id = server.id

      # Reference of the pool of this connection.
      poolRef = undefined

      xapi = @_xapis[id] = new $XAPI {
        host: server.host
        username: server.username
        password: server.password
      }

      # First construct the list of retrievable types. except pool
      # which will handled specifically.
      retrievableTypes = do ->
        methods = $wait xapi.call 'system.listMethods'

        $debug 'connected to %s@%s', server.username, server.host

        types = []
        for method in methods
          [type, method] = method.split '.'
          if method is 'get_all_records' and type isnt 'pool'
            types.push type

        return types

      # This helper normalizes a record by inserting its type.
      normalizeObject = (object, ref, type) ->
        object.$poolRef = poolRef
        object.$ref = ref
        object.$type = type

        return

      objects = {}

      # Then retrieve the pool.
      pools = $wait xapi.call 'pool.get_all_records'

      # Gets the first pool and ensures it is the only one.
      ref = pool = null
      for ref of pools
        throw new Error 'more than one pool!' if pool?
        pool = pools[ref]
      throw new Error 'no pool found' unless pool?

      # Remembers its reference.
      poolRef = ref

      # Makes the connection accessible through the pool reference.
      # TODO: Properly handle disconnections.
      @_xapis[poolRef] = xapi

      # Normalizes the records.
      normalizeObject pool, ref, 'pool'

      # FIXME: Remove this security flaw (currently necessary for consoles).
      pool.$sessionId = xapi.sessionId

      objects[ref] = pool

      # Then retrieve all other objects.
      n = 0
      $wait $Bluebird.map retrievableTypes, $coroutine (type) ->
        try
          for ref, object of $wait xapi.call "#{type}.get_all_records"
            normalizeObject object, ref, type

            objects[ref] = object

            n++
        catch error
          # It is possible that the method `TYPE.get_all_records` has
          # been deprecated, if that's the case, just ignores it.
          throw error unless error[0] is 'MESSAGE_REMOVED'

      $debug '%s objects fetched from %s@%s', n, server.username, server.host

      # Stores all objects.
      @_xobjs.set objects, {
        add: true
        update: false
        remove: false
      }

      $debug 'objects inserted into the database '

      # Finally, monitors events.
      #
      # TODO: maybe close events (500ms) could be merged to limit
      # CPU & network consumption.
      loop
        $wait xapi.call 'event.register', ['*']

        try
          # Once the session is registered, just handle events.
          loop
            event = $wait xapi.call 'event.next'

            updatedObjects = {}
            removedObjects = {}

            for {operation, class: type, ref, snapshot: object} in event
              # Normalizes the object.
              normalizeObject object, ref, type

              # FIXME: Remove this security flaw (currently necessary
              # for consoles).
              object.$sessionId = xapi.sessionId if type is 'pool'

              # Adds the object to the corresponding list (and ensures
              # it is not in the other).
              if operation is 'del'
                delete updatedObjects[ref]
                removedObjects[ref] = object
              else
                delete removedObjects[ref]
                updatedObjects[ref] = object

            # Records the changes.
            @_xobjs.remove removedObjects, true
            @_xobjs.set updatedObjects, {
              add: true
              update: true
              remove: false
            }
        catch error
          # FIXME: The proper approach with events loss or
          # disconnection is to redownload all objects.
          if error[0] is 'EVENTS_LOST'
            # XAPI error, the program must unregister from events and then
            # register again.
            try
              $wait xapi.call 'event.unregister', ['*']
          else
            throw error unless error[0] is 'SESSION_NOT_REGISTERED'

    # Prevents errors from stopping the server.
    connectSafe = $fiberize (server) ->
      try
        connect server
      catch error
        console.error(
          "[WARN] #{server.host}:"
          error[0] ? error.stack ? error.code ? error
        )

    # Connects to existing servers.
    connectSafe server for server in $wait @servers.get()

    # Automatically connects to new servers.
    @servers.on 'add', (servers) ->
      connectSafe server for server in servers

    # TODO: Automatically disconnects from removed servers.

  # Returns an object from its key or UUID.
  getObject: (key, type) ->
    # Gracefully handles UUIDs.
    if key of @_UUIDsToKeys
      key = @_UUIDsToKeys[key]

    obj = @_xobjs.get key

    if type? and type isnt obj.type
      throw new Error "unexpected type: got #{obj.type} instead of #{type}"

    return obj

  # Returns objects.
  getObjects: (keys) ->
    # Returns all objects if no keys are passed.
    return @_xobjs.get() unless keys

    # Resolves all UUIDs.
    {_UUIDsToKeys: UUIDsToKeys} = this
    for key, index in keys
      keys[index] = UUIDsToKeys[key] if key of UUIDsToKeys

    # Fetches all objects ignore those missing.
    return @_xobjs.get keys, true

  # Returns the XAPI connection associated to an object.
  getXAPI: (object, type) ->
    if $isString object
      object = @getObject object, type

    {poolRef} = object
    unless poolRef
      throw new Error "no XAPI found for #{object.UUID}"

    return @_xapis[poolRef]

  createUserConnection: (opts) ->
    connections = @connections

    connection = new $Connection opts
    connection.id = @_nextConId++
    connection.on 'close', -> delete connections[@id]

    connections[connection.id] = connection

    return connection

  registerProxyRequest: (opts) ->
    url = "/#{$wait $generateToken()}"

    protocol = opts.protocol ? 'http'

    @_proxyRequests[url] =
      host: opts.host
      method: opts.method ? 'get'
      port: opts.port ? if protocol is 'https' then 443 else 80
      protocol: protocol

    return url

  handleProxyRequest: (req, res, next) ->
    unless req.method is 'get' and (request = @_proxyRequests[req.url])
      return next()

    console.log request
    next()

    # TODO

    return

#=====================================================================

module.exports = $XO
