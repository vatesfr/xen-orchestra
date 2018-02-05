#!/usr/bin/env node

const APP_NAME = 'xo-server'

// -------------------------------------------------------------------

const { info, warn } = require('@xen-orchestra/log').default('bootstrap')

process.on('unhandledRejection', reason => {
  warn('possibly unhandled rejection', reason)
})
;(({ prototype }) => {
  const { emit } = prototype
  prototype.emit = function (event, error) {
    event === 'error' && !this.listenerCount(event)
      ? warn('unhandled error event', error)
      : emit.apply(this, arguments)
  }
})(require('events').EventEmitter)

const Bluebird = require('bluebird')
Bluebird.longStackTraces()
global.Promise = Bluebird

// -------------------------------------------------------------------

const main = async args => {
  info('starting')

  const config = await require('app-conf').load(APP_NAME)

  const httpServer = new (require('http-server-plus'))()

  const readFile = Bluebird.promisify(require('fs').readFile)
  await require('@xen-orchestra/async-map').default(
    config.http.listen,
    async ({
      certificate,
      // The properties was called `certificate` before.
      cert = certificate,
      key,
      ...opts
    }) => {
      if (cert !== undefined && key !== undefined) {
        [opts.cert, opts.key] = await Promise.all([
          readFile(cert),
          readFile(key),
        ])
      }

      try {
        const niceAddress = await httpServer.listen(opts)
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
          warn('Web server could not listen', error)
        }
      }
    }
  )

  try {
    const { group, user } = config
    group != null && process.setgid(group)
    user != null && process.setuid(user)
  } catch (error) {
    warn('failed to change group/user', error)
  }

  global.Observable = require('zen-observable')

  const App = require('./app').default
  const app = new App({
    appName: APP_NAME,
    config,
    httpServer,
    safeMode: require('lodash/includes')(args, '--safe-mode'),
  })
  await app.start()

  // Gracefully shutdown on signals.
  //
  // TODO: implements a timeout? (or maybe it is the services launcher
  // responsibility?)
  require('lodash/forEach')(['SIGINT', 'SIGTERM'], signal => {
    let alreadyCalled = false

    process.on(signal, () => {
      if (alreadyCalled) {
        warn('forced exit')
        process.exit(1)
      }
      alreadyCalled = true

      info(`${signal} caught, closing…`)
      app.stop()
    })
  })

  return require('event-to-promise')(app, 'stopped')
}
main(process.argv.slice(2)).then(
  () => info('bye :-)'),
  error => warn('fatal error', error)
)
