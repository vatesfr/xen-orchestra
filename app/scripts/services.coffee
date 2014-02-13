angular.module('xoWebApp')

  # Inspired by https://github.com/MathieuTurcotte/node-backoff.
  #
  # TODO: Publish in its own module (via npm/bower/UMD).
  # TODO: Implements randomization in the delay.
  # TODO: Should backOff() accept a reason?
  .service 'BackOff', ($timeout) ->
    strategies = {
      constant: (mseconds) ->
        @next = -> mseconds
        @reset = ->
      fibonacci: (init = 1)->
        prev = 0
        cur  = init
        @next = ->
          [prev, cur] = [cur, prev + cur]
          cur
        @reset = ->
          prev = 0
          cur = init
      exponential: (base = 2, init) ->
        current = init ? base
        @next = ->
          value = current
          current *= base
          value
        @reset  = ->
          current = init ? base
    }

    # TODO: Implements a default strategy in a backOffConfig constant.
    BackOff = (strategy, args...) ->
      unless strategy of strategies
        throw new Error "invalid strategy: #{strategy}"

      strategy = strategies[strategy]
      strategy.apply (@_strategy = Object.create strategy), args

      @_delay = 0
      @_maxDelay = null
      @_tries = 0
      @_maxTries = null
      @_timer = null

    # Interfaces to the service, MUST be overloaded.
    BackOff::onBackOff = BackOff::onFail = BackOff::onReady = ( -> )

    # Sets a limit of tries the service will back off.
    BackOff::failAfter = (tries) ->
      @_maxTries = tries

    # Sets a maximum delay to wait.
    BackOff::waitAtMost = (mseconds) ->
      @_maxDelay = mseconds

    # Starts the back off.
    BackOff::backOff = ->
      throw new Error 'allready backed off' if @_timer

      return @fail() if @_tries is @_maxTries

      @_delay = @_strategy.next()
      @_delay = @_maxDelay if @_maxDelay < @_delay
      @_timer = $timeout (=> @_onReady()), @_delay

      @onBackOff @_tries, @_delay

    # Unconditionally fails.
    BackOff::fail = ->
      @reset()
      @onFail()

    # Resets the back off.
    BackOff::reset = ->
      @_strategy.reset()
      @_tries = 0

      if @_timer
        $timeout.cancel @_timer
        @_timer = null

    BackOff::_onReady = ->
      @_timer = null
      tryNumber = @_tries++

      @onReady tryNumber, @_delay

    # Returns the service.
    BackOff

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

  .service 'xoApi', ($cookieStore, $location, $q, BackOff, notify) ->
    url = do ->
      # Note: The path is ignored, the WebSocket must be relative to
      # root.
      protocol = if $location.protocol() is 'https' then 'wss:' else 'ws:'
      host = $location.host()
      port = $location.port()

      "#{protocol}//#{host}:#{port}/api/"

    # Identifier of the next request.
    nextId = 0

    # Promises linked to the requests.
    deferreds = {}

    # When the socket is closed, request are enqueued.
    queue = []

    # Variable which will contains the webSocket to use.
    socket = null

    # Currently logged in user.
    user = null

    backOff = new BackOff 'fibonacci', 5e3
    backOff.waitAtMost 900e3 # 15 minutes.

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
        backOff.reset()

        notify.info 'Connected to XO-Server'

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

      socket.addEventListener 'close', -> backOff.backOff()

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

    backOff.onBackOff = (tryNumber, delay) ->
      call = enqueue
      user = null

      notify.error """
The connection with XO-Server has been lost.

Attempt to reconnect in #{Math.round delay/1e3} seconds.
"""
    backOff.onReady = connect

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

      pool: {
        disconnect: action 'Disconnect pool'
        new_sr: action 'New SR' #temp fix before creating SR
      }

      host: {
        detach:           action 'Detach host'#, 'host.detach'
        restart:          action 'Restart host'#, 'host.restart'
        restartToolStack: action 'Restart tool stack'#, 'host.restartToolStack'
        start:            action 'Start host'#, 'host.start'
        stop:             action 'Stop host'#, 'host.stop'
        new_sr:           action 'New SR' #temp fix before creating SR
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
        ejectCd: action 'Eject disc', 'vm.ejectCd'
        insertCd: action 'Insert disc', 'vm.insertCd', {
          argsMapper: (id, cd_id, force = false) -> { id, cd_id, force }
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

      vdi: {
        delete: action 'Delete VDI', 'vdi.delete'
      }

    }

    # Adds the revision property.
    Object.defineProperty xo, 'revision', {
      get: -> xoObjects.revision
    }

    # Returns the interface.
    xo
