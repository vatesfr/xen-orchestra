import appConf from 'app-conf'
import assert from 'assert'
import authenticator from 'otplib/authenticator'
import blocked from 'blocked-at'
import compression from 'compression'
import createExpress from 'express'
import createLogger from '@xen-orchestra/log'
import crypto from 'crypto'
import has from 'lodash/has'
import helmet from 'helmet'
import includes from 'lodash/includes'
import memoryStoreFactory from 'memorystore'
import ms from 'ms'
import proxyConsole from './proxy-console'
import pw from 'pw'
import serveStatic from 'serve-static'
import stoppable from 'stoppable'
import WebServer from 'http-server-plus'
import WebSocket from 'ws'
import xdg from 'xdg-basedir'
import { forOwn, map, merge, once } from 'lodash'
import { genSelfSignedCert } from '@xen-orchestra/self-signed'
import { parseDuration } from '@vates/parse-duration'
import { URL } from 'url'

import { compile as compilePug } from 'pug'
import { createServer as createProxyServer } from 'http-proxy'
import { fromCallback, fromEvent } from 'promise-toolbox'
import { ifDef } from '@xen-orchestra/defined'
import { join as joinPath } from 'path'

import JsonRpcPeer from 'json-rpc-peer'
import { invalidCredentials } from 'xo-common/api-errors'
import { ensureDir, outputFile, readdir, readFile } from 'fs-extra'

import ensureArray from './_ensureArray'
import Xo from './xo'

import bodyParser from 'body-parser'
import connectFlash from 'connect-flash'
import cookieParser from 'cookie-parser'
import expressSession from 'express-session'
import passport from 'passport'
import { parse as parseCookies } from 'cookie'
import { Strategy as LocalStrategy } from 'passport-local'

import transportConsole from '@xen-orchestra/log/transports/console'
import { configure } from '@xen-orchestra/log/configure'
import { generateToken } from './utils'

// ===================================================================

// https://github.com/yeojz/otplib#using-specific-otp-implementations
authenticator.options = { crypto }

// ===================================================================

configure([
  {
    filter: process.env.DEBUG,
    level: 'info',
    transport: transportConsole(),
  },
])

const log = createLogger('xo:main')

// ===================================================================

const APP_NAME = 'xo-server'

const DEPRECATED_ENTRIES = ['users', 'servers']

async function loadConfiguration() {
  const config = await appConf.load(APP_NAME, {
    appDir: joinPath(__dirname, '..'),
    ignoreUnknownFormats: true,
  })

  log.info('Configuration loaded.')

  // Print a message if deprecated entries are specified.
  DEPRECATED_ENTRIES.forEach(entry => {
    if (has(config, entry)) {
      log.warn(`${entry} configuration is deprecated.`)
    }
  })

  return config
}

const LOCAL_CONFIG_FILE = `${xdg.config}/${APP_NAME}/config.z-auto.json`
async function updateLocalConfig(diff) {
  // TODO lock file
  const localConfig = await readFile(LOCAL_CONFIG_FILE).then(JSON.parse, () => ({}))
  merge(localConfig, diff)
  await outputFile(LOCAL_CONFIG_FILE, JSON.stringify(localConfig), {
    mode: 0o600,
  })
}

// ===================================================================

async function createExpressApp(config) {
  const app = createExpress()

  app.use(helmet(config.http.helmet))

  app.use(compression())

  let { sessionSecret } = config.http
  if (sessionSecret === undefined) {
    sessionSecret = await generateToken()
    await updateLocalConfig({ http: { sessionSecret } })
  }

  // Registers the cookie-parser and express-session middlewares,
  // necessary for connect-flash.
  app.use(cookieParser(sessionSecret, config.http.cookies))
  const MemoryStore = memoryStoreFactory(expressSession)
  app.use(
    expressSession({
      cookie: config.http.cookies,
      resave: false,
      saveUninitialized: false,
      secret: sessionSecret,
      store: new MemoryStore({
        checkPeriod: 24 * 3600 * 1e3,
      }),
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

async function setUpPassport(express, xo, { authentication: authCfg, http: { cookies: cookieCfg } }) {
  const strategies = { __proto__: null }
  xo.registerPassportStrategy = (strategy, { label = strategy.label, name = strategy.name } = {}) => {
    passport.use(name, strategy)
    if (name !== 'local') {
      strategies[name] = label ?? name
    }

    return once(() => {
      passport.unuse(name)
      delete strategies[name]
    })
  }

  // Registers the sign in form.
  const signInPage = compilePug(await readFile(joinPath(__dirname, '..', 'signin.pug')))
  express.get('/signin', (req, res, next) => {
    res.send(
      signInPage({
        error: req.flash('error')[0],
        strategies,
      })
    )
  })

  express.get('/signout', (req, res) => {
    res.clearCookie('token', cookieCfg)
    res.redirect('/')
  })

  express.get('/signin-otp', (req, res, next) => {
    if (req.session.user === undefined) {
      return res.redirect('/signin')
    }

    res.send(
      signInPage({
        error: req.flash('error')[0],
        otp: true,
        strategies,
      })
    )
  })

  express.post('/signin-otp', (req, res, next) => {
    const { user } = req.session

    if (user === undefined) {
      return res.redirect(303, '/signin')
    }

    if (authenticator.check(req.body.otp, user.preferences.otp)) {
      setToken(req, res, next)
    } else {
      req.flash('error', 'Invalid code')
      res.redirect(303, '/signin-otp')
    }
  })

  const PERMANENT_VALIDITY = ifDef(authCfg.permanentCookieValidity, parseDuration)
  const SESSION_VALIDITY = ifDef(authCfg.sessionCookieValidity, parseDuration)
  const setToken = async (req, res, next) => {
    const { user, isPersistent } = req.session
    const token = await xo.createAuthenticationToken({
      expiresIn: isPersistent ? PERMANENT_VALIDITY : SESSION_VALIDITY,
      userId: user.id,
    })

    res.cookie('token', token.id, {
      ...cookieCfg,

      // a session (non-permanent) cookie must not have an expiration date
      // because it must not survive browser restart
      ...(isPersistent ? { expires: new Date(token.expiration) } : undefined),
    })

    delete req.session.isPersistent
    delete req.session.user
    res.redirect(303, req.flash('return-url')[0] || '/')
  }

  const SIGNIN_STRATEGY_RE = /^\/signin\/([^/]+)(\/callback)?(:?\?.*)?$/
  const UNCHECKED_URL_RE = /favicon|fontawesome|images|styles|\.(?:css|jpg|png)$/
  express.use(async (req, res, next) => {
    const { url } = req

    if (UNCHECKED_URL_RE.test(url)) {
      return next()
    }

    const matches = url.match(SIGNIN_STRATEGY_RE)
    if (matches) {
      return passport.authenticate(matches[1], async (err, user, info) => {
        if (err) {
          return next(err)
        }

        if (!user) {
          req.flash('error', info ? info.message : 'Invalid credentials')
          return res.redirect(303, '/signin')
        }

        req.session.user = { id: user.id, preferences: user.preferences }
        req.session.isPersistent = matches[1] === 'local' && req.body['remember-me'] === 'on'

        if (user.preferences?.otp !== undefined) {
          return res.redirect(303, '/signin-otp')
        }

        setToken(req, res, next)
      })(req, res, next)
    }

    if (req.cookies.token) {
      next()
    } else {
      req.flash('return-url', url)
      res.redirect(authCfg.defaultSignInPage)
    }
  })

  // Install the local strategy.
  xo.registerPassportStrategy(
    new LocalStrategy({ passReqToCallback: true }, async (req, username, password, done) => {
      try {
        const { user } = await xo.authenticateUser({ username, password }, { ip: req.ip })
        done(null, user)
      } catch (error) {
        done(null, false, { message: error.message })
      }
    })
  )
}

// ===================================================================

async function registerPlugin(pluginPath, pluginName) {
  const plugin = require(pluginPath)
  const { description, version = 'unknown' } = (() => {
    try {
      return require(pluginPath + '/package.json')
    } catch (_) {
      return {}
    }
  })()

  // Supports both “normal” CommonJS and Babel's ES2015 modules.
  let { default: factory = plugin, configurationSchema, configurationPresets, testSchema } = plugin
  let instance

  const config = this._config
  const handleFactory = factory =>
    typeof factory === 'function'
      ? factory({
          staticConfig: config.plugins?.[pluginName] ?? {},
          xo: this,
          getDataDir: () => {
            const dir = `${config.datadir}/${pluginName}`
            return ensureDir(dir).then(() => dir)
          },
        })
      : factory
  ;[instance, configurationSchema, configurationPresets, testSchema] = await Promise.all([
    handleFactory(factory),
    handleFactory(configurationSchema),
    handleFactory(configurationPresets),
    handleFactory(testSchema),
  ])

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

const logPlugin = createLogger('xo:plugin')

function registerPluginWrapper(pluginPath, pluginName) {
  logPlugin.info(`register ${pluginName}`)

  return registerPlugin.call(this, pluginPath, pluginName).then(
    () => {
      logPlugin.info(`successfully register ${pluginName}`)
    },
    error => {
      logPlugin.info(`failed register ${pluginName}`)
      logPlugin.info(error)
    }
  )
}

async function registerPluginsInPath(path, prefix) {
  const files = await readdir(path).catch(error => {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  })

  await Promise.all(
    files.map(name => {
      if (name.startsWith(prefix)) {
        return registerPluginWrapper.call(this, `${path}/${name}`, name.slice(prefix.length))
      }
    })
  )
}

async function registerPlugins(xo) {
  await Promise.all(
    [`${__dirname}/../node_modules`, '/usr/local/lib/node_modules'].map(path =>
      Promise.all([
        registerPluginsInPath.call(xo, path, 'xo-server-'),
        registerPluginsInPath.call(xo, `${path}/@xen-orchestra`, 'server-'),
      ])
    )
  )
}

// ===================================================================

async function makeWebServerListen(
  webServer,
  {
    autoCert = true,

    certificate,

    // The properties was called `certificate` before.
    cert = certificate,

    key,
    ...opts
  }
) {
  try {
    if (cert && key) {
      try {
        ;[opts.cert, opts.key] = await Promise.all([readFile(cert), readFile(key)])
        if (opts.key.includes('ENCRYPTED')) {
          opts.passphrase = await new Promise(resolve => {
            // eslint-disable-next-line no-console
            console.log('Encrypted key %s', key)
            process.stdout.write(`Enter pass phrase: `)
            pw(resolve)
          })
        }
      } catch (error) {
        if (!(autoCert && error.code === 'ENOENT')) {
          throw error
        }

        const pems = await genSelfSignedCert()
        await Promise.all([
          outputFile(cert, pems.cert, { flag: 'wx', mode: 0o400 }),
          outputFile(key, pems.key, { flag: 'wx', mode: 0o400 }),
        ])
        log.info('new certificate generated', { cert, key })
        opts.cert = pems.cert
        opts.key = pems.key
      }
    }

    const niceAddress = await webServer.listen(opts)
    log.info(`Web server listening on ${niceAddress}`)
  } catch (error) {
    if (error.niceAddress) {
      log.warn(`Web server could not listen on ${error.niceAddress}`, { error })

      const { code } = error
      if (code === 'EACCES') {
        log.warn('  Access denied.')
        log.warn('  Ports < 1024 are often reserved to privileges users.')
      } else if (code === 'EADDRINUSE') {
        log.warn('  Address already in use.')
      }
    } else {
      log.warn('Web server could not listen:', { error })
    }
  }
}

async function createWebServer({ listen, listenOptions }) {
  const webServer = stoppable(new WebServer())

  await Promise.all(map(listen, opts => makeWebServerListen(webServer, { ...listenOptions, ...opts })))

  return webServer
}

// ===================================================================

const setUpProxies = (express, opts, xo) => {
  if (!opts) {
    return
  }

  const proxy = createProxyServer({
    changeOrigin: true,
    ignorePath: true,
    xfwd: true,
  }).on('error', (error, req, res) => {
    // `res` can be either a `ServerResponse` or a `Socket` (which does not have
    // `writeHead`)
    if (!res.headersSent && typeof res.writeHead === 'function') {
      res.writeHead(500, { 'content-type': 'text/plain' })
      res.write('There was a problem proxying this request.')
    }
    res.end()

    const { method, url } = req
    log.error('failed to proxy request', {
      error,
      req: { method, url },
    })
  })

  // TODO: sort proxies by descending prefix length.

  // HTTP request proxy.
  express.use((req, res, next) => {
    const { url } = req

    for (const prefix in opts) {
      if (url.startsWith(prefix)) {
        const target = opts[prefix]

        proxy.web(req, res, {
          agent: new URL(target).hostname === 'localhost' ? undefined : xo.httpAgent,
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
  xo.on('stop', () => fromCallback.call(webSocketServer, 'close'))

  express.on('upgrade', (req, socket, head) => {
    const { url } = req

    for (const prefix in opts) {
      if (url.startsWith(prefix)) {
        const target = opts[prefix]

        proxy.ws(req, socket, head, {
          agent: new URL(target).hostname === 'localhost' ? undefined : xo.httpAgent,
          target: target + url.slice(prefix.length),
        })

        return
      }
    }
  })
}

// ===================================================================

const setUpStaticFiles = (express, opts) => {
  forOwn(opts, (paths, url) => {
    ensureArray(paths).forEach(path => {
      log.info(`Setting up ${url} → ${path}`)

      express.use(url, serveStatic(path))
    })
  })
}

// ===================================================================

const setUpApi = (webServer, xo, config) => {
  const webSocketServer = new WebSocket.Server({
    ...config.apiWebSocketOptions,

    noServer: true,
  })
  xo.on('stop', () => fromCallback.call(webSocketServer, 'close'))

  const onConnection = (socket, upgradeReq) => {
    const { remoteAddress } = upgradeReq.socket

    log.info(`+ WebSocket connection (${remoteAddress})`)

    // Create the abstract XO object for this connection.
    const connection = xo.createUserConnection()
    connection.set('user_ip', remoteAddress)
    connection.once('close', () => {
      socket.close()
    })

    // Create the JSON-RPC server for this connection.
    const jsonRpc = new JsonRpcPeer(message => {
      if (message.type === 'request') {
        return xo.callApiMethod(connection, message.method, message.params)
      }
    })
    connection.notify = jsonRpc.notify.bind(jsonRpc)

    // Close the XO connection with this WebSocket.
    socket.once('close', () => {
      log.info(`- WebSocket connection (${remoteAddress})`)

      connection.close()
    })

    // Connect the WebSocket to the JSON-RPC server.
    socket.on('message', message => {
      const expiration = connection.get('expiration', undefined)
      if (expiration !== undefined && expiration < Date.now()) {
        connection.close()
        return
      }

      jsonRpc.write(message)
    })

    const onSend = error => {
      if (error) {
        log.warn('WebSocket send:', { error })
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
      webSocketServer.handleUpgrade(req, socket, head, ws => onConnection(ws, req))
    }
  })
}

// ===================================================================

const CONSOLE_PROXY_PATH_RE = /^\/api\/consoles\/(.*)$/

const setUpConsoleProxy = (webServer, xo) => {
  const webSocketServer = new WebSocket.Server({
    noServer: true,
  })
  xo.on('stop', () => fromCallback.call(webSocketServer, 'close'))

  webServer.on('upgrade', async (req, socket, head) => {
    const matches = CONSOLE_PROXY_PATH_RE.exec(req.url)
    if (!matches) {
      return
    }

    const [, id] = matches
    try {
      const vm = xo.getXapiObject(id, ['VM', 'VM-controller'])

      // TODO: factorize permissions checking in an Express middleware.
      {
        const { token } = parseCookies(req.headers.cookie)

        const { user } = await xo.authenticateUser({ token })
        if (!(await xo.hasPermissions(user.id, [[id, 'operate']]))) {
          throw invalidCredentials()
        }

        const { remoteAddress } = socket
        log.info(`+ Console proxy (${user.name} - ${remoteAddress})`)

        const data = {
          timestamp: Date.now(),
          userId: user.id,
          userIp: remoteAddress,
          userName: user.name,
        }

        if (vm.is_control_domain) {
          const host = vm.$resident_on
          data.hostDescription = host.name_description
          data.hostName = host.name_label
          data.hostUuid = host.uuid
        } else {
          data.vmDescription = vm.name_description
          data.vmName = vm.name_label
          data.vmUuid = vm.uuid
        }

        xo.emit('xo:audit', 'consoleOpened', data)

        socket.on('close', () => {
          xo.emit('xo:audit', 'consoleClosed', {
            ...data,
            timestamp: Date.now(),
          })
          log.info(`- Console proxy (${user.name} - ${remoteAddress})`)
        })
      }

      const xapi = vm.$xapi
      const vmConsole = xapi.getVmConsole(id)

      // FIXME: lost connection due to VM restart is not detected.
      webSocketServer.handleUpgrade(req, socket, head, connection => {
        proxyConsole(connection, vmConsole, xapi.sessionId)
      })
    } catch (error) {
      try {
        socket.end()
      } catch (_) {}
      console.error((error && error.stack) || error)
    }
  })
}

// ===================================================================

const USAGE = (({ name, version }) => `Usage: ${name} [--safe-mode]

${name} v${version}`)(require('../package.json'))

// ===================================================================

export default async function main(args) {
  // makes sure the global Promise has not been changed by a lib
  assert(global.Promise === require('bluebird'))

  if (includes(args, '--help') || includes(args, '-h')) {
    return USAGE
  }

  const config = await loadConfiguration()

  {
    const { enabled, ...options } = config.blockedAtOptions
    if (enabled) {
      const logPerf = createLogger('xo:perf')
      blocked((time, stack) => {
        logPerf.info(`blocked for ${ms(time)}`, {
          time,
          stack,
        })
      }, options)
    }
  }

  const webServer = await createWebServer(config.http)

  // Now the web server is listening, drop privileges.
  try {
    const { user, group } = config
    if (group) {
      process.setgid(group)
      log.info(`Group changed to ${group}`)
    }
    if (user) {
      process.setuid(user)
      log.info(`User changed to ${user}`)
    }
  } catch (error) {
    log.warn('Failed to change user/group:', { error })
  }

  // Creates main object.
  const xo = new Xo(config)

  // Register web server close on XO stop.
  xo.on('stop', () => fromCallback.call(webServer, 'stop'))

  // Connects to all registered servers.
  await xo.start()

  // Trigger a clean job.
  await xo.clean()

  // Express is used to manage non WebSocket connections.
  const express = await createExpressApp(config)

  if (config.http.redirectToHttps) {
    let port
    forOwn(config.http.listen, listen => {
      if (listen.port && (listen.cert || listen.certificate)) {
        port = listen.port
        return false
      }
    })

    if (port === undefined) {
      log.warn('Could not setup HTTPs redirection: no HTTPs port found')
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
  express.use(xo._handleHttpRequest.bind(xo))

  // Everything above is not protected by the sign in, allowing xo-cli
  // to work properly.
  await setUpPassport(express, xo, config)

  // Attaches express to the web server.
  webServer.on('request', express)
  webServer.on('upgrade', (req, socket, head) => {
    express.emit('upgrade', req, socket, head)
  })

  // Must be set up before the static files.
  setUpApi(webServer, xo, config)

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
  ;['SIGINT', 'SIGTERM'].forEach(signal => {
    let alreadyCalled = false

    process.on(signal, () => {
      if (alreadyCalled) {
        log.warn('forced exit')
        process.exit(1)
      }
      alreadyCalled = true

      log.info(`${signal} caught, closing…`)
      xo.stop()
    })
  })

  await fromEvent(xo, 'stopped')

  log.info('bye :-)')
}
