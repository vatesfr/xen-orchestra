{EventEmitter: $EventEmitter} = require 'events'
{format: $formatUrl, parse: $parseUrl} = require 'url'

$Bluebird = require 'bluebird'
$contains = require 'lodash.contains'
$debug = (require 'debug') 'xo:xo'
$forEach = require 'lodash.foreach'
$isEmpty = require 'lodash.isempty'
$isString = require 'lodash.isstring'
$pluck = require 'lodash.pluck'
$Promise = require 'bluebird'
$proxyRequest = require 'proxy-http-request'
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
{$coroutine, $wait} = require './fibers-utils'
{
  generateToken: $generateToken
  multiKeyHash: $multiKeyHash
} = require './utils'
{$MappedCollection} = require './MappedCollection'

{Set, $for: {getIterator}} = (require 'babel-runtime/core-js').default

#=====================================================================
# Models and collections.

class $Acl extends $Model
  @create: (subject, object) ->
    return $Acl.hash(subject, object).then((hash) ->
      return new $Acl {
        id: hash
        subject
        object
      }
    )
  @hash: (subject, object) -> $multiKeyHash(subject, object)

class $Acls extends $RedisCollection
  Model: $Acl
  @create: (subject, object) ->
    return $Acl.create(subject, object).then((acl) => @add acl)
  @delete: (subject, object) ->
    return $Acl.hash(subject, object).then((hash) => @remove hash)

#---------------------------------------------------------------------

class $Server extends $Model
  validate: -> # TODO

class $Servers extends $RedisCollection
  Model: $Server

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
  Model: $Token

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
  setPassword: $coroutine (password) ->
    @set 'pw_hash', $wait $hash password
    return

  # Checks the password and updates the hash if necessary.
  #
  # FIXME: Async function should be explicit and return promise.
  checkPassword: $coroutine (password) ->
    hash = @get 'pw_hash'

    # There might be no hash if the user authenticate with another
    # method (e.g. LDAP).
    unless hash and $wait $verifyHash password, hash
      return false

    if $needsRehash hash
      $wait @setPassword password

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
  Model: $User

  create: $coroutine (email, password, permission) ->
    user = new $User {
      email: email
      permission: permission ? 'none'
    }

    $wait(user.setPassword password) if password?

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

    @_authenticationProviders = new Set()

    taskWatchers = @_taskWatchers = Object.create null
    @_xobjs.on 'rule=task', (event, tasks) ->
      return unless event is 'enter'

      $forEach tasks, ({val: task}) ->
        {ref} = task

        watcher = taskWatchers[ref]
        return unless watcher?

        {status} = task
        if status is 'success'
          watcher.resolve task.result
        else if status is 'failure'
          watcher.reject task.error_info
        else
          return

        delete taskWatchers[ref]

        return

      return

  start: $coroutine (config) ->
    # Connects to Redis.
    redis = $createRedisClient config.redis?.uri

    # Creates persistent collections.
    @acls = new $Acls {
      connection: redis
      prefix: 'xo:acl'
      indexes: ['subject', 'object']
    }
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
    @users.on 'remove', $coroutine (ids) =>
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
            if connection.has('user_id')
              connection.notify 'all', enterParams

        unless $isEmpty exited
          exitParams =
            type: 'exit'
            items: $pluck exited, 'val'
          for id, connection of @connections
            # Notify only authenticated clients.
            if connection.has('user_id')
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
    connect = $coroutine (server) =>
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

      $debug 'objects inserted into the database'

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
    connectSafe = $coroutine (server) ->
      try
        $wait connect server
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

    if type? and (
      ($isString type and type isnt obj.type) or
      not $contains type, obj.type # Array
    )
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

  registerProxyRequest: $coroutine (opts) ->
    url = "/#{$wait $generateToken()}"

    if $isString opts
      opts = $parseUrl opts

    opts.method = if opts.method?
      opts.method.toUpperCase()
    else
      'GET'

    if opts.proxyMethod?
      opts.proxyMethod = opts.proxyMethod.toUpperCase()

    opts.createdAt = Date.now()

    @_proxyRequests[url] = opts

    return url

  handleProxyRequest: (req, res, next) ->
    unless (
      (request = @_proxyRequests[req.url]) and
      req.method is (request.proxyMethod ? request.method)
    )
      return next()

    # A proxy request can only be used once.
    delete @_proxyRequests[req.url]

    $proxyRequest request, req, res

    res.on 'finish', request.onSuccess if request.onSuccess?

    onFailure = request.onFailure ? ( -> )
    req.on 'close', onFailure

    closeConnection = ->
      unless res.headersSent
        res.writeHead 500
      res.end()

      onFailure()

      return

    req.on 'error', (error) ->
      console.warn 'request error', error.stack ? error
      closeConnection()
      return
    res.on 'error', (error) ->
      console.warn 'response error', error.stack ? error
      closeConnection()
      return

    return

  watchTask: (ref) ->
    watcher = @_taskWatchers[ref]
    unless watcher?
      resolve = reject = null
      promise = new $Bluebird (resolve_, reject_) ->
        resolve = resolve_
        reject = reject_
        return

      # Register the watcher
      watcher = @_taskWatchers[ref] = {
        promise
        reject
        resolve
      }

      # Unregister the watcher once the promise is resolved.
      promise.finally(() =>
        delete @_taskWatchers[ref]
        return
      )

    return watcher.promise

  #-------------------------------------------------------------------

  registerAuthenticationProvider: (provider) ->
    @_authenticationProviders.add(provider)

  unregisterAuthenticationProvider: (provider) ->
    @_authenticationProviders.remove(provider)

  authenticateUser: $coroutine (credentials) ->
    # TODO: remove when email has been replaced by username
    if credentials.email?
      credentials.username = credentials.email
    else if credentials.username?
      credentials.email = credentials.username

    iterator = getIterator(@_authenticationProviders)

    while not (current = iterator.next()).done
      try
        result = $wait(current.value(credentials))
        return result if result instanceof $User

        # TODO: replace email by username
        if result.username?
          result.email = result.username
          delete result.username

        user = $wait @users.first(result)
        return user if user

        return @users.create(result.email)
      catch e
        console.error(e)
    return false

#=====================================================================

module.exports = $XO
