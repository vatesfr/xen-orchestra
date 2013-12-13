# File system handling.
$fs = require 'fs'

# HTTP(S) handling.
$http = require 'http'
$https = require 'https'

#---------------------------------------------------------------------

# Low level tools.
$_ = require 'underscore'

# HTTP(s) middleware framework.
$connect = require 'connect'

# Async code is easier with fibers (light threads)!
$fiber = require 'fibers'

# Configuration handling.
$nconf = require 'nconf'

# WebSocket server.
$WSServer = (require 'ws').Server

# YAML formatting and parsing.
$YAML = require 'js-yaml'

#---------------------------------------------------------------------

$API = require './api'
$Session = require './session'
$XO = require './xo'

# Helpers for dealing with fibers.
{$fiberize, $waitForPromise} = require './fibers-utils'

#=====================================================================

$createWebServer = ({host, port, certificate, key}) ->
  # Creates the web server.
  if certificate? and key?
    protocol = 'HTTPS'
    server = $https.createServer {
      cert: certificate
      key: key
    }
  else
    protocol = 'HTTP'
    server = $http.createServer()

  # Starts listening.
  server.listen port, host

  # Prints a message when it has started to listen.
  server.once 'listening', ->
    console.log "#{protocol} server is listening on #{host}:#{port}"

  # Prints an error message if if failed to listen.
  server.once 'error', ->
    console.warn "#{protocol} server could not listen on #{host}:#{port}"

  # Returns the server.
  server

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
  if not request.method or not request.params or request.id is undefined or request.jsonrpc isnt '2.0'
    return formatError $API.err.INVALID_REQUEST

  # Executes the requested method on the API.
  try
    JSON.stringify {
      jsonrpc: '2.0'
      result: $waitForPromise (api.exec session, request)
      id: request.id
    }
  catch error
    # If it is not a valid API error, hides it with a generic server error.
    unless $_.isObject error and error not instanceof Error
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
      enabled: true
      host: '0.0.0.0'
      port: 80
    }
    https: {
      enabled: false
      host: '0.0.0.0'
      port: 443
      certificate: './certificate.pem'
      key: './key.pem'
    }
    redis: {
      uri: 'tcp://127.0.0.1:6379'
    }
  }

  # Prints a message if deprecated entries are specified.
  for entry in ['users', 'servers']
    if $nconf.get entry
      console.warn "[Warn] `#{entry}` configuration is deprecated."

  # Creates the main object which will connects to Xen servers and
  # manages all the models.
  xo = new $XO()

  # Starts it.
  xo.start {
    redis: {
      uri: $nconf.get 'redis:uri'
    }
  }

  # Creates web servers according to the configuration.
  webServers = []
  if $nconf.get 'http:enabled'
    webServers.push $createWebServer {
      secure: false
      host: $nconf.get 'http:host'
      port: $nconf.get 'http:port'
    }
  if $nconf.get 'https:enabled'
    webServers.push $createWebServer {
      secure: true
      host: $nconf.get 'https:host'
      port: $nconf.get 'https:port'
    }

  # Static file serving (e.g. for XO-Web).
  connect = $connect()
    .use $connect.static "#{__dirname}/../public/http"
  webServer.on 'request', connect for webServer in webServers

  # Creates the API.
  api = new $API xo

  # JSON-RPC over WebSocket.
  for webServer in webServers
    new $WSServer({
      server: webServer
      path: '/api/'
    }).on 'connection', (socket) ->
      # Binds a session to this connection.
      session = new $Session xo
      session.once 'close', -> socket.close()
      socket.once 'close', -> session.close()

      # Handles each request in a separate fiber.
      socket.on 'message', $fiberize (request) ->
        response = $handleJsonRpcCall api, session, request

        # The socket may have closed beetween the request and the
        # response.
        socket.send response if socket.readyState is socket.OPEN
