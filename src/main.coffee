# File system handling.
$fs = require 'fs'

#---------------------------------------------------------------------

# Low level tools.
$_ = require 'underscore'

# HTTP(s) middleware framework.
$connect = require 'connect'

# Configuration handling.
$nconf = require 'nconf'

$Promise = require 'bluebird'
$Promise.longStackTraces()

# WebSocket server.
$WSServer = (require 'ws').Server

# YAML formatting and parsing.
$YAML = require 'js-yaml'

#---------------------------------------------------------------------

$API = require './api'
$Connection = require './connection'
$XO = require './xo'

# Helpers for dealing with fibers.
{$fiberize, $waitEvent, $wait} = require './fibers-utils'

# HTTP/HTTPS server which can listen on multiple ports.
$WebServer = require 'http-server-plus'

#=====================================================================

$readFile = $Promise.promisify $fs.readFile

$handleJsonRpcCall = (api, session, encodedRequest) ->
  request = {
    id: null
  }

  formatError = (error) -> JSON.stringify {
    jsonrpc: '2.0'
    error: error
    id: request.id
  }

  # Parses the JSON.
  try
    request = JSON.parse encodedRequest.toString()
  catch error
    return formatError (
      if error instanceof SyntaxError
        $API.err.INVALID_JSON
      else
        $API.err.SERVER_ERROR
    )

  # Checks it is a compliant JSON-RPC 2.0 request.
  if (
    not request.method? or
    not request.params? or
    not request.id? or
    request.jsonrpc isnt '2.0'
  )
    return formatError $API.err.INVALID_REQUEST

  # Executes the requested method on the API.
  try
    JSON.stringify {
      jsonrpc: '2.0'
      result: $wait api.exec session, request
      id: request.id
    }
  catch error
    # If it is not a valid API error, hides it with a generic server error.
    unless (error not instanceof Error) and error.code? and error.message?
      console.error error.stack ? error
      error = $API.err.SERVER_ERROR

    formatError error

#=====================================================================

# Main.
do $fiberize ->

  # Loads the environment.
  $nconf.env()

  # Parses process' arguments.
  $nconf.argv()

  # Loads the configuration file.
  $nconf.use 'file', {
    file: "#{__dirname}/../config/local.yaml"
    format: {
      stringify: (obj) -> $YAML.safeDump obj
      parse: (string) -> $YAML.safeLoad string
    }
  }

  # Defines defaults configuration.
  $nconf.defaults {
    http: {
      listen: [
        port: 80
      ]
      mounts: []
    }
    redis: {
      # Default values are handled by `redis`.
    }
  }

  # Prints a message if deprecated entries are specified.
  for entry in ['users', 'servers']
    if $nconf.get entry
      console.warn "[Warn] `#{entry}` configuration is deprecated."

  # Creates the web server according to the configuration.
  webServer = new $WebServer()
  $wait $Promise.map ($nconf.get 'http:listen'), (options) ->
    # Reads certificate and key if necessary.
    if options.certificate? and options.key?
      options.certificate = $wait $readFile options.certificate
      options.key = $wait $readFile options.key

    # Starts listening
    webServer.listen options
      .then ->
        console.log "WebServer listening on #{@niceAddress()}"
      .catch (error) ->
        console.warn "[WARN] WebServer could not listen on #{@niceAddress()}"
        switch error.code
          when 'EACCES'
            console.warn '       Access denied.'
            console.warn '       Ports < 1024 are often reserved to privileges users.'
          when 'EADDRINUSE'
            console.warn '       Address already in use.'

  # Now the web server is listening, drop privileges.
  try
    if (group = $nconf.get 'group')?
      process.setgid group
    if (user = $nconf.get 'user')?
      process.setuid user
  catch error
    console.warn "[WARN] Failed to change the user or group: #{error.message}"

  # Handles error as gracefully as possible.
  webServer.on 'error', (error) ->
    console.error '[ERR] Web server', error
    webServer.close()

  # Creates the main object which will connects to Xen servers and
  # manages all the models.
  xo = new $XO()

  # Starts it.
  xo.start {
    redis: {
      uri: $nconf.get 'redis:uri'
    }
  }

  # Static file serving (e.g. for XO-Web).
  connect = $connect()
  for urlPath, filePaths of $nconf.get 'http:mounts'
    filePaths = [filePaths] unless $_.isArray filePaths
    for filePath in filePaths
      connect.use urlPath, $connect.static filePath
  webServer.on 'request', connect

  # Creates the API.
  api = new $API xo

  conId = 0
  unregisterConnection = ->
    delete xo.connections[@id]

  # JSON-RPC over WebSocket.
  wsServer = new $WSServer {
    server: webServer
    path: '/api/'
  }
  wsServer.on 'connection', (socket) ->
    connection = new $Connection {
      close: socket.close.bind socket
      send: socket.send.bind socket
    }
    connection.id = conId++
    xo.connections[connection.id] = connection
    connection.on 'close', unregisterConnection

    socket.on 'close', connection.close.bind connection

    # Handles each request in a separate fiber.
    socket.on 'message', $fiberize (request) ->
      response = $handleJsonRpcCall api, connection, request

      # The socket may have closed between the request and the
      # response.
      socket.send response if socket.readyState is socket.OPEN

    socket.on 'error', $fiberize (error) ->
      console.error '[WARN] WebSocket connection', error
      socket.close()
  wsServer.on 'error', $fiberize (error) ->
    console.error '[WARN] WebSocket server', error
    wsServer.close()

  # Creates a default user if there is none.
  unless $wait xo.users.exists()
    email = 'admin@admin.net'
    password = 'admin' # TODO: Should be generated.
    xo.users.create email, password, 'admin'
    console.log "[INFO] Default user: “#{email}” with password “#{password}”"
