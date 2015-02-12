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
$wsProxy = require './ws-proxy'
$XO = require './xo'
{$coroutine, $fiberize, $waitEvent, $wait} = require './fibers-utils'
{$fileExists, $wrap} = require './utils'

#=====================================================================

loadConfiguration = () ->
  defaults = {
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
  opts = $wait $appConf.load('xo-server', {
    defaults,
    ignoreUnknownFormats: true,
  })

  $debug 'Configuration loaded.'

  # Prints a message if deprecated entries are specified.
  for entry in ['users', 'servers']
    if entry of opts
      console.warn "[Warn] `#{entry}` configuration is deprecated."

  return opts

#---------------------------------------------------------------------

$readFile = $Promise.promisify $fs.readFile

$httpListenSuccess = (niceAddress) ->
  $debug "Web server listening on #{niceAddress}"
  return

$httpListenFailure = (error) ->
  console.warn "[WARN] Web server could not listen on #{error.niceAddress}"
  switch error.code
    when 'EACCES'
      console.warn '       Access denied.'
      console.warn '       Ports < 1024 are often reserved to privileges users.'
    when 'EADDRINUSE'
      console.warn '       Address already in use.'
  return

# Returns a promise to a new HTTP server plus when it is listening on
# all port.
createWebServer = (opts) ->
  webServer = new $WebServer()

  return $Promise.map(opts, (opts) ->
    return $Promise.try(() ->
      # Reads certificate and key if necessary.
      if opts.certificate and opts.key
        return $Promise.join(
          $readFile(opts.certificate), $readFile(opts.key),
          (certificate, key) ->
            opts.certificate = certificate
            opts.key = key
            return
        )
      return
    ).then(() ->
      return webServer.listen(opts).then($httpListenSuccess, $httpListenFailure)
    )
  ).return(webServer)

#---------------------------------------------------------------------

setUpStaticFiles = (connect, opts) ->
  for urlPath, filePaths of opts
    filePaths = [filePaths] unless $isArray filePaths
    for filePath in filePaths
      $debug 'Setting up %s → %s', urlPath, filePath
      connect.use urlPath, $serveStatic filePath

  return

#---------------------------------------------------------------------

setUpApi = (webServer, xo) ->
  api = new $API(xo)

  webSocketServer = new $WSServer({
    server: webServer,
    path: '/api/',
  })

  webSocketServer.on('connection', (connection) ->
    $debug '+ WebSocket connection'

    # Forward declaration.
    xoConnection = null

    # Create the JSON-RPC server for this connection.
    jsonRpc = $jsonRpc.createServer((message) ->
      if message.type is 'request'
        return api.exec(xoConnection, message)

      return
    )

    # Create the abstract XO object for this connection.
    xoConnection = xo.createUserConnection({
      close: $bind(connection.close, connection),
      notify: $bind(jsonRpc.notify, jsonRpc),
    })

    # Close the XO connection with this WebSocket.
    connection.once('close', () ->
      $debug '- WebSocket connection'
      xoConnection.close()

      return
    )

    # Connect the WebSocket to the JSON-RPC server.
    connection.on('message', (message) ->
      jsonRpc.write(message)
      return
    )
    webSocketSendError = (error) ->
      if error
        console.error('[WARN] WebSocket send', error)
        connection.close()
      return
    jsonRpc.on('data', (data) ->
      connection.send(JSON.stringify(data), webSocketSendError)
      return
    )

    return
  )

  return

#---------------------------------------------------------------------

getVmConsoleUrl = (xo, id) ->
  vm = xo.getObject(id, ['VM', 'VM-controller'])
  return unless vm?.power_state is 'Running'

  {sessionId} = xo.getXAPI(vm)

  for console in vm.consoles
    if console.protocol is 'rfb'
      return "#{console.location}&session_id=#{sessionId}"

  return

CONSOLE_PROXY_PATH_RE = /^\/consoles\/(.*)$/
setUpConsoleProxy = (webServer, xo) ->
  webSocketServer = new $WSServer({
    noServer: true,
  })

  webServer.on('upgrade', (req, res, head) ->
    matches = CONSOLE_PROXY_PATH_RE.exec(req.url)
    return unless matches

    url = getVmConsoleUrl(xo, matches[1])
    return unless url

    webSocketServer.handleUpgrade(req, res, head, (connection) ->
      $wsProxy(connection, url)
      return
    )
    return
  )

  return

#=====================================================================

# Main.
exports = module.exports = $coroutine (args) ->
  return exports.help() unless (
    (args.indexOf '--help') is -1 and
    (args.indexOf '-h') is -1
  )

  opts = $wait loadConfiguration()

  webServer = $wait createWebServer(opts.http.listen)

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
  xo.start {
    redis: {
      uri: opts.redis?.uri
    }
  }

  # Connect is used for managing non WebSocket connections.
  connect = $connect()
  webServer.on('request', connect)

  # Must be set up before the API.
  setUpConsoleProxy(webServer, xo)

  # Must be set up before the API.
  connect.use $bind xo.handleProxyRequest, xo

  # Must be set up before the static files.
  setUpApi(webServer, xo)

  setUpStaticFiles(connect, opts.http.mounts)

  # Creates a default user if there is none.
  unless $wait xo.users.exists()
    email = 'admin@admin.net'
    password = 'admin' # TODO: Should be generated.
    $wait xo.users.create email, password, 'admin'
    console.log "[INFO] Default user: “#{email}” with password “#{password}”"

  return $eventToPromise webServer, 'close'

#---------------------------------------------------------------------

exports.help = do (pkg = require '../package') ->
  name = $chalk.bold pkg.name

  return $wrap '''
    Usage: $name

    $name v$version
  '''.replace /<([^>]+)>|\$(\w+)/g, (_, arg, key) ->
    return '<'+ ($chalk.yellow arg) +'>' if arg

    return name if key is 'name'

    return pkg[key]
