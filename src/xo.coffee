# Cryptographic tools.
$crypto = require 'crypto'

# Events handling.
{EventEmitter: $EventEmitter} = require 'events'

#---------------------------------------------------------------------

# Low level tools.
$_ = require 'underscore'

# Password hashing.
$hashy = require 'hashy'

# Redis.
$createRedisClient = (require 'then-redis').createClient

#---------------------------------------------------------------------

# A mapped collection is generated from another collection through a
# specification.
{$MappedCollection} = require './MappedCollection'

# Collection where models are stored in a Redis DB.
$RedisCollection = require './collection/redis'

# Base class for a model.
$Model = require './model'

# Connection to XAPI.
$XAPI = require './xapi'

# Helpers for dealing with fibers.
{$fiberize, $synchronize, $wait} = require './fibers-utils'

#=====================================================================

$hash = $synchronize 'hash', $hashy

$needsRehash = $hashy.needsRehash.bind $hashy

$randomBytes = $synchronize 'randomBytes', $crypto

$verifyHash = $synchronize 'verify', $hashy

#=====================================================================
# Models and collections.

class $Server extends $Model
  validate: -> # TODO

class $Servers extends $RedisCollection
  model: $Server

#---------------------------------------------------------------------

class $Token extends $Model
  @generate: (userId) ->
    new $Token {
      id: ($randomBytes 32).toString 'base64'
      user_id: userId
    }

  validate: -> # TODO

class $Tokens extends $RedisCollection
  model: $Token

  generate: (userId) ->
    @add $Token.generate userId

#---------------------------------------------------------------------

class $User extends $Model
  default: {
    permission: 'none'
  }

  validate: -> # TODO

  setPassword: (password) ->
    @set 'pw_hash', $hash password

  # Checks the password and updates the hash if necessary.
  checkPassword: (password) ->
    hash = @get 'pw_hash'

    unless $verifyHash password, hash
      return false

    if $needsRehash hash
      @setPassword password

    true

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

  create: (email, password, permission) ->
    user = new $User {
      email: email
    }
    user.setPassword password
    user.set 'permission', permission unless permission is undefined

    @add user

#=====================================================================

class $XO extends $EventEmitter

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
    @users.on 'remove', (ids) =>
      @emit "user.revoked:#{id}" for id in ids
      tokens = @tokens.get {user_id: id}
      @tokens.remove (token.id for token in tokens)

    # Collections of XAPI objects mapped to XO API.
    @_xobjs = new $MappedCollection()
    (require './spec').call @_xobjs

    # Exports the map from UUIDs to keys.
    {$UUIDsToKeys: @_UUIDsToKeys} = (@_xobjs.get 'xo')

    # XAPI connections.
    @_xapis = Object.create null

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
        methods = xapi.call 'system.listMethods'

        types = []
        for method in methods
          [type, method] = method.split '.'
          if method is 'get_all_records' and type isnt 'pool'
            types.push type
        types

      # This helper normalizes a record by inserting its type.
      normalizeObject = (object, ref, type) ->
        object.$poolRef = poolRef unless type is 'pool'
        object.$ref = ref
        object.$type = type

      objects = {}

      # Then retrieve the pool.
      pools = xapi.call 'pool.get_all_records'

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
      for type in retrievableTypes
        try
          for ref, object of xapi.call "#{type}.get_all_records"
            normalizeObject object, ref, type

            objects[ref] = object
        catch error
          # It is possible that the method `TYPE.get_all_records` has
          # been deprecated, if that's the case, just ignores it.
          throw error unless error[0] is 'MESSAGE_REMOVED'

      # Stores all objects.
      @_xobjs.set objects, {
        add: true
        update: false
        remove: false
      }

      # Finally, monitors events.
      loop
        xapi.call 'event.register', ['*']

        try
          # Once the session is registered, just handle events.
          loop
            event = xapi.call 'event.next'

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
          if error[0] is 'EVENTS_LOST'
            # XAPI error, the program must unregister from events and then
            # register again.
            try
              xapi.call 'event.unregister', ['*']
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
  getObject: (key) ->
    # Gracefully handles UUIDs.
    if key of @_UUIDsToKeys
      key = @_UUIDsToKeys[key]

    @_xobjs.get key

  # Returns all objects.
  getObjects: ->
    @_xobjs.get()

  # Returns the XAPI connection associated to an object.
  getXAPI: (object) ->
    if $_.isString object
      object = @getObject object

    if (poolRef = object.poolRef)?
      @_xapis[poolRef]
    else
      null

#=====================================================================

module.exports = $XO
