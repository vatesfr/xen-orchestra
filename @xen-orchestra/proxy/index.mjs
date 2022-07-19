#!/usr/bin/env node

import forOwn from 'lodash/forOwn.js'
import fse from 'fs-extra'
import getopts from 'getopts'
import { catchGlobalErrors } from '@xen-orchestra/log/configure.js'
import { create as createServer } from 'http-server-plus'
import { createCachedLookup } from '@vates/cached-dns.lookup'
import { createLogger } from '@xen-orchestra/log'
import { createSecureServer } from 'http2'
import { load as loadConfig } from 'app-conf'

// -------------------------------------------------------------------

catchGlobalErrors(createLogger('xo:proxy'))

createCachedLookup().patchGlobal()

const { fatal, info, warn } = createLogger('xo:proxy:bootstrap')

const APP_DIR = new URL('.', import.meta.url).pathname
const APP_NAME = 'xo-proxy'
const APP_VERSION = JSON.parse(fse.readFileSync(new URL('package.json', import.meta.url))).version

// -------------------------------------------------------------------

const main = async args => {
  const opts = getopts(args, {
    boolean: ['help', 'safe-mode'],
    alias: {
      help: ['h'],
    },
  })

  if (opts.help) {
    // eslint-disable-next-line no-console
    console.log(
      '%s',
      `
${APP_NAME} v${APP_VERSION}
`
    )
    return
  }

  info('starting')

  const config = await loadConfig(APP_NAME, {
    appDir: APP_DIR,
    ignoreUnknownFormats: true,
  })

  let httpServer = createServer({
    createSecureServer: opts => createSecureServer({ ...opts, allowHTTP1: true }),
  })

  forOwn(config.http.listen, async ({ autoCert, cert, key, ...opts }, listenKey) => {
    try {
      if (cert !== undefined && key !== undefined) {
        opts.SNICallback = async (serverName, callback) => {
          // injected by @xen-orchestr/mixins/sslCertificate.mjs
          try {
            const secureContext = await httpServer.getSecureContext(serverName, listenKey)
            callback(null, secureContext)
          } catch (error) {
            warn('An error occured during certificate context creation', { error, listenKey, serverName })
            callback(error)
          }
        }
      }
      const niceAddress = httpServer.listen(opts)
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

    await import('source-map-support/register.js')
  } catch (error) {
    warn(error)
  }

  httpServer = (await import('stoppable')).default(httpServer)

  const { default: App } = await import('./app/index.mjs')
  const app = new App({
    appDir: APP_DIR,
    appName: APP_NAME,
    appVersion: APP_VERSION,
    config,
    httpServer,
    safeMode: opts['--safe-mode'],
  })

  // dont delay require to stopping phase because deps may no longer be there (eg on uninstall)
  const { default: fromCallback } = await import('promise-toolbox/fromCallback')
  app.hooks.on('stop', () => fromCallback(cb => httpServer.stop(cb)))

  await app.sslCertificate.register()

  await app.hooks.start()

  // Gracefully shutdown on signals.
  let alreadyCalled = false
  ;['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
      if (alreadyCalled) {
        warn('forced exit')
        // eslint-disable-next-line n/no-process-exit
        process.exit(1)
      }
      alreadyCalled = true

      info(`${signal} caught, stopping…`)
      app.hooks.stop()
    })
  })

  return (await import('promise-toolbox/fromEvent')).default(app.hooks, 'stopped')
}
main(process.argv.slice(2)).then(
  () => {
    info('bye :-)')
  },
  error => {
    fatal(error)
    // eslint-disable-next-line n/no-process-exit
    process.exit(1)
  }
)
