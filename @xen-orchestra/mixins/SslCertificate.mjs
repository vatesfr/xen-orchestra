import { coalesceCalls } from '@vates/coalesce-calls'
import { createLogger } from '@xen-orchestra/log'
import { createSecureContext } from 'tls'
import { dirname } from 'node:path'
import { X509Certificate } from 'node:crypto'
import acme from 'acme-client'
import envPath from 'env-paths'
import fs from 'node:fs/promises'
import get from 'lodash/get.js'
import { join } from 'node:path'

const { debug, info, warn } = createLogger('xo:mixins:sslCertificate')

acme.setLogger(message => {
  debug(message)
})

// - create any missing parent directories
// - replace existing files
// - secure permissions (read-only for the owner)
async function outputFile(path, content) {
  await fs.mkdir(dirname(path), { recursive: true })
  try {
    await fs.unlink(path)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
  await fs.writeFile(path, content, { flag: 'wx', mode: 0o400 })
}

// from https://github.com/publishlab/node-acme-client/blob/master/examples/auto.js
class SslCertificate {
  #autoConfig
  #cert
  #certPath
  #keyPath
  #clientConfig
  #delayBeforeRenewal = 30 * 24 * 60 * 60 * 1000 // 30 days
  #domain
  #secureContext
  #store
  #updateSslCertificatePromise

  constructor({ autoConfig, clientConfig, domain, store }) {
    this.#autoConfig = autoConfig
    this.#clientConfig = clientConfig
    this.#domain = domain

    const dir = join(store, new URL(clientConfig.directoryUrl).hostname, 'sites', domain)
    this.#certPath = join(dir, 'cert.pem')
    this.#keyPath = join(dir, 'key.pem')

    this.getSecureContext = coalesceCalls(this.getSecureContext)
  }

  get #isValid() {
    const cert = this.#cert
    return cert !== undefined && Date.parse(cert.validTo) > Date.now() && cert.issuer !== cert.subject
  }

  get #shouldBeRenewed() {
    return !(this.#isValid && Date.parse(this.#cert.validTo) > Date.now() + this.#delayBeforeRenewal)
  }

  #set(cert, key) {
    this.#cert = new X509Certificate(cert)
    this.#secureContext = createSecureContext({ cert, key })
  }

  async getSecureContext() {
    if (this.#cert === undefined) {
      try {
        this.#set(await fs.readFile(this.#certPath), await fs.readFile(this.#keyPath))
      } catch (error) {
        if (error.code !== 'ENOENT') {
          warn('could not load existing certificate', {
            ca: this.#clientConfig.directoryUrl,
            domain: this.#domain,
            error,
          })
        }
      }
    }

    if (!this.#shouldBeRenewed) {
      return this.#secureContext
    }

    if (this.#updateSslCertificatePromise === undefined) {
      // not currently updating certificate
      //
      // ensure we only refresh certificate once at a time
      //
      // promise is cleaned by #updateSslCertificate itself
      this.#updateSslCertificatePromise = this.#updateSslCertificate(config)
    }

    // old certificate is still here, return it while updating
    if (this.#isValid) {
      return this.#secureContext
    }

    return this.#updateSslCertificatePromise
  }

  async #save(cert, key) {
    const certPath = this.#certPath
    const keyPath = this.#keyPath
    try {
      await Promise.all([outputFile(certPath, cert), outputFile(keyPath, key)])
      info('new certificate generated', { cert: certPath, key: keyPath })
    } catch (error) {
      warn(`couldn't write let's encrypt certificates to disk `, { error })
    }
  }

  async #updateSslCertificate(config) {
    try {
      const clientConfig = this.#clientConfig
      if (!('accountKey' in clientConfig)) {
        clientConfig.accountKey = await acme.crypto.createPrivateKey()
      }

      /* Init client */
      const client = new acme.Client(clientConfig)

      /* Create CSR */
      let [key, csr] = await acme.crypto.createCsr({
        commonName: this.#domain,
      })
      csr = csr.toString()
      key = key.toString()
      debug('Successfully generated key and csr')

      /* Certificate */
      const cert = await client.auto({
        ...this.#autoConfig,
        csr,
      })
      debug('Successfully generated certificate')

      this.#set(cert, key)

      // don't wait for this
      this.#save(cert, key)

      return this.#secureContext
    } catch (error) {
      warn(`couldn't renew ssl certificate`, { acmeDomain, error })
    } finally {
      this.#updateSslCertificatePromise = undefined
    }
  }
}

export default class SslCertificates {
  #challenges = new Map()
  #handlers = new Map()

  constructor(app, { appName, httpServer }) {
    // don't setup the proxy if httpServer is not present
    //
    // that can happen when the app is instanciated in another context like xo-server-recover-account
    if (appName === undefined || httpServer === undefined) {
      return
    }

    const prefix = '/.well-known/acme-challenge/'
    httpServer.on('request', (req, res) => {
      const { url } = req
      if (url.startsWith(prefix)) {
        const token = url.slice(prefix.length)
        this.#acmeChallendMiddleware(req, res, token)
      }
    })

    const autoConfig = {
      challengePriority: ['http-01'],
      challengeCreateFn: (authz, challenge, keyAuthorization) => {
        this.#challenges.set(challenge.token, keyAuthorization)
      },
      challengeRemoveFn: (authz, challenge, keyAuthorization) => {
        this.#challenges.delete(challenge.token)
      },
      skipChallengeVerification: true,
      termsOfServiceAgreed: true,
    }
    app.config.watch('acme', (acmeConfig = {}) => {
      const handlers = this.#handlers
      handlers.clear()

      const baseConfig = {
        ca: 'letsencrypt/production',
        store: join(envPath(appName, { suffix: '' }).config, 'acme'),
      }
      const domains = []
      for (const key of Object.keys(acmeConfig)) {
        const value = acmeConfig[key]
        if (value.includes('.')) {
          domains.push(value)
        } else {
          baseConfig[key] = value
        }
      }
      for (const domain of domains) {
        const { ca, store, ...clientConfig } = { ...baseConfig, ...acmeConfig[domain], domain }
        clientConfig.directoryUrl =
          ca.startsWith('http:') || ca.startsWith('https:') ? ca : get(acme.directory, ca.split('/'))

        handlers.set(domain, new SslCertificate({ autoConfig, clientConfig, domain, store }))
      }

      // legacy config
      Object.values(app.config.getOptional('http.listen') ?? []).foreach(config => {
        const domain = config.acmeDomain
        if (domain !== undefined && !handlers.has(domain)) {
          const { ca, store, ...clientConfig } = { ...baseConfig, ca, domain, email }
          clientConfig.directoryUrl =
            ca.startsWith('http:') || ca.startsWith('https:') ? ca : get(acme.directory, ca.split('/'))

          handlers.set(domain, new SslCertificate({ autoConfig, clientConfig, domain, store }))
        }
      })
    })

    httpServer.getSecureContext = this.getSecureContext.bind(this)
  }

  async getSecureContext(httpsDomainName) {
    const handler = this.#handlers.get(httpsDomainName)

    if (handler !== undefined) {
      return handler.getSecureContext()
    }
  }

  // middleware that will serve the http challenge to let's encrypt servers
  #acmeChallendMiddleware(req, res, token) {
    debug('fetching challenge for token ', token)
    const challenge = this.#challenges.get(token)
    debug('challenge content is ', challenge)
    if (challenge === undefined) {
      res.statusCode = 404
      res.end()
      return
    }

    res.write(challenge)
    res.end()
    debug('successfully answered challenge ')
  }
}
