const compilePug = require('pug').compile
const createProxyServer = require('http-proxy').createServer
const JsonRpcPeer = require('json-rpc-peer')
const LocalStrategy = require('passport-local').Strategy
const parseCookies = require('cookie').parse
const Passport = require('passport')
const serveStatic = require('serve-static')
const WebSocket = require('ws')
const { fromCallback } = require('promise-toolbox')
const { invalidCredentials } = require('xo-common/api-errors')
const { readFile } = require('fs')

const proxyConsole = require('../proxy-console')

const { debug, warn } = require('@xen-orchestra/log').createLogger('front')

function createExpressApp ({ http: config }, httpServer) {
  const express = require('express')()

  express.use(require('helmet')())

  if (config.redirectToHttps) {
    const https = config.listen.find(
      _ =>
        _.port !== undefined &&
        (_.cert !== undefined || _.certificate !== undefined)
    )

    if (https === undefined) {
      warn('could not setup HTTPs redirection: no HTTPs config found')
    } else {
      const { port } = https
      express.use((req, res, next) => {
        if (req.secure) {
          return next()
        }

        res.redirect(`https://${req.hostname}:${port}${req.originalUrl}`)
      })
    }
  }

  Object.keys(config.mounts).forEach(url => {
    const paths = config.mounts[url]
    ;(Array.isArray(paths) ? paths : [paths]).forEach(path => {
      debug('Setting up %s → %s', url, path)

      express.use(url, serveStatic(path))
    })
  })

  return express
}

function setUpApi (config, httpServer, xo) {
  const webSocketServer = new WebSocket.Server({
    noServer: true,
  })
  xo.on('stop', () => fromCallback(cb => webSocketServer.close(cb)))

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
    connection.notify = jsonRpc.notify.bind(jsonRpc)

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
  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url === '/api/') {
      webSocketServer.handleUpgrade(req, socket, head, ws =>
        onConnection(ws, req)
      )
    }
  })
}

function setUpConsoleProxy (httpServer, xo) {
  const webSocketServer = new WebSocket.Server({
    noServer: true,
  })

  const CONSOLE_PROXY_PATH_RE = /^\/api\/consoles\/(.*)$/
  httpServer.on('upgrade', async (req, socket, head) => {
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
        if (!await xo.hasPermissions(user.id, [[id, 'operate']])) {
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

async function setUpPassport (express, xo) {
  // necessary for connect-flash
  express.use(require('cookie-parser')())
  express.use(
    require('express-session')({
      resave: false,
      saveUninitialized: false,

      // TODO: should be in the config file.
      secret: 'CLWguhRZAZIXZcbrMzHCYmefxgweItKnS',
    })
  )

  // necessary for Passport to display error messages
  express.use(require('connect-flash')())

  // necessary for Passport to access the username and password from the sign
  // in form
  express.use(require('body-parser').urlencoded({ extended: false }))

  express.use(Passport.initialize())

  const strategies = { __proto__: null }
  xo.registerPassportStrategy = strategy => {
    Passport.use(strategy)

    const { name } = strategy
    if (name !== 'local') {
      strategies[name] = strategy.label || name
    }
  }

  // Registers the sign in form.
  const signInPage = compilePug(
    await fromCallback(cb => readFile(`${__dirname}/../signin.pug`, cb))
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

    if (matches !== null) {
      return Passport.authenticate(matches[1], async (err, user, info) => {
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

function setUpProxies ({ http: { proxies } }, httpServer, express, xo) {
  if (proxies === undefined) {
    return
  }

  const proxy = createProxyServer({
    ignorePath: true,
  }).on('error', error => console.error(error))

  const prefixes = Object.keys(proxies).sort((a, b) => a.length - b.length)
  const n = prefixes.length

  // HTTP request proxy.
  express.use((req, res, next) => {
    const { url } = req

    for (let i = 0; i < n; ++i) {
      const prefix = prefixes[i]
      if (url.startsWith(prefix)) {
        const target = proxies[prefix]

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
  xo.on('stop', () => fromCallback(cb => webSocketServer.close(cb)))

  httpServer.on('upgrade', (req, socket, head) => {
    const { url } = req

    for (let i = 0; i < n; ++i) {
      const prefix = prefixes[i]
      if (url.startsWith(prefix)) {
        const target = proxies[prefix]

        proxy.ws(req, socket, head, {
          target: target + url.slice(prefix.length),
        })

        return
      }
    }
  })
}

export default async function main ({ config, httpServer, safeMode }) {
  const express = createExpressApp(config, httpServer)

  setUpProxies(config, httpServer, express, xo)

  setUpApi(config, httpServer, xo)

  // must be set up before the API
  setUpConsoleProxy(httpServer, xo)

  await setUpPassport(express, xo)

  // TODO: express.use(xo._handleHttpRequest.bind(xo))
}
