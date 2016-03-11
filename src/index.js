import createLogger from 'debug'
const debug = createLogger('xo:main')

import appConf from 'app-conf'
import bind from 'lodash.bind'
import blocked from 'blocked'
import createExpress from 'express'
import eventToPromise from 'event-to-promise'
import has from 'lodash.has'
import helmet from 'helmet'
import includes from 'lodash.includes'
import pick from 'lodash.pick'
import proxyConsole from './proxy-console'
import proxyRequest from 'proxy-http-request'
import serveStatic from 'serve-static'
import startsWith from 'lodash.startswith'
import WebSocket from 'ws'
import {compile as compileJade} from 'jade'

import {
  AlreadyAuthenticated,
  InvalidCredential,
  InvalidParameters,
  NoSuchObject,
  NotImplemented
} from './api-errors'
import JsonRpcPeer from 'json-rpc-peer'
import {
  readFile,
  readdir
} from 'fs-promise'

import * as apiMethods from './api/index'
import Api from './api'
import WebServer from 'http-server-plus'
import wsProxy from './ws-proxy'
import Xo from './xo'
import {
  setup as setupHttpProxy
} from './http-proxy'
import {
  createRawObject,
  forEach,
  isArray,
  isFunction,
  mapToArray,
  pFromCallback
} from './utils'

import bodyParser from 'body-parser'
import connectFlash from 'connect-flash'
import cookieParser from 'cookie-parser'
import expressSession from 'express-session'
import passport from 'passport'
import { parse as parseCookies } from 'cookie'
import { Strategy as LocalStrategy } from 'passport-local'

// ===================================================================

const warn = (...args) => {
  console.warn('[Warn]', ...args)
}

// ===================================================================

const DEPRECATED_ENTRIES = [
  'users',
  'servers'
]

async function loadConfiguration () {
  const config = await appConf.load('xo-server', {
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
}

// ===================================================================

function createExpressApp () {
  const app = createExpress()

  app.use(helmet())

  // Registers the cookie-parser and express-session middlewares,
  // necessary for connect-flash.
  app.use(cookieParser())
  app.use(expressSession({
    resave: false,
    saveUninitialized: false,

    // TODO: should be in the config file.
    secret: 'CLWguhRZAZIXZcbrMzHCYmefxgweItKnS'
  }))

  // Registers the connect-flash middleware, necessary for Passport to
  // display error messages.
  app.use(connectFlash())

  // Registers the body-parser middleware, necessary for Passport to
  // access the username and password from the sign in form.
  app.use(bodyParser.urlencoded({ extended: false }))

  // Registers Passport's middlewares.
  app.use(passport.initialize())

  return app
}

async function setUpPassport (express, xo) {
  const strategies = createRawObject()
  xo.registerPassportStrategy = strategy => {
    passport.use(strategy)

    const {name} = strategy
    if (name !== 'local') {
      strategies[name] = strategy.label || name
    }
  }

  // Registers the sign in form.
  const signInPage = compileJade(
    await readFile(__dirname + '/../signin.jade')
  )
  express.get('/signin', (req, res, next) => {
    res.send(signInPage({
      error: req.flash('error')[0],
      strategies
    }))
  })

  const SIGNIN_STRATEGY_RE = /^\/signin\/([^/]+)(\/callback)?(:?\?.*)?$/
  express.use(async (req, res, next) => {
    const matches = req.url.match(SIGNIN_STRATEGY_RE)

    if (matches) {
      return passport.authenticate(matches[1], async (err, user, info) => {
        if (err) {
          return next(err)
        }

        if (!user) {
          req.flash('error', info ? info.message : 'Invalid credentials')
          return res.redirect('/signin')
        }

        // The cookie will be set in via the next request because some
        // browsers do not save cookies on redirect.
        req.flash(
          'token',
          (await xo.createAuthenticationToken({userId: user.id})).id
        )

        // The session is only persistent for internal provider and if 'Remember me' box is checked
        req.flash(
          'session-is-persistent',
          matches[1] === 'local' && req.body['remember-me'] === 'on'
        )

        res.redirect('/')
      })(req, res, next)
    }

    const token = req.flash('token')[0]

    if (token) {
      const isPersistent = req.flash('session-is-persistent')[0]

      if (isPersistent) {
        // Persistent cookie ? => 1 year
        res.cookie('token', token, { maxAge: 1000 * 60 * 60 * 24 * 365 })
      } else {
        // Non-persistent : external provider as Github, Twitter...
        res.cookie('token', token)
      }

      next()
    } else if (req.cookies.token) {
      next()
    } else if (/favicon|fontawesome|images|styles/.test(req.url)) {
      next()
    } else {
      return res.redirect('/signin')
    }
  })

  // Install the local strategy.
  xo.registerPassportStrategy(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await xo.authenticateUser({username, password})
        done(null, user)
      } catch (error) {
        done(null, false, { message: error.message })
      }
    }
  ))
}

// ===================================================================

async function registerPlugin (pluginPath, pluginName) {
  const plugin = require(pluginPath)
  const { version = 'unknown' } = (() => {
    try {
      return require(pluginPath + '/package.json')
    } catch (_) {
      return {}
    }
  })()

  // Supports both “normal” CommonJS and Babel's ES2015 modules.
  const {
    default: factory = plugin,
    configurationSchema
  } = plugin

  // The default export can be either a factory or directly a plugin
  // instance.
  const instance = isFunction(factory)
    ? factory({ xo: this })
    : factory

  await this.registerPlugin(
    pluginName,
    instance,
    configurationSchema,
    version
  )
}

const debugPlugin = createLogger('xo:plugin')

function registerPluginWrapper (pluginPath, pluginName) {
  debugPlugin('register %s', pluginName)

  return registerPlugin.call(this, pluginPath, pluginName).then(
    () => {
      debugPlugin(`successfully register ${pluginName}`)
    },
    error => {
      debugPlugin(`failed register ${pluginName}`)
      debugPlugin(error)
    }
  )
}

const PLUGIN_PREFIX = 'xo-server-'
const PLUGIN_PREFIX_LENGTH = PLUGIN_PREFIX.length

async function registerPluginsInPath (path) {
  const files = await readdir(path).catch(error => {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  })

  await Promise.all(mapToArray(files, name => {
    if (startsWith(name, PLUGIN_PREFIX)) {
      return registerPluginWrapper.call(
        this,
        `${path}/${name}`,
        name.slice(PLUGIN_PREFIX_LENGTH)
      )
    }
  }))
}

async function registerPlugins (xo) {
  await Promise.all(mapToArray([
    `${__dirname}/../node_modules/`,
    '/usr/local/lib/node_modules/'
  ], xo::registerPluginsInPath))
}

// ===================================================================

async function makeWebServerListen ({
  certificate,

  // The properties was called `certificate` before.
  cert = certificate,

  key,
  ...opts
}) {
  if (cert && key) {
    [opts.cert, opts.key] = await Promise.all([
      readFile(cert),
      readFile(key)
    ])
  }

  try {
    const niceAddress = await this.listen(opts)
    debug(`Web server listening on ${niceAddress}`)
  } catch (error) {
    if (error.niceAddress) {
      warn(`Web server could not listen on ${error.niceAddress}`)

      const {code} = error
      if (code === 'EACCES') {
        warn('  Access denied.')
        warn('  Ports < 1024 are often reserved to privileges users.')
      } else if (code === 'EADDRINUSE') {
        warn('  Address already in use.')
      }
    } else {
      warn('Web server could not listen:', error.message)
    }
  }
}

async function createWebServer (opts) {
  const webServer = new WebServer()

  await Promise.all(mapToArray(opts, webServer::makeWebServerListen))

  return webServer
}

// ===================================================================

const setUpProxies = (express, opts, xo) => {
  if (!opts) {
    return
  }

  // TODO: sort proxies by descending prefix length.

  // HTTP request proxy.
  forEach(opts, (target, url) => {
    express.use(url, (req, res) => {
      proxyRequest(target + req.url, req, res)
    })
  })

  // WebSocket proxy.
  const webSocketServer = new WebSocket.Server({
    noServer: true
  })
  xo.on('stop', () => pFromCallback(cb => webSocketServer.close(cb)))

  express.on('upgrade', (req, socket, head) => {
    const {url} = req

    for (let prefix in opts) {
      if (url.lastIndexOf(prefix, 0) !== -1) {
        const target = opts[prefix] + url.slice(prefix.length)
        webSocketServer.handleUpgrade(req, socket, head, socket => {
          wsProxy(socket, target)
        })
        return
      }
    }
  })
}

// ===================================================================

const setUpStaticFiles = (express, opts) => {
  forEach(opts, (paths, url) => {
    if (!isArray(paths)) {
      paths = [paths]
    }

    forEach(paths, path => {
      debug('Setting up %s → %s', url, path)

      express.use(url, serveStatic(path))
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

    return pick(properties, 'id', 'email', 'groups', 'permission', 'provider')
  },

  throw (errorId, data) {
    throw new (errorClasses[errorId])(data)
  }
}

const setUpApi = (webServer, xo, verboseLogsOnErrors) => {
  const webSocketServer = new WebSocket.Server({
    server: webServer,
    path: '/api/'
  })
  xo.on('stop', () => pFromCallback(cb => webSocketServer.close(cb)))

  // FIXME: it can cause issues if there any property assignments in
  // XO methods called from the API.
  const context = { __proto__: xo, ...apiHelpers }

  const api = new Api({
    context,
    verboseLogsOnErrors
  })
  xo.defineProperty('api', api)

  api.addMethods(apiMethods)

  webSocketServer.on('connection', socket => {
    const { remoteAddress } = socket.upgradeReq.socket

    debug('+ WebSocket connection (%s)', remoteAddress)

    // Create the abstract XO object for this connection.
    const connection = xo.createUserConnection()
    connection.once('close', () => {
      socket.close()
    })

    // Create the JSON-RPC server for this connection.
    const jsonRpc = new JsonRpcPeer(message => {
      if (message.type === 'request') {
        return api.call(connection, message.method, message.params)
      }
    })
    connection.notify = bind(jsonRpc.notify, jsonRpc)

    // Close the XO connection with this WebSocket.
    socket.once('close', () => {
      debug('- WebSocket connection (%s)', remoteAddress)

      connection.close()
    })

    // Connect the WebSocket to the JSON-RPC server.
    socket.on('message', message => {
      jsonRpc.write(message)
    })

    const onSend = error => {
      if (error) {
        warn('WebSocket send:', error.stack)
      }
    }
    jsonRpc.on('data', data => {
      // The socket may have been closed during the API method
      // execution.
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data, onSend)
      }
    })
  })
}

// ===================================================================

const CONSOLE_PROXY_PATH_RE = /^\/api\/consoles\/(.*)$/

const setUpConsoleProxy = (webServer, xo) => {
  const webSocketServer = new WebSocket.Server({
    noServer: true
  })
  xo.on('stop', () => pFromCallback(cb => webSocketServer.close(cb)))

  webServer.on('upgrade', async (req, socket, head) => {
    const matches = CONSOLE_PROXY_PATH_RE.exec(req.url)
    if (!matches) {
      return
    }

    const [, id] = matches
    try {
      // TODO: factorize permissions checking in an Express middleware.
      {
        const { token } = parseCookies(req.headers.cookie)

        const user = await xo.authenticateUser({ token })
        if (!await xo.hasPermissions(user.id, [ [ id, 'operate' ] ])) { // eslint-disable-line space-before-keywords
          throw new InvalidCredential()
        }

        const { remoteAddress } = socket
        debug('+ Console proxy (%s - %s)', user.name, remoteAddress)
        socket.on('close', () => {
          debug('- Console proxy (%s - %s)', user.name, remoteAddress)
        })
      }

      const xapi = xo.getXapi(id, ['VM', 'VM-controller'])
      const vmConsole = xapi.getVmConsole(id)

      // FIXME: lost connection due to VM restart is not detected.
      webSocketServer.handleUpgrade(req, socket, head, connection => {
        proxyConsole(connection, vmConsole, xapi.sessionId)
      })
    } catch (_) {
      console.error(_)
    }
  })
}

// ===================================================================

const USAGE = (({
  name,
  version
}) => `Usage: ${name} [--safe-mode]

${name} v${version}`)(require('../package.json'))

// ===================================================================

export default async function main (args) {
  if (includes(args, '--help') || includes(args, '-h')) {
    return USAGE
  }

  {
    const debug = createLogger('xo:perf')
    blocked(ms => {
      debug('blocked for %sms', ms | 0)
    })
  }

  const config = await loadConfiguration()

  const webServer = await createWebServer(config.http.listen)

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

  if (config.httpProxy) {
    setupHttpProxy(config.httpProxy)
  }

  // Creates main object.
  const xo = new Xo(config)

  // Register web server close on XO stop.
  xo.on('stop', () => pFromCallback(cb => webServer.close(cb)))

  // Connects to all registered servers.
  await xo.start()

  // Express is used to manage non WebSocket connections.
  const express = createExpressApp()

  if (config.http.redirectToHttps) {
    let port
    forEach(config.http.listen, listen => {
      if (
        listen.port &&
        (listen.cert || listen.certificate)
      ) {
        port = listen.port
        return false
      }
    })

    if (port === undefined) {
      warn('Could not setup HTTPs redirection: no HTTPs port found')
    } else {
      express.use((req, res, next) => {
        if (req.secure) {
          return next()
        }

        res.redirect(`https://${req.hostname}:${port}${req.originalUrl}`)
      })
    }
  }

  // Must be set up before the API.
  setUpConsoleProxy(webServer, xo)

  // Must be set up before the API.
  express.use(bind(xo._handleHttpRequest, xo))

  // Everything above is not protected by the sign in, allowing xo-cli
  // to work properly.
  await setUpPassport(express, xo)

  // Attaches express to the web server.
  webServer.on('request', express)
  webServer.on('upgrade', (req, socket, head) => {
    express.emit('upgrade', req, socket, head)
  })

  // Must be set up before the static files.
  setUpApi(webServer, xo, config.verboseApiLogsOnErrors)

  setUpProxies(express, config.http.proxies, xo)

  setUpStaticFiles(express, config.http.mounts)

  if (!includes(args, '--safe-mode')) {
    await registerPlugins(xo)
  }

  // TODO: implements a timeout? (or maybe it is the services launcher
  // responsibility?)
  const shutdown = signal => {
    debug('%s caught, closing…', signal)
    xo.stop()
  }

  // Gracefully shutdown on signals.
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  await eventToPromise(xo, 'stopped')

  debug('bye :-)')
}
