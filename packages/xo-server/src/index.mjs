import appConf from 'app-conf'
import assert from 'assert'
import blocked from 'blocked-at'
import Bluebird from 'bluebird'
import compression from 'compression'
import createExpress from 'express'
import forOwn from 'lodash/forOwn.js'
import has from 'lodash/has.js'
import helmet from 'helmet'
import httpProxy from 'http-proxy'
import includes from 'lodash/includes.js'
import memoryStoreFactory from 'memorystore'
import merge from 'lodash/merge.js'
import ms from 'ms'
import once from 'lodash/once.js'
import proxyAddr from 'proxy-addr'
import proxyConsole from './proxy-console.mjs'
import pw from 'pw'
import serveStatic from 'serve-static'
import stoppable from 'stoppable'
import WebServer from 'http-server-plus'
import WebSocket, { WebSocketServer } from 'ws'
import { asyncMap } from '@xen-orchestra/async-map'
import { xdgConfig } from 'xdg-basedir'
import { createLogger } from '@xen-orchestra/log'
import { createRequire } from 'module'
import { parseDuration } from '@vates/parse-duration'
import { readCert } from '@xen-orchestra/self-signed/readCert'
import { URL } from 'url'
import { verifyTotp } from '@vates/otp'

import { compile as compilePug } from 'pug'
import { fromCallback, fromEvent } from 'promise-toolbox'
import { ifDef } from '@xen-orchestra/defined'

import fse from 'fs-extra'
import { invalidCredentials } from 'xo-common/api-errors.js'
import { Peer as JsonRpcPeer } from 'json-rpc-peer'

import ensureArray from './_ensureArray.mjs'
import Xo from './xo.mjs'

import bodyParser from 'body-parser'
import connectFlash from 'connect-flash'
import cookieParser from 'cookie-parser'
import expressSession from 'express-session'
import passport from 'passport'
import { parse as parseCookies } from 'cookie'
import { Strategy as LocalStrategy } from 'passport-local'

import transportConsole from '@xen-orchestra/log/transports/console'
import { configure } from '@xen-orchestra/log/configure'
import { generateToken } from './utils.mjs'
import { ProxyAgent } from 'proxy-agent'

// ===================================================================

const APP_DIR = new URL('..', import.meta.url).pathname
const [APP_NAME, APP_VERSION] = (() => {
  const { name, version } = JSON.parse(fse.readFileSync(new URL('../package.json', import.meta.url)))
  return [name, version]
})()

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

const DEPRECATED_ENTRIES = ['users', 'servers']

async function loadConfiguration() {
  const config = await appConf.load(APP_NAME, {
    appDir: APP_DIR,
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

const LOCAL_CONFIG_FILE = `${xdgConfig}/${APP_NAME}/config.z-auto.json`
async function updateLocalConfig(diff) {
  // TODO lock file
  const localConfig = await fse.readFile(LOCAL_CONFIG_FILE).then(JSON.parse, () => ({}))
  merge(localConfig, diff)
  await fse.outputFile(LOCAL_CONFIG_FILE, JSON.stringify(localConfig), {
    mode: 0o600,
  })
}

// ===================================================================

async function createExpressApp(config) {
  const app = createExpress()

  // For a nicer API
  //
  // https://expressjs.com/en/api.html#app.set
  app.set('json spaces', 2)

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
  const signInPage = compilePug(await fse.readFile(new URL('../signin.pug', import.meta.url)))
  express.get('/signin', async (req, res, next) => {
    try {
      let errorMsg
      const tokenId = req.query.token
      if (tokenId !== undefined) {
        try {
          const token = await xo.getAuthenticationToken(tokenId)

          req.session.isPersistent = req.query
          return saveToken(token, req, res, next)
        } catch (error) {
          errorMsg = error.message
        }
      } else {
        errorMsg = req.flash('error')[0]
      }
      res.send(
        signInPage({
          error: errorMsg,
          strategies,
        })
      )
    } catch (error) {
      next(error)
    }
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

  express.post('/signin-otp', async (req, res, next) => {
    const { user } = req.session

    if (user === undefined) {
      return res.redirect(303, '/signin')
    }

    if (await verifyTotp(req.body.otp, { secret: user.preferences.otp })) {
      createAndSaveToken(req, res, next)
    } else {
      req.flash('error', 'Invalid code')
      res.redirect(303, '/signin-otp')
    }
  })

  const PERMANENT_VALIDITY = ifDef(authCfg.permanentCookieValidity, parseDuration)
  const SESSION_VALIDITY = ifDef(authCfg.sessionCookieValidity, parseDuration)
  const TEN_YEARS = 10 * 365 * 24 * 60 * 60 * 1e3
  const createAndSaveToken = async (req, res, next) => {
    let { clientId } = req.cookies
    if (clientId === undefined) {
      clientId = Math.random().toString(36).slice(2)
      res.cookie('clientId', clientId, {
        ...cookieCfg,

        // no reason for this entry to ever expire, can be set to a long duration
        maxAge: TEN_YEARS,
      })
    }

    const { user, isPersistent } = req.session
    const token = await xo.createAuthenticationToken({
      client: {
        id: clientId,
      },
      description: req.get('user-agent') ?? 'unknown browser',
      expiresIn: isPersistent ? PERMANENT_VALIDITY : SESSION_VALIDITY,
      userId: user.id,
    })
    delete req.session.user

    return saveToken(token, req, res, next)
  }
  const saveToken = async (token, req, res, next) => {
    res.cookie('token', token.id, {
      ...cookieCfg,

      // a session (non-permanent) cookie must not have an expiration date
      // because it must not survive browser restart
      ...(req.session.isPersistent ? { expires: new Date(token.expiration) } : undefined),
    })

    delete req.session.isPersistent
    res.redirect(303, req.flash('return-url')[0] || '/')
  }

  const SIGNIN_STRATEGY_RE = /^\/signin\/([^/]+)(\/callback)?(:?\?.*)?$/
  const UNCHECKED_URL_RE =
    /(?:^\/rest\/)|favicon|manifest\.webmanifest|fontawesome|images|styles|\.(?:css|jpg|png|svg)$/
  express.use(async (req, res, next) => {
    const { url } = req

    if (UNCHECKED_URL_RE.test(url)) {
      return next()
    }

    const matches = url.match(SIGNIN_STRATEGY_RE)
    if (matches !== null) {
      let provider = matches[1]
      if (provider === 'dispatch') {
        provider = req.body.provider
      }

      // directly from the signin form, not a callback
      if (matches[2] === undefined) {
        req.session.isPersistent = req.body['remember-me'] === 'on'
      }

      return passport.authenticate(provider, async (err, user, info) => {
        if (err) {
          return next(err)
        }

        if (!user) {
          req.flash('error', info ? info.message : 'Invalid credentials')
          return res.redirect(303, '/signin')
        }

        req.session.user = { id: user.id, preferences: user.preferences }

        if (user.preferences?.otp !== undefined) {
          return res.redirect(303, '/signin-otp')
        }

        createAndSaveToken(req, res, next)
      })(req, res, next)
    }

    const { token } = req.cookies
    if (token !== undefined && (await xo.isValidAuthenticationToken(token))) {
      next()
    } else {
      req.flash('return-url', url)
      res.redirect(xo.config.get('authentication.defaultSignInPage'))
    }
  })

  // Install the local strategy.
  xo.registerPassportStrategy(
    new LocalStrategy({ passReqToCallback: true }, async (req, username, password, done) => {
      try {
        const { user } = await xo.authenticateUser(
          { username, password },
          { ip: req.ip },
          {
            // OTP is handled differently in the web auth process
            bypassOtp: true,
          }
        )
        done(null, user)
      } catch (error) {
        done(null, false, { message: error.message })
      }
    })
  )
}

// ===================================================================

const logPlugin = createLogger('xo:plugin')

// See https://github.com/nodejs/help/issues/3380
const requireResolve = createRequire(import.meta.url).resolve

async function registerPlugin(pluginPath, pluginName) {
  const plugin = (await import(requireResolve(pluginPath))).default
  const {
    description,
    keywords,
    version = 'unknown',
  } = await fse
    .readFile(pluginPath + '/package.json')
    .then(JSON.parse)
    .catch(error => {
      logPlugin.warn('reading package.json', { error })
      return {}
    })

  // Supports both “normal” CommonJS and Babel's ES2015 modules.
  let { default: factory = plugin, configurationSchema, configurationPresets, testSchema } = plugin
  let instance

  const datadir = this.config.get('datadir')
  const pluginsConfig = this.config.get('plugins')
  const handleFactory = factory =>
    typeof factory === 'function'
      ? factory({
          staticConfig: pluginsConfig[pluginName] ?? {},
          xo: this,
          getDataDir: () => {
            const dir = `${datadir}/${pluginName}`
            return fse.ensureDir(dir).then(() => dir)
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
    keywords,
    testSchema,
    version
  )
}

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

async function findPluginsInPath(path, prefix) {
  const entries = await fse.readdir(path).catch(error => {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  })

  for (const entry of entries) {
    if (entry.startsWith(prefix)) {
      const pluginName = entry.slice(prefix.length)
      if (!this.has(pluginName)) {
        this.set(pluginName, path + '/' + entry)
      }
    }
  }
}

async function registerPlugins(xo) {
  const pluginPaths = new Map()
  for (const path of xo.config.get('plugins.lookupPaths')) {
    await findPluginsInPath.call(pluginPaths, `${path}/@xen-orchestra`, 'server-')
    await findPluginsInPath.call(pluginPaths, path, 'xo-server-')
  }

  await Promise.all(Array.from(pluginPaths.entries(), ([name, path]) => registerPluginWrapper.call(xo, path, name)))
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

    configKey,

    ...opts
  }
) {
  try {
    const useAcme = autoCert && opts.acmeDomain !== undefined

    // don't pass these entries to httpServer.listen(opts)
    for (const key of Object.keys(opts).filter(_ => _.startsWith('acme'))) {
      delete opts[key]
    }

    let niceAddress
    if (cert && key) {
      if (useAcme) {
        opts.SNICallback = async (serverName, callback) => {
          try {
            // injected by mixins/SslCertificate
            const secureContext = await webServer.getSecureContext(serverName, configKey, opts.cert, opts.key)
            callback(null, secureContext)
          } catch (error) {
            log.warn(error)
            callback(error, null)
          }
        }
      }

      niceAddress = await readCert(cert, key, {
        autoCert,
        info: log.info,
        warn: log.warn,
        async use({ cert, key }) {
          if (key.includes('ENCRYPTED')) {
            opts.passphrase = await new Promise(resolve => {
              // eslint-disable-next-line no-console
              console.log('Encrypted key %s', key)
              process.stdout.write(`Enter pass phrase: `)
              pw(resolve)
            })
          }

          opts.cert = cert
          opts.key = key

          return webServer.listen(opts)
        },
      })
    } else {
      niceAddress = await webServer.listen(opts)
    }

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
  await asyncMap(Object.entries(listen), ([configKey, opts]) =>
    makeWebServerListen(webServer, { ...listenOptions, ...opts, configKey })
  )

  return webServer
}

// ===================================================================

const setUpProxies = (express, opts, xo) => {
  if (!opts) {
    return
  }

  const proxy = httpProxy
    .createServer({
      changeOrigin: true,
      ignorePath: true,
      xfwd: true,
    })
    .on('error', (error, req, res) => {
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
  const webSocketServer = new WebSocketServer({
    noServer: true,
  })
  xo.hooks.on('stop', () => fromCallback.call(webSocketServer, 'close'))

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

const setUpApi = (webServer, xo, config, useForwardedHeaders) => {
  const webSocketServer = new WebSocketServer({
    ...config.apiWebSocketOptions,

    noServer: true,
  })
  xo.hooks.on('stop', () => fromCallback.call(webSocketServer, 'close'))

  const onConnection = (socket, upgradeReq) => {
    const remoteAddress = proxyAddr(upgradeReq, useForwardedHeaders)

    // Create the abstract XO object for this connection.
    const connection = xo.createApiConnection(remoteAddress)
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
        // even if the readyState of the socket is checked, it can still happen
        // that the message failed to be sent because the connection was closed.
        if (error.code !== 'ERR_STREAM_DESTROYED') {
          log.warn('WebSocket send:', { error })
        }
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

const setUpConsoleProxy = (webServer, xo, useForwardedHeaders) => {
  const webSocketServer = new WebSocketServer({
    noServer: true,
  })
  xo.hooks.on('stop', () => fromCallback.call(webSocketServer, 'close'))

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

        const remoteAddress = proxyAddr(req, useForwardedHeaders)

        const { user } = await xo.authenticateUser({ token }, { ip: remoteAddress })
        if (!(await xo.hasPermissions(user.id, [[id, 'operate']]))) {
          throw invalidCredentials()
        }

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

      const serverId = xo.getXenServerIdByObject(id, ['VM', 'VM-controller'])
      const server = await xo.getXenServer(serverId)
      const agent =
        server.httpProxy &&
        new ProxyAgent({
          getProxyForUrl: () => server.httpProxy,
          rejectUnauthorized: !server.allowUnauthorized,
        })

      // FIXME: lost connection due to VM restart is not detected.
      webSocketServer.handleUpgrade(req, socket, head, connection => {
        proxyConsole(connection, vmConsole, xapi.sessionId, agent)
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

const USAGE = `Usage: ${APP_NAME} [--safe-mode]

${APP_NAME} v${APP_VERSION}`

// ===================================================================

export default async function main(args) {
  // makes sure the global Promise has not been changed by a lib
  assert(global.Promise === Bluebird)

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

  // Attaches express to the web server.
  webServer.on('request', (req, res) => {
    // don't redirect let's encrypt challenge to https
    if (req.url.startsWith('/.well')) {
      return
    }
    // don't handle proxy requests
    if (req.url.startsWith('/')) {
      return express(req, res)
    }
  })
  webServer.on('upgrade', (req, socket, head) => {
    express.emit('upgrade', req, socket, head)
  })

  const safeMode = includes(args, '--safe-mode')

  // Creates main object.
  const xo = new Xo({
    appDir: APP_DIR,
    appName: APP_NAME,
    appVersion: APP_VERSION,
    config,
    express,
    httpServer: webServer,
    safeMode,
  })

  // Register web server close on XO stop.
  xo.hooks.on('stop', () => fromCallback.call(webServer, 'stop'))

  // Connects to all registered servers.
  await xo.hooks.start()

  // Trigger a clean job.
  await xo.hooks.clean()

  const useForwardedHeaders = (() => {
    // recompile the fonction when the setting change
    let useForwardedHeaders
    xo.config.watch('http.useForwardedHeaders', val => {
      useForwardedHeaders = typeof val === 'boolean' ? () => val : proxyAddr.compile(val)
    })

    return (...args) => useForwardedHeaders(...args)
  })()

  express.set('trust proxy', useForwardedHeaders)

  // Must be set up before the API.
  setUpConsoleProxy(webServer, xo, useForwardedHeaders)

  // Must be set up before the API.
  express.use(xo._handleHttpRequest.bind(xo))

  setUpStaticFiles(express, config.http.publicMounts)

  // Everything above is not protected by the sign in, allowing xo-cli
  // to work properly.
  await setUpPassport(express, xo, config)

  // Must be set up before the static files.
  setUpApi(webServer, xo, config, useForwardedHeaders)

  setUpProxies(express, config.http.proxies, xo)

  setUpStaticFiles(express, config.http.mounts)

  if (!safeMode) {
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
        // eslint-disable-next-line n/no-process-exit
        process.exit(1)
      }
      alreadyCalled = true

      log.info(`${signal} caught, closing…`)
      xo.hooks.stop()
    })
  })

  await fromEvent(xo.hooks, 'stopped')

  log.info('bye :-)')
}
