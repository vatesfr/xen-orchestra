import { createLogger } from '@xen-orchestra/log'
import { createSecureContext } from 'tls'
import { dirname } from 'node:path'
import { X509Certificate } from 'node:crypto'
import acme from 'acme-client'
import fs from 'node:fs/promises'
import get from 'lodash/get.js'

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
  #cert
  #challengeCreateFn
  #challengeRemoveFn
  #delayBeforeRenewal = 30 * 24 * 60 * 60 * 1000 // 30 days
  #secureContext
  #updateSslCertificatePromise

  constructor({ challengeCreateFn, challengeRemoveFn }, cert, key) {
    this.#challengeCreateFn = challengeCreateFn
    this.#challengeRemoveFn = challengeRemoveFn

    this.#set(cert, key)
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

  async getSecureContext(config) {
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

  async #save(certPath, cert, keyPath, key) {
    try {
      await Promise.all([outputFile(keyPath, key), outputFile(certPath, cert)])
      info('new certificate generated', { cert: certPath, key: keyPath })
    } catch (error) {
      warn(`couldn't write let's encrypt certificates to disk `, { error })
    }
  }

  async #updateSslCertificate(config) {
    const { cert: certPath, key: keyPath, acmeEmail, acmeDomain } = config
    try {
      let { acmeCa = 'letsencrypt/production' } = config
      if (!(acmeCa.startsWith('http:') || acmeCa.startsWith('https:'))) {
        acmeCa = get(acme.directory, acmeCa.split('/'))
      }

      /* Init client */
      const client = new acme.Client({
        directoryUrl: acmeCa,
        accountKey: await acme.crypto.createPrivateKey(),
      })

      /* Create CSR */
      let [key, csr] = await acme.crypto.createCsr({
        commonName: acmeDomain,
      })
      csr = csr.toString()
      key = key.toString()
      debug('Successfully generated key and csr')

      /* Certificate */
      const cert = await client.auto({
        challengeCreateFn: this.#challengeCreateFn,
        challengePriority: ['http-01'],
        challengeRemoveFn: this.#challengeRemoveFn,
        csr,
        email: acmeEmail,
        skipChallengeVerification: true,
        termsOfServiceAgreed: true,
      })
      debug('Successfully generated certificate')

      this.#set(cert, key)

      // don't wait for this
      this.#save(certPath, cert, keyPath, key)

      return this.#secureContext
    } catch (error) {
      warn(`couldn't renew ssl certificate`, { acmeDomain, error })
    } finally {
      this.#updateSslCertificatePromise = undefined
    }
  }
}

export default class SslCertificates {
  #app
  #challenges = new Map()
  #challengeHandlers = {
    challengeCreateFn: (authz, challenge, keyAuthorization) => {
      this.#challenges.set(challenge.token, keyAuthorization)
    },
    challengeRemoveFn: (authz, challenge, keyAuthorization) => {
      this.#challenges.delete(challenge.token)
    },
  }
  #handlers = new Map()

  constructor(app, { httpServer }) {
    // don't set up the proxy if httpServer is not present
    //
    // that can happen when the app is instantiated in another context like xo-server-recover-account
    if (httpServer === undefined) {
      return
    }
    const prefix = '/.well-known/acme-challenge/'
    httpServer.on('request', (req, res) => {
      const { url } = req
      if (url.startsWith(prefix)) {
        const token = url.slice(prefix.length)
        this.#acmeChallengeMiddleware(req, res, token)
      }
    })

    this.#app = app

    httpServer.getSecureContext = this.getSecureContext.bind(this)
  }

  async getSecureContext(httpsDomainName, configKey, initialCert, initialKey) {
    const config = this.#app.config.get(['http', 'listen', configKey])
    const handlers = this.#handlers

    const { acmeDomain } = config

    // not a let's encrypt protected end point, something changed in the configuration
    if (acmeDomain === undefined) {
      handlers.delete(configKey)
      return
    }

    // server has been access with another domain, don't use the certificate
    if (acmeDomain !== httpsDomainName) {
      return
    }

    let handler = handlers.get(configKey)
    if (handler === undefined) {
      // register the handler for this domain
      handler = new SslCertificate(this.#challengeHandlers, initialCert, initialKey)
      handlers.set(configKey, handler)
    }
    return handler.getSecureContext(config)
  }

  // middleware that will serve the http challenge to let's encrypt servers
  #acmeChallengeMiddleware(req, res, token) {
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
