angular.module('xoWebApp')

  .service 'notify', (toaster) ->
    notifier = (level) ->
      (options) ->
        if angular.isString options
          options = { message: options }

        throw new Error 'missing message' unless options.message

        toaster.pop(
          level
          options.title ? 'Xen-Orchestra'
          options.message
        )

    {
      warning: notifier 'warning'
      error: notifier 'error'
      info: notifier 'info'

      # TODO: It is probably a bad design to have notification for
      # successful operations.
      # success: notifier 'success'
    }

  # This service provides an access to the Xen-Orchestra API.
  .service 'xoApi', ($location, $q, notify) ->
    url = do ->
      # Note: The path is ignored, the WebSocket must be relative to
      # root.
      protocol = if $location.protocol() is 'https:' then 'wss:' else 'ws:'
      host = $location.host()
      port = $location.port()

      "#{protocol}//#{host}:#{port}/api/"

    # Redefine the URl for testing purpose.
    url = 'ws://localhost:8080/api/'

    # Identifier of the next request.
    nextId = 0

    # Promises linked to the requests.
    deferreds = {}

    # When the socket is closed, request are enqueued.
    queue = []

    # Variable which will contains the webSocket to use.
    socket = null

    # Function used to send requests when the socket is opened.
    send = (method, params, deferred) ->
      id = nextId++
      socket.send JSON.stringify(
        jsonrpc: '2.0'
        id: id
        method: method
        params: params or []
      )
      deferreds[id] = deferred or $q.defer()
      deferreds[id].promise

    # Function used to enqueue requests when the socket is closed.
    enqueue = (method, params) ->
      deferred = $q.defer()
      queue.push [method, params, deferred]

      # If not yet connected, starts the connection.
      connect() unless socket?

      deferred.promise

    # This variable contains the function which be called (initially
    # it will points to `enqueue`).
    call = enqueue

    # Disconnection.
    disconnect = ->
      socket = null
      call = enqueue

    # Connection.
    connect = ->
      # Creation of the WebSocket.
      socket = new WebSocket url

      # When the WebSocket opens, send any requests enqueued.
      socket.addEventListener 'open', ->
        # New requests are sent directly.
        call = send

        while (query = queue.shift())?
          send query[0], query[1], query[2]

      # When the WebSocket closes, requests are no longer sent directly
      # but enqueued.
      socket.addEventListener 'close', ->
        call = enqueue

      # When a message is received, we call the corresponding
      # deferred (if any).
      socket.addEventListener 'message', (event) ->
        response = JSON.parse event.data
        id = response.id
        deferred = deferreds[id]
        delete deferreds[id]

        error = response.error
        unless error is undefined
          deferred.reject error
          return

        result = response.result
        if result is undefined
          console.error 'invalid message received', response
          deferred.reject {
            message: message
            object: response
          }
          return

        deferred.resolve result

      # @todo What to do if there is an error in the WebSocket.
      socket.addEventListener 'error', (error) ->
        notify.error {
          title: 'Connection to XO-Server'
          message: 'The connection with XO-Server has been lost'
        }

        console.error error

        disconnect()

    {
      call: (method, params) -> call method, params
      disconnect: disconnect
    }

  # This service provides session management and inject the `user`
  # into the `$rootScope`.
  .service 'session', ($cookieStore, xoApi, notify) ->
    session = {
      user: null

      logIn: (email, password, persist) ->
        xoApi.call(
          'session.signInWithPassword'
          {email, password}
        ).then (user) ->
          session.user = user

          if persist
            xoApi.call('token.create').then (token) ->
              $cookieStore.put 'token', token
        .catch (error) ->
          notify.warning {
            title: 'Authentication failed'
            message: error.message
          }

      logOut: ->
        xoApi.disconnect()
        session.user = null
        $cookieStore.remove 'token'
    }

    # If there is a token, try to sign in automatically.
    if (token = $cookieStore.get 'token')
      xoApi.call(
        'session.signInWithToken'
        {token}
      ).then (user) ->
        session.user = user
      .catch ->
        # The authentication failed, removes the token.
        $cookieStore.remove 'token'

    # Exposes the session object.
    session

  # This service provides access to XO objects.
  #
  # Deprecated: use the service `xo` instead.
  .service 'xoObjects', ($timeout, xoApi) ->
    byRefs = Object.create null
    byUUIDs = Object.create null
    {
      all
      byTypes
    } = xoObjects = {
      revision: 0
      all: []
      byTypes: Object.create null

      get: (key) ->
        if angular.isArray key
          item for item in key when (item = byUUIDs[item] ? byRefs[item])
        else
          byUUIDs[key] ? byRefs[key]
    }

    do helper = ->
      xoApi.call('xo.getAllObjects').then (objects) ->
        # Empty collections.
        delete byTypes[key] for key of byTypes
        byRefs = Object.create null
        byUUIDs = Object.create null

        all = objects
        for object in all
          byUUIDs[object.UUID] = object if object.UUID?
          byRefs[object.ref] = object if object.ref?
          (byTypes[object.type] ?= []).push object

        ++xoObjects.revision

        # Fetches objects again after 5 seconds.
        $timeout helper, 5e3, false

    xoObjects

  .service 'xo', (xoObjects, xoApi, notify) ->
    action = (name, method, options) ->
      unless method
        return ->
          notify.info {
            title: name
            message: 'This feature has not been implemented yet.'
          }

      {argsMapper, notification} = options ? {}

      argsMapper ?= (id) -> {id}

      (args...) ->
        xoApi.call(
          method
          argsMapper args...
        ).catch (error) ->
          unless notification is false
            code = error?.code
            message = if code is 2
              'You don\'t have the permission.'
            else
              'The action failed for unknown reason.'

            notify.warning {
              title: name
              message
            }

          console.error error

          # Re-throws the error to make it available in the promise
          # chain.
          throw error

    # The interface.
    xo = {
      objects: xoObjects.all
      byTypes: xoObjects.byTypes
      # revision: xoObjects.revision # Implemented below as a getter.

      get: xoObjects.get

      host: {
        detach: action 'Detach host', 'host.detach'
        restart: action 'Restart host', 'host.restart'
        restartToolStack: 'Restart tool stack', 'host.restartToolStack'
        start: action 'Start host', 'host.start'
        stop: action 'Stop host', 'host.stop'
        # TODO: attach/set
      }

      message: {
        delete: action, 'Delete message'
      }

      pbd: {
        delete: action 'Delete PBD'
        disconnect: action 'Disconnect PBD'
      }

      task: {
        delete: action, 'Delete task'
      }

      vm: {
        delete: action 'Delete VM'
        # , 'vm.delete', { FIXME
        #   argsMapper: (id, delete_disks) -> { id, delete_disks }
        # }
        migrate: action 'Migrate VM', 'vm.migrate', {
          argsMapper: (id, host_id) -> { id, host_id }
        }
        restart: action 'Restart VM', 'xapi.vm.reboot', {
          argsMapper: (id, force = false) -> { id, force }
        }
        start: action 'Start VM', 'xapi.vm.start'
        stop: action 'Stop VM', 'xapi.vm.shutdown', {
          argsMapper: (id, force = false) -> { id, force }
        }
        # TODO: create/set/pause/suspend
      }
    }

    # Adds the revision property.
    Object.defineProperty xo, 'revision', {
      get: -> xoObjects.revision
    }


    # Returns the interface.
    xo
