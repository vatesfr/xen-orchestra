import createLogger from 'debug'
const debug = createLogger('xo:main')

import appConf from 'app-conf'
import assign from 'lodash.assign'
import bind from 'lodash.bind'
import blocked from 'blocked'
import createExpress from 'express'
import eventToPromise from 'event-to-promise'
import forEach from 'lodash.foreach'
import has from 'lodash.has'
import isArray from 'lodash.isarray'
import isFunction from 'lodash.isfunction'
import map from 'lodash.map'
import pick from 'lodash.pick'
import proxyRequest from 'proxy-http-request'
import serveStatic from 'serve-static'
import WebSocket from 'ws'
import {
  AlreadyAuthenticated,
  InvalidCredential,
  InvalidParameters,
  NoSuchObject,
  NotImplemented
} from './api-errors'
import JsonRpcPeer from 'json-rpc-peer'
import {readFile} from 'fs-promise'

import * as apiMethods from './api/index'
import Api from './api'
import JobExecutor from './job-executor'
import RemoteHandler from './remote-handler'
import Scheduler from './scheduler'
import WebServer from 'http-server-plus'
import wsProxy from './ws-proxy'
import Xo from './xo'

import bodyParser from 'body-parser'
import connectFlash from 'connect-flash'
import cookieParser from 'cookie-parser'
import expressSession from 'express-session'
import passport from 'passport'
import {Strategy as LocalStrategy} from 'passport-local'

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

async function loadConfiguration () {
  const config = await appConf.load('xo-server', {
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
}

// ===================================================================

function createExpressApp () {
  const app = createExpress()

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

const SIGNIN_STRATEGY_RE = /^\/signin\/([^/]+)(\/callback)?$/
function setUpPassport (express, xo) {
  xo.registerPassportStrategy = strategy => {
    passport.use(strategy)
  }

  // Registers the sign in form.
  express.get('/signin', (req, res, next) => {
    res.send(`
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xen Orchestra</title>
    <meta name="author" content="Vates SAS">
    <link rel="stylesheet" href="styles/main.css">
  </head>
  <body>
    <div class="container">
      <div class="row-login">
        <div class="page-header">
          <img src="images/logo_small.png">
          <h2>Xen Orchestra</h2>
          <form class="form-horizontal" action="/signin/local" method="post">
            <fieldset>
              <legend class="login">
                <h3>Sign in</h3>
              </legend>
              ${(error => {
                if (error) return `<p class="text-danger">${error}</p>`
              })(req.flash('error'))}
              <div class="form-group">
                <div class="col-sm-12">
                  <div class="input-group">
                    <span class="input-group-addon">
                      <i class="xo-icon-user fa-fw"></i>
                    </span>
                    <input
                      class="form-control input-sm"
                      name="username"
                      type="text"
                      placeholder="Username"
                      required
                    >
                  </div>
                </div>
              </div>
              <div class="form-group">
                <div class="col-sm-12">
                  <div class="input-group">
                    <span class="input-group-addon">
                      <i class="fa fa-key fa-fw"></i>
                    </span>
                    <input
                      class="form-control input-sm"
                      name="password"
                      type="password"
                      placeholder="Passport"
                      required
                    >
                  </div>
                </div>
              </div>
              <div class="form-group">
                <div class="col-sm-12">
                  <button class="btn btn-login btn-block btn-success">
                    <i class="fa fa-sign-in"></i> Sign in
                  </button>
                </div>
              </div>
              <ul>
                <li><a href="/signin/facebook">Sign in with Facebook</a></li>
                <li><a href="/signin/github">Sign in with GitHub</a></li>
                <li><a href="/signin/google">Sign in with Google</a></li>
                <li><a href="/signin/saml">Sign in with SAML</a></li>
              </ul>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </body>
</html>
`)
  })

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

        res.redirect('/')
      })(req, res, next)
    }

    const token = req.flash('token')[0]
    if (token) {
      res.cookie('token', token)
      next()
    } else if (req.cookies.token) {
      next()
    } else if (/fontawesome|images|styles/.test(req.url)) {
      next()
    } else {
      res.redirect('/signin')
    }
  })

  // Install the local strategy.
  xo.registerPassportStrategy(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await xo.authenticateUser({username, password})
        done(null, user)
      } catch (error) {
        done(error.message)
      }
    }
  ))
}

// ===================================================================

const debugPlugin = createLogger('xo:plugin')

async function loadPlugin (pluginConf, pluginName) {
  debugPlugin('loading %s', pluginName)

  const pluginPath = (function (name) {
    try {
      return require.resolve('xo-server-' + name)
    } catch (e) {
      return require.resolve(name)
    }
  })(pluginName)

  let plugin = require(pluginPath)

  if (isFunction(plugin)) {
    plugin = plugin(pluginConf)
  }

  return plugin.load(this)
}

function loadPlugins (plugins, xo) {
  return Promise.all(map(plugins, loadPlugin, xo)).then(() => {
    debugPlugin('all plugins loaded')
  })
}

// ===================================================================

async function makeWebServerListen (opts) {
  // Read certificate and key if necessary.
  const {certificate, key} = opts
  if (certificate && key) {
    [opts.certificate, opts.key] = await Promise.all([
      readFile(certificate),
      readFile(key)
    ])
  }

  try {
    const niceAddress = await this.listen(opts)
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
}

async function createWebServer (opts) {
  const webServer = new WebServer()

  await Promise.all(map(opts, makeWebServerListen, webServer))

  return webServer
}

// ===================================================================

const setUpProxies = (express, opts) => {
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

function setUpWebSocketServer (webServer) {
  return new WebSocket.Server({
    server: webServer,
    path: '/api/'
  })
}

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

    return pick(properties, 'id', 'email', 'groups', 'permission')
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

const setUpApi = (webSocketServer, xo) => {
  const context = Object.create(xo)
  assign(xo, apiHelpers)

  const api = new Api({
    context
  })
  api.addMethods(apiMethods)

  webSocketServer.on('connection', socket => {
    debug('+ WebSocket connection')

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
      debug('- WebSocket connection')

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

  return api
}

const setUpScheduler = (api, xo) => {
  const jobExecutor = new JobExecutor(xo, api)
  const scheduler = new Scheduler(xo, {executor: jobExecutor})
  xo.scheduler = scheduler

  return scheduler
}

const setUpRemoteHandler = async xo => {
  const remoteHandler = new RemoteHandler()
  xo.remoteHandler = remoteHandler
  xo.initRemotes()
  xo.syncAllRemotes()

  return remoteHandler
}

// ===================================================================

const CONSOLE_PROXY_PATH_RE = /^\/api\/consoles\/(.*)$/

const setUpConsoleProxy = (webServer, xo) => {
  const webSocketServer = new WebSocket.Server({
    noServer: true
  })

  webServer.on('upgrade', (req, socket, head) => {
    const matches = CONSOLE_PROXY_PATH_RE.exec(req.url)
    if (!matches) {
      return
    }

    const [, id] = matches
    try {
      const url = xo.getXAPI(id, ['VM', 'VM-controller']).getVmConsoleUrl(id)

      // FIXME: lost connection due to VM restart is not detected.
      webSocketServer.handleUpgrade(req, socket, head, connection => {
        wsProxy(connection, url, {
          rejectUnauthorized: false
        })
      })
    } catch (_) {}
  })
}

// ===================================================================

const registerPasswordAuthenticationProvider = (xo) => {
  async function passwordAuthenticationProvider ({
    email,
    password
  }) {
    /* eslint no-throw-literal: 0 */

    if (email === undefined || password === undefined) {
      throw null
    }

    // TODO: this is deprecated and should be removed.
    const user = await xo._users.first({email})
    if (!user || !(await user.checkPassword(password))) {
      throw null
    }
    return user
  }

  xo.registerAuthenticationProvider(passwordAuthenticationProvider)
}

const registerTokenAuthenticationProvider = (xo) => {
  async function tokenAuthenticationProvider ({
    token: tokenId
  }) {
    /* eslint no-throw-literal: 0 */

    if (!tokenId) {
      throw null
    }

    try {
      return (await xo.getAuthenticationToken(tokenId)).user_id
    } catch (e) {
      // It is not an error if the token does not exists.
      throw null
    }
  }

  xo.registerAuthenticationProvider(tokenAuthenticationProvider)
}

// ===================================================================

const help = (function ({name, version}) {
  return () => `${name} v${version}`
})(require('../package.json'))

// ===================================================================

export default async function main (args) {
  if (args.indexOf('--help') !== -1 || args.indexOf('-h') !== -1) {
    return help()
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

  // Create the main object which will connects to Xen servers and
  // manages all the models.
  const xo = new Xo()
  await xo.start({
    redis: {
      uri: config.redis && config.redis.uri
    }
  })

  // Loads default authentication providers.
  registerPasswordAuthenticationProvider(xo)
  registerTokenAuthenticationProvider(xo)

  if (config.plugins) {
    await loadPlugins(config.plugins, xo)
  }

  // Express is used to manage non WebSocket connections.
  const express = createExpressApp()

  setUpPassport(express, xo)

  // Attaches express to the web server.
  webServer.on('request', express)
  webServer.on('upgrade', (req, socket, head) => {
    express.emit('upgrade', req, socket, head)
  })

  // Must be set up before the API.
  setUpConsoleProxy(webServer, xo)

  // Must be set up before the API.
  express.use(bind(xo._handleHttpRequest, xo))

  // TODO: remove when no longer necessary.
  express.use(bind(xo._handleProxyRequest, xo))

  // Must be set up before the static files.
  const webSocketServer = setUpWebSocketServer(webServer)
  const api = setUpApi(webSocketServer, xo)

  const scheduler = setUpScheduler(api, xo)
  setUpRemoteHandler(xo)

  setUpProxies(express, config.http.proxies)

  setUpStaticFiles(express, config.http.mounts)

  if (!(await xo._users.exists())) {
    const email = 'admin@admin.net'
    const password = 'admin'

    await xo.createUser(email, {password, permission: 'admin'})
    info('Default user created:', email, ' with password', password)
  }

  // Gracefully shutdown on signals.
  //
  // TODO: implements a timeout? (or maybe it is the services launcher
  // responsibility?)
  process.on('SIGINT', async () => {
    debug('SIGINT caught, closing web server…')

    webServer.close()

    webSocketServer.close()
    scheduler.disableAll()
    await xo.disableAllRemotes()
  })
  process.on('SIGTERM', async () => {
    debug('SIGTERM caught, closing web server…')

    webServer.close()

    webSocketServer.close()
    scheduler.disableAll()
    await xo.disableAllRemotes()
  })

  return eventToPromise(webServer, 'close')
}
