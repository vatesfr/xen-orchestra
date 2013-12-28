angular.module('xoWebApp')

  # This service provides an access to the Xen-Orchestra API.
  .service 'xoApi', ($location, $q) ->
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
      # If not yet connected, starts the connection.
      connect() unless socket?

      deferred = $q.defer()
      queue.push [method, params, deferred]
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
          console.warn '[XO API]', error
          deferred.reject error
          return

        result = response.result
        if result is undefined
          message = 'a message with no error nor result has been received'
          console.warn "[XO API] #{message}", response
          deferred.reject {
            message: message
            object: response
          }
          return

        deferred.resolve result

      # @todo What to do if there is an error in the WebSocket.
      socket.addEventListener 'error', (error) ->
        console.error error

        disconnect()

    {
      call: (method, params) -> call method, params
      disconnect: disconnect
    }

  # This service provides session management and inject the `user`
  # into the `$rootScope`.
  .service 'session', ($cookieStore, xoApi) ->
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
      ).then(
        (user) -> session.user = user
      )

    # Exposes the session object.
    session

  # This service provides access to XO objects.
  .service 'xoObjects', ($timeout, xoApi) ->
    xoObjects = {
      revision: 0
    }

    do helper = ->
      xoApi.call('xo.getAllObjects').then (objects) ->
        xoObjects.all = all = []
        xoObjects.byUUIDs = byUUIDs = {}
        xoObjects.byTypes = byTypes = {}
        for UUID, object of objects
          all.push object
          byUUIDs[UUID] = object
          (byTypes[object.type] ?= []).push object
        ++xoObjects.revision

        # Fetches objects again after 5 seconds.
        $timeout helper, 5e3, false

    xoObjects
