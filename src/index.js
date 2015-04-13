import createLogger from 'debug'
const debug = createLogger('xo:main')
const debugPlugin = createLogger('xo:plugin')

import Bluebird from 'bluebird'
Bluebird.longStackTraces()

import appConf from 'app-conf'
import assign from 'lodash.assign'
import bind from 'lodash.bind'
import createConnectApp from 'connect'
import eventToPromise from 'event-to-promise'
import forEach from 'lodash.foreach'
import has from 'lodash.has'
import isArray from 'lodash.isarray'
import isFunction from 'lodash.isfunction'
import map from 'lodash.map'
import pick from 'lodash.pick'
import serveStatic from 'serve-static'
import WebSocket from 'ws'
import {
  AlreadyAuthenticated,
  InvalidCredential,
  InvalidParameters,
  NoSuchObject,
  NotImplemented
} from './api-errors'
import {coroutine} from 'bluebird'
import {createServer as createJsonRpcServer} from 'json-rpc'
import {readFile} from 'fs-promise'

import Api from './api'
import WebServer from 'http-server-plus'
import wsProxy from './ws-proxy'
import XO from './xo'

// ===================================================================

const info = (...args) => {
  console.info('[Info]', ...args)
}

const warn = (...args) => {
  console.warn('[Warn]', ...args)
}

// ===================================================================

const DEFAULTS = {
  http: {
    listen: [
      { port: 80 }
    ],
    mounts: {}
  }
}

const DEPRECATED_ENTRIES = [
  'users',
  'servers'
]

const loadConfiguration = coroutine(function * () {
  const config = yield appConf.load('xo-server', {
    defaults: DEFAULTS,
    ignoreUnknownFormats: true
  })

  debug('Configuration loaded.')

  // Print a message if deprecated entries are specified.
  forEach(DEPRECATED_ENTRIES, entry => {
    if (has(config, entry)) {
      warn(`${entry} configuration is deprecated.`)
    }
  })

  return config
})

// ===================================================================

const loadPlugin = Bluebird.method(function (pluginConf, pluginName) {
  debugPlugin('loading %s', pluginName)

  var pluginPath
  try {
    pluginPath = require.resolve('xo-server-' + pluginName)
  } catch (e) {
    pluginPath = require.resolve(pluginName)
  }

  var plugin = require(pluginPath)

  if (isFunction(plugin)) {
    plugin = plugin(pluginConf)
  }

  return plugin.load(this)
})

const loadPlugins = function (plugins, xo) {
  return Bluebird.all(map(plugins, loadPlugin, xo)).then(() => {
    debugPlugin('all plugins loaded')
  })
}

// ===================================================================

const makeWebServerListen = coroutine(function * (opts) {
  // Read certificate and key if necessary.
  const {certificate, key} = opts
  if (certificate && key) {
    [opts.certificate, opts.key] = yield Bluebird.all([
      readFile(certificate),
      readFile(key)
    ])
  }

  try {
    const niceAddress = yield this.listen(opts)
    debug(`Web server listening on ${niceAddress}`)
  } catch (error) {
    warn(`Web server could not listen on ${error.niceAddress}`)

    const {code} = error
    if (code === 'EACCES') {
      warn('  Access denied.')
      warn('  Ports < 1024 are often reserved to privileges users.')
    } else if (code === 'EADDRINUSE') {
      warn('  Address already in use.')
    }
  }
})

const createWebServer = opts => {
  const webServer = new WebServer()

  return Bluebird
    .bind(webServer).return(opts).map(makeWebServerListen)
    .return(webServer)

}

// ===================================================================

const setUpStaticFiles = (connect, opts) => {
  forEach(opts, (paths, url) => {
    if (!isArray(paths)) {
      paths = [paths]
    }

    forEach(paths, path => {
      debug('Setting up %s → %s', url, path)

      connect.use(url, serveStatic(path))
    })
  })
}

// ===================================================================

const errorClasses = {
  ALREADY_AUTHENTICATED: AlreadyAuthenticated,
  INVALID_CREDENTIAL: InvalidCredential,
  INVALID_PARAMS: InvalidParameters,
  NO_SUCH_OBJECT: NoSuchObject,
  NOT_IMPLEMENTED: NotImplemented
}

const apiHelpers = {
  getUserPublicProperties (user) {
    // Handles both properties and wrapped models.
    const properties = user.properties || user

    return pick(properties, 'id', 'email', 'permission')
  },

  getServerPublicProperties (server) {
    // Handles both properties and wrapped models.
    const properties = server.properties || server

    server = pick(properties, 'id', 'host', 'username')

    // Injects connection status.
    const xapi = this._xapis[server.id]
    server.status = xapi ? xapi.status : 'disconnected'

    return server
  },

  throw (errorId, data) {
    throw new (errorClasses[errorId])(data)
  }
}

const setUpApi = (webServer, xo) => {
  const context = Object.create(xo)
  assign(xo, apiHelpers)

  const api = new Api({
    context
  })

  const webSocketServer = new WebSocket.Server({
    server: webServer,
    path: '/api/'
  })

  webSocketServer.on('connection', connection => {
    debug('+ WebSocket connection')

    let xoConnection

    // Create the JSON-RPC server for this connection.
    const jsonRpc = createJsonRpcServer(message => {
      if (message.type === 'request') {
        return api.call(xoConnection, message.method, message.params)
      }
    })

    // Create the abstract XO object for this connection.
    xoConnection = xo.createUserConnection({
      close: bind(connection.close, connection),
      notify: bind(jsonRpc.notify, jsonRpc)
    })

    // Close the XO connection with this WebSocket.
    connection.once('close', () => {
      debug('- WebSocket connection')

      xoConnection.close()
    })

    // Connect the WebSocket to the JSON-RPC server.
    connection.on('message', message => {
      jsonRpc.write(message)
    })

    const onSend = error => {
      if (error) {
        warn('WebSocket send:', error.stack)
      }
    }
    jsonRpc.on('data', data => {
      connection.send(JSON.stringify(data), onSend)
    })
  })
}

// ===================================================================

const getVmConsoleUrl = (xo, id) => {
  const vm = xo.getObject(id, ['VM', 'VM-controller'])
  if (!vm || vm.power_state !== 'Running') {
    return
  }

  const {sessionId} = xo.getXAPI(vm)

  let url
  forEach(vm.consoles, console => {
    if (console.protocol === 'rfb') {
      url = `${console.location}&session_id=${sessionId}`
      return false
    }
  })

  return url
}

const CONSOLE_PROXY_PATH_RE = /^\/consoles\/(.*)$/

const setUpConsoleProxy = (webServer, xo) => {
  const webSocketServer = new WebSocket.Server({
    noServer: true
  })

  webServer.on('upgrade', (req, res, head) => {
    const matches = CONSOLE_PROXY_PATH_RE.exec(req.url)
    if (!matches) {
      return
    }

    const url = getVmConsoleUrl(xo, matches[1])
    if (!url) {
      return
    }

    // FIXME: lost connection due to VM restart is not detected.
    webSocketServer.handleUpgrade(req, res, head, connection => {
      wsProxy(connection, url)
    })
  })
}

// ===================================================================

const registerPasswordAuthenticationProvider = (xo) => {
  const passwordAuthenticationProvider = coroutine(function * ({
    email,
    password,
  }) {
    /* eslint no-throw-literal: 0 */

    if (email === undefined || password === undefined) {
      throw null
    }

    const user = yield xo.users.first({email})
    if (!user || !(yield user.checkPassword(password))) {
      throw null
    }
    return user
  })

  xo.registerAuthenticationProvider(passwordAuthenticationProvider)
}

const registerTokenAuthenticationProvider = (xo) => {
  const tokenAuthenticationProvider = coroutine(function * ({
    token: tokenId,
  }) {
    /* eslint no-throw-literal: 0 */

    if (!tokenId) {
      throw null
    }

    const token = yield xo.tokens.first(tokenId)
    if (!token) {
      throw null
    }

    return token.get('user_id')
  })

  xo.registerAuthenticationProvider(tokenAuthenticationProvider)
}

// ===================================================================

let help
{
  /* eslint no-lone-blocks: 0 */

  const {name, version} = require('../package')
  help = () => `${name} v${version}`
}

// ===================================================================

const main = coroutine(function * (args) {
  if (args.indexOf('--help') !== -1 || args.indexOf('-h') !== -1) {
    return help()
  }

  const config = yield loadConfiguration()

  const webServer = yield createWebServer(config.http.listen)

  // Now the web server is listening, drop privileges.
  try {
    const {user, group} = config
    if (group) {
      process.setgid(group)
      debug('Group changed to', group)
    }
    if (user) {
      process.setuid(user)
      debug('User changed to', user)
    }
  } catch (error) {
    warn('Failed to change user/group:', error)
  }

  // Create the main object which will connects to Xen servers and
  // manages all the models.
  const xo = new XO()
  xo.start({
    redis: {
      uri: config.redis && config.redis.uri
    }
  })

  // Loads default authentication providers.
  registerPasswordAuthenticationProvider(xo)
  registerTokenAuthenticationProvider(xo)

  if (config.plugins) {
    yield loadPlugins(config.plugins, xo)
  }

  // Connect is used to manage non WebSocket connections.
  const connect = createConnectApp()
  webServer.on('request', connect)

  // Must be set up before the API.
  setUpConsoleProxy(webServer, xo)

  // Must be set up before the API.
  connect.use(bind(xo.handleProxyRequest, xo))

  // Must be set up before the static files.
  setUpApi(webServer, xo)

  setUpStaticFiles(connect, config.http.mounts)

  if (!(yield xo.users.exists())) {
    const email = 'admin@admin.net'
    const password = 'admin'

    xo.users.create(email, password, 'admin')
    info('Default user created:', email, ' with password', password)
  }

  // Handle gracefully shutdown.
  const closeWebServer = () => { webServer.close() }
  process.on('SIGINT', closeWebServer)
  process.on('SIGTERM', closeWebServer)

  return eventToPromise(webServer, 'close')
})

exports = module.exports = main
