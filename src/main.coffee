# File system handling.
$fs = require 'fs'

#---------------------------------------------------------------------

# Low level tools.
$_ = require 'underscore'

# HTTP(s) middleware framework.
$connect = require 'connect'

# Configuration handling.
$nconf = require 'nconf'

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
$WebServer = require './web-server'

#=====================================================================

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
  webServer.listen options for options in $nconf.get 'http:listen'

  # Waits for the web server to start listening to drop privileges.
  $waitEvent webServer, 'listening'
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

  # # JSON-RPC over WebSocket.
  wsServer = new $WSServer {
    server: webServer
    path: '/api/'
  }
  wsServer.on 'connection', (socket) ->
    connection = new $Connection {
      close: socket.close.bind socket
      send: socket.send.bind socket
    }

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
