#!/usr/bin/env node

import fse from 'fs-extra'
import getopts from 'getopts'
import { catchGlobalErrors } from '@xen-orchestra/log/configure'
import { create as createServer } from 'http-server-plus'
import { createCachedLookup } from '@vates/cached-dns.lookup'
import { createLogger } from '@xen-orchestra/log'
import { createSecureServer } from 'http2'
import { load as loadConfig } from 'app-conf'
import { readCert } from '@xen-orchestra/self-signed/readCert'

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

  for (const [configKey, { autoCert, cert, key, ...opts }] of Object.entries(config.http.listen)) {
    const useAcme = autoCert && opts.acmeDomain !== undefined

    // don't pass these entries to httpServer.listen(opts)
    for (const key of Object.keys(opts).filter(_ => _.startsWith('acme'))) {
      delete opts[key]
    }

    try {
      let niceAddress
      if (cert !== undefined && key !== undefined) {
        if (useAcme) {
          opts.SNICallback = async (serverName, callback) => {
            try {
              // injected by mixins/SslCertificate
              const secureContext = await httpServer.getSecureContext(serverName, configKey, opts.cert, opts.key)
              callback(null, secureContext)
            } catch (error) {
              warn(error)
              callback(error, null)
            }
          }
        }

        niceAddress = await readCert(cert, key, {
          autoCert,
          info,
          warn,
          use({ cert, key }) {
            opts.cert = cert
            opts.key = key

            return httpServer.listen(opts)
          },
        })
      } else {
        niceAddress = await httpServer.listen(opts)
      }

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
  }

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
  app.hooks.on('stop', async () => {
    await fromCallback(cb => httpServer.stop(cb))

    // idle connections will prevent xo-proxy from stopping
    httpServer.closeIdleConnections()
  })

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
