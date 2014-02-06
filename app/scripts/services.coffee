angular.module('xoWebApp')

  .service 'modal', ($modal) ->
    {
      confirm: ({title, message}) ->
        modal = $modal.open {
          controller: 'GenericModalCtrl'
          templateUrl: 'views/generic_modal.html'
          resolve: {
            options: -> {
              title
              message
              noButtonLabel: 'Cancel'
            }
          }
        }
        modal.result
    }

  .service 'notify', (toaster) ->
    notifier = (level) ->
      (options) ->
        if angular.isString options
          options = { message: options }
        else
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

  .service 'xoApi', ($cookieStore, $location, $q, $timeout, notify) ->
    url = do ->
      # Note: The path is ignored, the WebSocket must be relative to
      # root.
      protocol = if $location.protocol() is 'https:' then 'wss:' else 'ws:'
      host = $location.host()
      port = $location.port()

      "#{protocol}//#{host}:#{port}/api/"

    # Redefine the URL for testing purpose.
    url = 'ws://localhost:8080/api/'

    # Identifier of the next request.
    nextId = 0

    # Delay in seconds to the next reconnection attempt, `null` when
    # no reconnection are attempted (currently connected).
    delay = null

    # Promises linked to the requests.
    deferreds = {}

    # When the socket is closed, request are enqueued.
    queue = []

    # Variable which will contains the webSocket to use.
    socket = null

    # Currently logged in user.
    user = null

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
      deferred.promise

    # This variable contains the function which be called (initially
    # it will points to `enqueue`).
    call = enqueue

    connect = ->
      # Creation of the WebSocket.
      socket = new WebSocket url

      # When the WebSocket opens, send any requests enqueued.
      socket.addEventListener 'open', ->
        notify.info 'Connected to XO-Server'

        delay = null

        # If there is a token tries to sign in.
        if (token = $cookieStore.get 'token')
          send(
            'session.signInWithToken'
            {token}
          ).then (loggedInUser) ->
            user = loggedInUser
          .catch ->
            # The authentication failed, removes the token.
            $cookieStore.remove 'token'

        # Sends queued requests.
        send entry... while (entry = queue.shift())?

        # New requests are sent directly.
        call = send

      socket.addEventListener 'close', ->
        call = enqueue
        user = null
        delay ?= 4 # Initial delay.

        notify.error """
The connection with XO-Server has been lost.

Attempt to reconnect in #{delay} seconds.
"""

        # Tries to reconnect after a small (increasing) delay.
        $timeout connect, delay * 1e3

        # FIXME: Use Fibonacci progression instead of exponential.
        delay *= 2

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

    connect()

    xoApi = {
      call: (method, params) ->
        call method, params

      logIn: (email, password, persist) ->
        call(
          'session.signInWithPassword'
          {email, password}
        ).then (loggedInUser) ->
          user = loggedInUser

          if persist
            call('token.create').then (token) ->
              $cookieStore.put 'token', token
        .catch (error) ->
          notify.warning {
            title: 'Authentication failed'
            message: error.message
          }

      logOut: ->
        send 'session.signOut' if socket
        user = null
        $cookieStore.remove 'token'
    }

    Object.defineProperty xoApi, 'user', {
      get: -> user
    }

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

          # TODO: A (broken) promise should be returned for
          # consistency.

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
        createSnapshot: action 'Create VM snapshot'
        delete: action 'Delete VM', 'vm.delete', {
          argsMapper: (id, delete_disks) -> { id, delete_disks }
        }
        migrate: action 'Migrate VM', 'vm.migrate', {
          argsMapper: (id, host_id) -> { id, host_id }
        }
        restart: action 'Restart VM', 'vm.restart', {
          argsMapper: (id, force = false) -> { id, force }
        }
        start: action 'Start VM', 'vm.start'
        stop: action 'Stop VM', 'vm.stop', {
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
