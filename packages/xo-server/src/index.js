import appConf from 'app-conf'
import bind from 'lodash/bind'
import blocked from 'blocked'
import createExpress from 'express'
import createLogger from 'debug'
import has from 'lodash/has'
import helmet from 'helmet'
import includes from 'lodash/includes'
import proxyConsole from './proxy-console'
import pw from 'pw'
import serveStatic from 'serve-static'
import startsWith from 'lodash/startsWith'
import stoppable from 'stoppable'
import WebSocket from 'ws'
import { compile as compilePug } from 'pug'
import { createServer as createProxyServer } from 'http-proxy'
import { fromEvent } from 'promise-toolbox'
import { join as joinPath } from 'path'

import JsonRpcPeer from 'json-rpc-peer'
import { invalidCredentials } from 'xo-common/api-errors'
import { ensureDir, readdir, readFile } from 'fs-extra'

import WebServer from 'http-server-plus'
import Xo from './xo'
import {
  forEach,
  isArray,
  isFunction,
  mapToArray,
  pFromCallback,
} from './utils'

import bodyParser from 'body-parser'
import connectFlash from 'connect-flash'
import cookieParser from 'cookie-parser'
import expressSession from 'express-session'
import passport from 'passport'
import { parse as parseCookies } from 'cookie'
import { Strategy as LocalStrategy } from 'passport-local'

// ===================================================================

const debug = createLogger('xo:main')

const warn = (...args) => {
  console.warn('[Warn]', ...args)
}

// ===================================================================

const DEPRECATED_ENTRIES = ['users', 'servers']

async function loadConfiguration () {
  const config = await appConf.load('xo-server', {
    appDir: joinPath(__dirname, '..'),
    ignoreUnknownFormats: true,
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
  app.use(
    expressSession({
      resave: false,
      saveUninitialized: false,

      // TODO: should be in the config file.
      secret: 'CLWguhRZAZIXZcbrMzHCYmefxgweItKnS',
    })
  )

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
  const strategies = { __proto__: null }
  xo.registerPassportStrategy = strategy => {
    passport.use(strategy)

    const { name } = strategy
    if (name !== 'local') {
      strategies[name] = strategy.label || name
    }
  }

  // Registers the sign in form.
  const signInPage = compilePug(
    await readFile(joinPath(__dirname, '..', 'signin.pug'))
  )
  express.get('/signin', (req, res, next) => {
    res.send(
      signInPage({
        error: req.flash('error')[0],
        strategies,
      })
    )
  })

  express.get('/signout', (req, res) => {
    res.clearCookie('token')
    res.redirect('/')
  })

  const SIGNIN_STRATEGY_RE = /^\/signin\/([^/]+)(\/callback)?(:?\?.*)?$/
  express.use(async (req, res, next) => {
    const { url } = req
    const matches = url.match(SIGNIN_STRATEGY_RE)

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
          (await xo.createAuthenticationToken({ userId: user.id })).id
        )

        // The session is only persistent for internal provider and if 'Remember me' box is checked
        req.flash(
          'session-is-persistent',
          matches[1] === 'local' && req.body['remember-me'] === 'on'
        )

        res.redirect(req.flash('return-url')[0] || '/')
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
    } else if (
      /favicon|fontawesome|images|styles|\.(?:css|jpg|png)$/.test(url)
    ) {
      next()
    } else {
      req.flash('return-url', url)
      return res.redirect('/signin')
    }
  })

  // Install the local strategy.
  xo.registerPassportStrategy(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await xo.authenticateUser({ username, password })
        done(null, user)
      } catch (error) {
        done(null, false, { message: error.message })
      }
    })
  )
}

// ===================================================================

async function registerPlugin (pluginPath, pluginName) {
  const plugin = require(pluginPath)
  const { description, version = 'unknown' } = (() => {
    try {
      return require(pluginPath + '/package.json')
    } catch (_) {
      return {}
    }
  })()

  // Supports both “normal” CommonJS and Babel's ES2015 modules.
  const {
    default: factory = plugin,
    configurationSchema,
    configurationPresets,
    testSchema,
  } = plugin

  // The default export can be either a factory or directly a plugin
  // instance.
  const instance = isFunction(factory)
    ? factory({
        xo: this,
        getDataDir: () => {
          const dir = `${this._config.datadir}/${pluginName}`
          return ensureDir(dir).then(() => dir)
        },
      })
    : factory

  await this.registerPlugin(
    pluginName,
    instance,
    configurationSchema,
    configurationPresets,
    description,
    testSchema,
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

  await Promise.all(
    mapToArray(files, name => {
      if (startsWith(name, PLUGIN_PREFIX)) {
        return registerPluginWrapper.call(
          this,
          `${path}/${name}`,
          name.slice(PLUGIN_PREFIX_LENGTH)
        )
      }
    })
  )
}

async function registerPlugins (xo) {
  await Promise.all(
    mapToArray(
      [`${__dirname}/../node_modules/`, '/usr/local/lib/node_modules/'],
      xo::registerPluginsInPath
    )
  )
}

// ===================================================================

async function makeWebServerListen (
  webServer,
  {
    certificate,

    // The properties was called `certificate` before.
    cert = certificate,

    key,
    ...opts
  }
) {
  if (cert && key) {
    ;[opts.cert, opts.key] = await Promise.all([readFile(cert), readFile(key)])
    if (opts.key.includes('ENCRYPTED')) {
      opts.passphrase = await new Promise(resolve => {
        console.log('Encrypted key %s', key)
        process.stdout.write(`Enter pass phrase: `)
        pw(resolve)
      })
    }
  }
  try {
    const niceAddress = await webServer.listen(opts)
    debug(`Web server listening on ${niceAddress}`)
  } catch (error) {
    if (error.niceAddress) {
      warn(`Web server could not listen on ${error.niceAddress}`)

      const { code } = error
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

async function createWebServer ({ listen, listenOptions }) {
  const webServer = stoppable(new WebServer())

  await Promise.all(
    mapToArray(listen, opts =>
      makeWebServerListen(webServer, { ...listenOptions, ...opts })
    )
  )

  return webServer
}

// ===================================================================

const setUpProxies = (express, opts, xo) => {
  if (!opts) {
    return
  }

  const proxy = createProxyServer({
    ignorePath: true,
  }).on('error', error => console.error(error))

  // TODO: sort proxies by descending prefix length.

  // HTTP request proxy.
  express.use((req, res, next) => {
    const { url } = req

    for (const prefix in opts) {
      if (startsWith(url, prefix)) {
        const target = opts[prefix]

        proxy.web(req, res, {
          target: target + url.slice(prefix.length),
        })

        return
      }
    }

    next()
  })

  // WebSocket proxy.
  const webSocketServer = new WebSocket.Server({
    noServer: true,
  })
  xo.on('stop', () => pFromCallback(cb => webSocketServer.close(cb)))

  express.on('upgrade', (req, socket, head) => {
    const { url } = req

    for (const prefix in opts) {
      if (startsWith(url, prefix)) {
        const target = opts[prefix]

        proxy.ws(req, socket, head, {
          target: target + url.slice(prefix.length),
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

const setUpApi = (webServer, xo, verboseLogsOnErrors) => {
  const webSocketServer = new WebSocket.Server({
    noServer: true,
  })
  xo.on('stop', () => pFromCallback(cb => webSocketServer.close(cb)))

  const onConnection = (socket, upgradeReq) => {
    const { remoteAddress } = upgradeReq.socket

    debug('+ WebSocket connection (%s)', remoteAddress)

    // Create the abstract XO object for this connection.
    const connection = xo.createUserConnection()
    connection.once('close', () => {
      socket.close()
    })

    // Create the JSON-RPC server for this connection.
    const jsonRpc = new JsonRpcPeer(message => {
      if (message.type === 'request') {
        return xo.callApiMethod(connection, message.method, message.params)
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
  }
  webServer.on('upgrade', (req, socket, head) => {
    if (req.url === '/api/') {
      webSocketServer.handleUpgrade(req, socket, head, ws =>
        onConnection(ws, req)
      )
    }
  })
}

// ===================================================================

const CONSOLE_PROXY_PATH_RE = /^\/api\/consoles\/(.*)$/

const setUpConsoleProxy = (webServer, xo) => {
  const webSocketServer = new WebSocket.Server({
    noServer: true,
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
        if (!(await xo.hasPermissions(user.id, [[id, 'operate']]))) {
          throw invalidCredentials()
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
    } catch (error) {
      console.error((error && error.stack) || error)
    }
  })
}

// ===================================================================

const USAGE = (({ name, version }) => `Usage: ${name} [--safe-mode]

${name} v${version}`)(require('../package.json'))

// ===================================================================

export default async function main (args) {
  if (includes(args, '--help') || includes(args, '-h')) {
    return USAGE
  }

  {
    const debug = createLogger('xo:perf')
    blocked(
      ms => {
        debug('blocked for %sms', ms | 0)
      },
      {
        threshold: 500,
      }
    )
  }

  const config = await loadConfiguration()

  const webServer = await createWebServer(config.http)

  // Now the web server is listening, drop privileges.
  try {
    const { user, group } = config
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

  // Creates main object.
  const xo = new Xo(config)

  // Register web server close on XO stop.
  xo.on('stop', () => pFromCallback(cb => webServer.stop(cb)))

  // Connects to all registered servers.
  await xo.start()

  // Trigger a clean job.
  await xo.clean()

  // Express is used to manage non WebSocket connections.
  const express = createExpressApp()

  if (config.http.redirectToHttps) {
    let port
    forEach(config.http.listen, listen => {
      if (listen.port && (listen.cert || listen.certificate)) {
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
    xo.emit('plugins:registered')
  }

  // Gracefully shutdown on signals.
  //
  // TODO: implements a timeout? (or maybe it is the services launcher
  // responsibility?)
  forEach(['SIGINT', 'SIGTERM'], signal => {
    let alreadyCalled = false

    process.on(signal, () => {
      if (alreadyCalled) {
        warn('forced exit')
        process.exit(1)
      }
      alreadyCalled = true

      debug('%s caught, closing…', signal)
      xo.stop()
    })
  })

  await fromEvent(xo, 'stopped')

  debug('bye :-)')
}
