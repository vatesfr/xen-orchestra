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

    # WebSocket used to connect to XO-Server.
    socket = new WebSocket url

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
        deferred.reject
          message: 'a message with no error nor result has been received'
          object: response
        return

      deferred.resolve result

    # @todo What to do if there is an error in the WebSocket.
    socket.addEventListener 'error', (error) ->
      console.error error

    {
      call: (method, params) -> call method, params
    }

  # This service provides session management and inject the `user`
  # into the `$rootScope`.
  .service 'session', ($rootScope) ->
    {
      logIn: (email, password) ->
        $rootScope.user = {
          email: email
        }

      logOut: ->
        $rootScope.user = null
    }

  # This service provides access to XO objects.
  .service 'xoObjects', ($rootScope, xoApi) ->
    all = []
    byUUIDs = {}
    byTypes = {}

    $rootScope.xoObjects = xoObjects = {
      all
      byTypes
      byUUIDs
    }

    xoApi.call('xo.getAllObjects').then (objects) ->
      for UUID, object of objects
        all.push object
        byUUIDs[UUID] = object
        (byTypes[object.type] ?= []).push object
      console.log byTypes

    xoObjects

  # TODO Remove this service and use the `xo` object.
  .service 'stats', ->

    {
      stats: {
        pools: 2
        hosts: 4
        VMs: 6
        running_VMs: 5
        vCPUs: 32
        CPUs: 12
        memory: {
          usage: 32 * Math.pow(1024, 3)
          size: 64 * Math.pow(1024, 3)
        }
      }
    }
