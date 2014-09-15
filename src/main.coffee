process.env.DEBUG ?= 'xo:*'

#=====================================================================

$fs = require 'fs'

$Promise = require 'bluebird'
$Promise.longStackTraces()

$appConf = require 'app-conf'
$bind = require 'lodash.bind'
$chalk = require 'chalk'
$connect = require 'connect'
$debug = (require 'debug') 'xo:main'
$eventToPromise = require 'event-to-promise'
$isArray = require 'lodash.isarray'
$jsonRpc = require 'json-rpc'
$serveStatic = require 'serve-static'
{Server: $WSServer} = require 'ws'

$API = require './api'
$Connection = require './connection'
$WebServer = require 'http-server-plus'
$XO = require './xo'
{$coroutine, $fiberize, $waitEvent, $wait} = require './fibers-utils'
{$fileExists, $wrap} = require './utils'

#=====================================================================

# $readFile = $Promise.promisify $fs.readFile

$httpListenSuccess = ->
  $debug "Web server listening on #{@niceAddress()}"
  return

$httpListenFailure = (error) ->
  console.warn "[WARN] Web server could not listen on #{@niceAddress()}"
  switch error.code
    when 'EACCES'
      console.warn '       Access denied.'
      console.warn '       Ports < 1024 are often reserved to privileges users.'
    when 'EADDRINUSE'
      console.warn '       Address already in use.'
  return

#=====================================================================

# Main.
exports = module.exports = $coroutine (args) ->
  $debug 'Starting…'

  return exports.help() unless (
    (args.indexOf '--help') is -1 and
    (args.indexOf '-h') is -1
  )

  # Default config.
  opts = {
    http: {
      listen: [
        port: 80
      ]
      mounts: {}
    }
    redis: {
      # Default values are handled by `redis`.
    }
  }

  # Loads config files.
  opts = $wait $appConf.load 'xo-server',
    defaults: opts
    ignoreUnknownFormats: true

  $debug 'Configuration loaded.'

  # Prints a message if deprecated entries are specified.
  for entry in ['users', 'servers']
    if entry of opts
      console.warn "[Warn] `#{entry}` configuration is deprecated."

  # Creates the web server according to the configuration.
  webServer = new $WebServer()
  $wait $Promise.map opts.http.listen, (options) ->
    # Reads certificate and key if necessary.
    if options.certificate? and options.key?
      options.certificate = $wait $readFile options.certificate
      options.key = $wait $readFile options.key

    # Starts listening
    return webServer.listen(options).then $httpListenSuccess, $httpListenFailure

  # Now the web server is listening, drop privileges.
  try
    if opts.group?
      process.setgid opts.group
      $debug 'Group changed to %s', opts.group
    if opts.user?
      process.setuid opts.user
      $debug 'User changed to %s', opts.user
  catch error
    console.warn "[WARN] Failed to change the user or group: #{error.message}"

  # Creates the main object which will connects to Xen servers and
  # manages all the models.
  xo = new $XO()

  # Starts it.
  xo.start {
    redis: {
      uri: opts.redis?.uri
    }
  }

  $debug 'Initializing connection to Xen servers…'

  # Static file serving (e.g. for XO-Web).
  connect = $connect()
  for urlPath, filePaths of opts.http.mounts
    filePaths = [filePaths] unless $isArray filePaths
    for filePath in filePaths
      $debug 'Setting up %s → %s', urlPath, filePath
      connect.use urlPath, $serveStatic filePath
  webServer.on 'request', connect

  # Creates the API.
  api = new $API xo

  # Create the WebSocket server.
  wsServer = new $WSServer {
    server: webServer
    path: '/api/'
  }
  wsServer.on 'error', (error) ->
    console.error '[WARN] WebSocket server', error
    wsServer.close()
    return

  # Handle a WebSocket connection
  wsServer.on 'connection', (socket) ->
    $debug 'WebSocket connection'

    # Forward declaration due to cyclic dependency connection <-> jsonRpc.
    connection = null

    # Create a JSON-RPC interface for this connection.
    jsonRpc = $jsonRpc.create(
      # onReceive
      (message) ->
        return unless message.type is 'request'

        $debug 'Request received %s', message.method

        return api.exec connection, message

      # onSend
      (data) ->
        if socket.readyState is socket.OPEN
          socket.send JSON.stringify data
        return
    )

    # Create a XO user connection.
    connection = xo.createUserConnection {
      close: $bind socket.close, socket
      notify: $bind jsonRpc.notify, jsonRpc
    }

    # Close the connection with the socket.
    socket.on 'close', $bind connection.close, connection

    # Handles each request in a separate fiber.
    socket.on 'message', $bind jsonRpc.exec, jsonRpc

    socket.on 'error', (error) ->
      console.error '[WARN] WebSocket connection', error
      connection.close()
      return

    return

  # Creates a default user if there is none.
  unless $wait xo.users.exists()
    email = 'admin@admin.net'
    password = 'admin' # TODO: Should be generated.
    xo.users.create email, password, 'admin'
    console.log "[INFO] Default user: “#{email}” with password “#{password}”"

  return $eventToPromise webServer, 'close'

exports.help = do (pkg = require '../package') ->
  name = $chalk.bold pkg.name

  return $wrap '''
    Usage: $name

    $name v$version
  '''.replace /<([^>]+)>|\$(\w+)/g, (_, arg, key) ->
    return '<'+ ($chalk.yellow arg) +'>' if arg

    return name if key is 'name'

    return pkg[key]
