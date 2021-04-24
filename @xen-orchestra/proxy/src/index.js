#!/usr/bin/env node

const APP_NAME = 'xo-proxy'
const APP_DIR = require('path').join(__dirname, '..')

// -------------------------------------------------------------------

{
  const { catchGlobalErrors } = require('@xen-orchestra/log/configure.js')

  catchGlobalErrors(require('@xen-orchestra/log').createLogger('xo:proxy'))
}

const { fatal, info, warn } = require('@xen-orchestra/log').createLogger('xo:proxy:bootstrap')

// -------------------------------------------------------------------

const main = async args => {
  const opts = require('getopts')(args, {
    boolean: ['help', 'safe-mode'],
    alias: {
      help: ['h'],
    },
  })

  if (opts.help) {
    const { name, version } = require('../package.json')
    // eslint-disable-next-line no-console
    console.log(
      '%s',
      `
${name} v${version}
`
    )
    return
  }

  info('starting')

  const config = await require('app-conf').load(APP_NAME, {
    appDir: APP_DIR,
    ignoreUnknownFormats: true,
  })

  let httpServer = new (require('http-server-plus'))({
    createSecureServer: (({ createSecureServer }) => opts => createSecureServer({ ...opts, allowHTTP1: true }))(
      require('http2')
    ),
  })

  const { readFileSync, outputFileSync, unlinkSync } = require('fs-extra')
  const retry = require('promise-toolbox/retry.js')

  require('lodash/forOwn.js')(config.http.listen, async ({ autoCert, cert, key, ...opts }) => {
    try {
      const niceAddress = await retry(
        async () => {
          if (cert !== undefined && key !== undefined) {
            try {
              opts.cert = readFileSync(cert)
              opts.key = readFileSync(key)
            } catch (error) {
              if (!(autoCert && error.code === 'ENOENT')) {
                throw error
              }

              const pems = await require('@xen-orchestra/self-signed').genSelfSignedCert()
              outputFileSync(cert, pems.cert, { flag: 'wx', mode: 0o400 })
              outputFileSync(key, pems.key, { flag: 'wx', mode: 0o400 })
              info('new certificate generated', { cert, key })
              opts.cert = pems.cert
              opts.key = pems.key
            }
          }

          return httpServer.listen(opts)
        },
        {
          tries: 2,
          when: e => autoCert && e.code === 'ERR_SSL_EE_KEY_TOO_SMALL',
          onRetry: () => {
            warn('deleting invalid certificate')
            unlinkSync(cert)
            unlinkSync(key)
          },
        }
      )

      info(`Web server listening on ${niceAddress}`)
    } catch (error) {
      if (error.niceAddress !== undefined) {
        warn(`Web server could not listen on ${error.niceAddress}`)

        const { code } = error
        if (code === 'EACCES') {
          warn('  Access denied.')
          warn('  Ports < 1024 are often reserved to privileges users.')
        } else if (code === 'EADDRINUSE') {
          warn('  Address already in use.')
        }
      } else {
        warn('web server could not listen', { error })
      }
    }
  })

  const { group, user } = config
  group != null && process.setgid(group)
  user != null && process.setuid(user)

  try {
    // The default value of 10 appears to be too small for interesting traces in xo-proxy.
    Error.stackTraceLimit = 20

    require('source-map-support/register.js')
  } catch (error) {
    warn(error)
  }

  httpServer = require('stoppable')(httpServer)

  const App = require('./app/index.js').default
  const app = new App({
    appDir: APP_DIR,
    appName: APP_NAME,
    config,
    httpServer,
    safeMode: opts['--safe-mode'],
  })

  // dont delay require to stopping phase because deps may no longer be there (eg on uninstall)
  const fromCallback = require('promise-toolbox/fromCallback.js')
  app.hooks.on('stop', () => fromCallback(cb => httpServer.stop(cb)))

  await app.hooks.start()

  // Gracefully shutdown on signals.
  let alreadyCalled = false
  ;['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
      if (alreadyCalled) {
        warn('forced exit')
        process.exit(1)
      }
      alreadyCalled = true

      info(`${signal} caught, stopping…`)
      app.hooks.stop()
    })
  })

  return require('promise-toolbox/fromEvent.js')(app.hooks, 'stopped')
}
main(process.argv.slice(2)).then(
  () => {
    info('bye :-)')
  },
  error => {
    fatal(error)

    process.exit(1)
  }
)
