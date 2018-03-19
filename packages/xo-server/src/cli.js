#!/usr/bin/env node

const APP_NAME = 'xo-server'

// Enable xo logs by default.
if (process.env.DEBUG === undefined) {
  process.env.DEBUG = 'app-conf,xo:*,-xo:api'
}

// -------------------------------------------------------------------

require('@xen-orchestra/log/configure').configure([
  {
    filter: process.env.DEBUG,
    level: 'warn',

    transport: require('@xen-orchestra/log/transports/console').default(),
  },
])

const { info, warn } = require('@xen-orchestra/log').createLogger('bootstrap')

process.on('unhandledRejection', reason => {
  warn('possibly unhandled rejection', reason)
})
process.on('warning', warning => {
  warn('Node warning', warning)
})
;(({ prototype }) => {
  const { emit } = prototype
  prototype.emit = function (event, error) {
    event === 'error' && !this.listenerCount(event)
      ? warn('unhandled error event', error)
      : emit.apply(this, arguments)
  }
})(require('events').EventEmitter)

// Use Bluebird for all promises as it provides better performance and
// less memory usage.
const Bluebird = require('bluebird')
Bluebird.config({
  longStackTraces: true,
  warnings: true,
})
global.Promise = Bluebird

// -------------------------------------------------------------------

const main = async args => {
  if (args.includes('--help') || args.includes('-h')) {
    const { name, version } = require('../package.json')
    return console.log(`Usage: ${name} [--safe-mode]

${name} v${version}`)
  }

  info('starting')

  const config = await require('app-conf').load(APP_NAME, {
    appDir: `${__dirname}/..`,
    ignoreUnknownFormats: true,
  })

  // Print a message if deprecated entries are specified.
  ;['users', 'servers'].forEach(entry => {
    if (entry in config) {
      warn(`${entry} configuration is deprecated`)
    }
  })

  const httpServer = require('stoppable')(new (require('http-server-plus'))())

  const readFile = Bluebird.promisify(require('fs').readFile)
  await Promise.all(
    config.http.listen.map(
      async ({
        certificate,
        // The properties was called `certificate` before.
        cert = certificate,
        key,
        ...opts
      }) => {
        if (cert !== undefined && key !== undefined) {
          ;[opts.cert, opts.key] = await Promise.all([
            readFile(cert),
            readFile(key),
          ])
        }

        try {
          const niceAddress = await httpServer.listen(opts)
          info(`web server listening on ${niceAddress}`)
        } catch (error) {
          if (error.niceAddress !== undefined) {
            warn(`web server could not listen on ${error.niceAddress}`)

            const { code } = error
            if (code === 'EACCES') {
              warn('  access denied.')
              warn('  ports < 1024 are often reserved to privileges users.')
            } else if (code === 'EADDRINUSE') {
              warn('  address already in use.')
            }
          } else {
            warn('web server could not listen', error)
          }
        }
      }
    )
  )

  // Now the web server is listening, drop privileges.
  try {
    const { group, user } = config
    if (group !== undefined) {
      process.setgid(group)
      info('group changed to', group)
    }
    if (user !== undefined) {
      process.setuid(user)
      info('user changed to', user)
    }
  } catch (error) {
    warn('failed to change group/user', error)
  }

  const child = require('child_process').fork(require.resolve('./worker.js'))
  child.send([''])

  const App = require('./xo').default
  const app = new App({
    appName: APP_NAME,
    config,
    httpServer,
    safeMode: require('lodash/includes')(args, '--safe-mode'),
  })

  // Register web server close on XO stop.
  app.on('stop', () => Bluebird.fromCallback(cb => httpServer.stop(cb)))

  await app.start()

  // Trigger a clean job.
  await app.clean()

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

  await require('event-to-promise')(app, 'stopped')
}
main(process.argv.slice(2)).then(
  () => info('bye :-)'),
  error => {
    if (typeof error === 'number') {
      process.exitCode = error
    } else {
      warn('fatal error', error)
    }
  }
)
