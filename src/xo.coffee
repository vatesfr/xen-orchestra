# Cryptographic tools.
$crypto = require 'crypto'

#---------------------------------------------------------------------

# Low level tools.
$_ = require 'underscore'

# Password hasing.
$hashy = require 'hashy'

# Async code is easier with fibers (light threads)!
$fiber = require 'fibers'

# Redis.
$createRedisClient = (require 'then-redis').createClient

#---------------------------------------------------------------------

# A mapped collection is generated from another collection through a
# specification.
$MappedCollection = require './MappedCollection'

# Collection where models are stored in memory.
$MemoryCollection = require './collection/memory'

# Collection where models are stored in a Redis DB.
$RedisCollection = require './collection/redis'

# Base class for a model.
$Model = require './model'

# Connection to XAPI.
$XAPI = require './xapi'

# Helpers for dealing with fibers.
{$fiberize, $synchronize, $waitForPromise} = require './fibers-utils'

#=====================================================================

$randomBytes = $synchronize $crypto.randomBytes

#=====================================================================
# Models and collections.

class Server extends $Model
  validate: -> # TODO

class Servers extends $RedisCollection
  model: Server

#---------------------------------------------------------------------

class Token extends $Model
  @generate: (userId) ->
    new Token {
      id: ($randomBytes 32).toString 'base64'
      user_id: userId
    }

  validate: -> # TODO

class Tokens extends $RedisCollection
  model: Token

#---------------------------------------------------------------------

class User extends $Model
  default: {
    permission: 'none'
  }

  validate: -> # TODO

  setPassword: (password) ->
    @set 'password', $waitForPromise ($hashy.hash password)

  # Checks the password and updates the hash if necessary.
  checkPassword: (password) ->
    hash = @get 'hash'

    unless $waitForPromise ($hashy.verify password, hash)
      return false

    if $waitForPromise ($hashy.needsRehash hash)
      @setPassword password

    true

  hasPermission: (permission) ->
    perms = {
      none: 0
      read: 1
      write: 2
      admin: 3
    }

    perms[@get 'permission'] => perms[permission]

class Users extends $RedisCollection
  model: User

  create: (email, password, permission) ->
    user = new User {
      email: email
    }
    user.setPassword password
    user.set 'permission', permission unless permission is undefined

    @add user

#=====================================================================

class XO

  start: (config) ->
    # Connects to Redis.
    redis = $createRedisClient config.redis.uri

    # Creates persistent collections.
    @servers = new Servers {
      connection: redis
      prefix: 'xo:server'
      indexes: ['host']
    }
    @tokens = new Tokens {
      connection: redis
      prefix: 'xo:token'
      indexes: ['host']
    }
    @users = new Users {
      connection: redis
      prefix: 'xo:user'
      indexes: ['host']
    }

    # Proxies tokens/users related events to XO and removes tokens
    # when their related user is removed.
    @tokens.on 'remove', (ids) =>
      @emit "token.revoked:#{id}" for id in ids
    @users.on 'remove', (ids) =>
      @emit "user.revoked:#{id}" for id in ids
      tokens = @tokens.get {user_id: id}
      @token.remove (token.id for token in tokens)

    # Collections of XAPI objects mapped to XO API.
    refsToUUIDs = { # Needed for the mapping.
      'OpaqueRef:NULL': null
    }
    @xobjs = do ->
      spec = (require './spec') refsToUUIDs

      new $MappedCollection spec

    # XAPI connections.
    @xapis = {}

    # This function asynchroneously connects to a server, retrieves
    # all its objects and monitors events.
    connect = $fiberize (server) =>
      # Identifier of the connection.
      id = server.id

      # UUID of the pool of this connection.
      poolUUID = undefined

      xapi = @xapis[id] = new $XAPI {
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

      # This helper normalizes a record by inserting its type and by
      # storing its UUID in the `refsToUUIDs` map if any.
      normalizeObject = (object, ref, type) ->
        refsToUUIDs[ref] = object.uuid if object.uuid?
        object.$pool = poolUUID unless type is 'pool'
        object.$type = type

      objects = {}

      # Then retrieve the pool.
      pools = xapi.call 'pool.get_all_records'

      # Gets the first pool and ensures it is the only one.
      ref = pool = null
      for ref of pools
        throw 'more than one pool!' if pool?
        pool = pools[ref]
      throw 'no pool found' unless pool?

      # Remembers its UUID.
      poolUUID = pool.uuid


      # Normalizes the records.
      normalizeObject pool, ref, 'pool'

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
      @xobjs.set objects, {
        add: true
        update: false
        remove: false
      }

      # Finaly, monitors events.
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

              # Adds the object to the corresponding list (and ensures
              # it is not in the other).
              if operation is 'del'
                delete updatedObjects[ref]
                removedObjects[ref] = object
              else
                delete removedObjects[ref]
                updatedObjects[ref] = object

            # Records the changes.
            @xobjs.remove removedObjects
            @xobjs.set updatedObjects, {
              add: true
              update: true
              remove: false
            }
        catch error
          # The error rethrown unless it is `SESSION_NOT_REGISTERED`
          # in which case the session will be registered again.
          throw error unless error[0] is 'SESSION_NOT_REGISTERED'

    # Connects to existing servers.
    connect server for server in $waitForPromise @servers.get()

    # Automatically connects to new servers.
    @servers.on 'add', (servers) ->
      connect server for server in @servers

    # TODO: Automaticall disconnects from removed servers.

#=====================================================================

module.exports = XO
