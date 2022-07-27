import { createLogger } from '@xen-orchestra/log'
import { createSecureContext } from 'tls'
import { dirname } from 'node:path'
import { X509Certificate } from 'node:crypto'
import acme from 'acme-client'
import fs from 'node:fs/promises'
import get from 'lodash/get.js'

const { debug, warn } = createLogger('xo:mixins:sslCertificate')

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
  #app
  #certLoaded = false
  #challengeCreateFn
  #challengeRemoveFn
  #configKey
  #delayBeforeRenewal = 30 * 24 * 60 * 60 * 1000 // 30 days
  #secureContext
  #selfSigned = false
  #updateSslCertificatePromise
  #validTo

  constructor({ app, configKey, challengeCreateFn, challengeRemoveFn }) {
    this.#app = app
    this.#configKey = configKey
    this.#challengeCreateFn = challengeCreateFn
    this.#challengeRemoveFn = challengeRemoveFn
  }

  async #loadExististingCertificate(config) {
    try {
      const [cert, key] = await Promise.all([fs.readFile(config.cert), fs.readFile(config.key)])
      this.#secureContext = createSecureContext({
        cert,
        key,
      })
      const { validTo, issuer, subject } = new X509Certificate(cert)
      this.#validTo = new Date(validTo)
      this.#selfSigned = issuer === subject
    } catch (error) {
      if (error.code === 'ENOENT') {
        debug('no certificate exists for this config ', { config })
        return
      }
      if (error.code === 'ERR_SSL_EE_KEY_TOO_SMALL') {
        debug('certificate is too old and too weak ', { config })
        return
      }
      throw error
    } finally {
      this.#certLoaded = true
    }
  }

  async getSecureContext(httpsDomainName) {
    const config = this.#app.config.get(['http', 'listen', this.#configKey])

    // something changed in configuration or there is a network misconfiguration
    // don't generate new let's encrypt challenges or invalid certificates
    if (config?.acmeDomain !== httpsDomainName) {
      warn(`certificates is configured for a domain, but receive http request from another`, {
        acmeDomain: config?.acmeDomain,
        httpsDomainName,
      })
      // fallback to self signed certificate to not lock user out
      return undefined
    }

    if (!this.#certLoaded) {
      await this.#loadExististingCertificate(config)
    }

    const isValid =
      !this.#selfSigned && // current certificiate is self signed
      this.#secureContext !== undefined &&
      this.#validTo !== undefined && // no current certificate
      this.#validTo >= new Date() // expired

    const shouldBeRenewed = !isValid || this.#validTo - this.#delayBeforeRenewal <= new Date() // will expires soon

    if (shouldBeRenewed && this.#updateSslCertificatePromise === undefined) {
      // not currently updating certificate
      // ensure we only refresh certificate once at a time
      this.#updateSslCertificatePromise = this.#updateSslCertificate(config)
        // async cleanup but don't making orphan promises
        .then(() => {
          this.#updateSslCertificatePromise = undefined
          return this.#secureContext
        })
        .catch(error => {
          warn(`couldn't renew ssl certificate`, { error, httpsDomainName, config })
          this.#updateSslCertificatePromise = undefined
          if (!isValid) {
            this.#secureContext = undefined
            this.#validTo = undefined
            return undefined
          }
        })
    }

    // old certificate is still here, return it while updating
    if (isValid) {
      return this.#secureContext
    }

    return this.#updateSslCertificatePromise
  }

  async #updateSslCertificate(config) {
    const { cert: certPath, key: keyPath, acmeEmail, acmeDomain } = config

    acme.setLogger(message => {
      debug(message)
    })

    let { acmeCa = 'letsencrypt/production' } = config
    if (!(acmeCa.startsWith('http:') || acmeCa.startsWith('https:'))) {
      acmeCa = get(acme.directory, acmeCa.split('/'))
    }

    /* Init client */
    const client = new acme.Client({
      directoryUrl: acmeCa,
      accountKey: await acme.forge.createPrivateKey(),
    })

    /* Create CSR */
    let [key, csr] = await acme.forge.createCsr({
      commonName: acmeDomain,
    })
    debug('Successfully generated key and csr')
    /* Certificate */

    const cert = await client.auto({
      csr,
      email: acmeEmail,
      termsOfServiceAgreed: true,
      challengeCreateFn: this.#challengeCreateFn,
      challengeRemoveFn: this.#challengeRemoveFn,
    })
    csr = csr.toString()
    key = key.toString()

    debug('Successfully generated certificate', { key, csr })

    try {
      await Promise.all([outputFile(keyPath, key), outputFile(certPath, cert)])
      debug('certificate key and cert are saved to disk')
    } catch (error) {
      warn(`couldn't write let's encrypt certificates to disk `, { error })
    }

    // we don't catch a SSL error here, since it's a brand new certificate from let's encrypt
    this.#secureContext = createSecureContext({
      cert,
      key,
    })
    const { validTo } = new X509Certificate(cert)
    this.#validTo = new Date(validTo)
    debug('secure contexte generated', this.#secureContext, this.#validTo)
  }
}

export default class SslCertificates {
  #app
  #challenges = {}
  #handlers = {}

  constructor(app, { httpServer }) {
    // don't setup the proxy if httpServer is not present
    //
    // that can happen when the app is instanciated in another context like xo-server-recover-account
    if (httpServer === undefined) {
      return
    }
    const prefix = '/.well-known/acme-challenge/'
    httpServer.on('request', (req, res) => {
      const { url } = req
      if (!url.startsWith(prefix)) {
        return
      }
      const token = url.slice(prefix.length)
      this.#acmeChallendMiddleware(req, res, token)
    })

    this.#app = app

    httpServer.getSecureContext = this.getSecureContext.bind(this)
  }

  async getSecureContext(httpsDomainName, configKey) {
    if (!this.#handlers[configKey]) {
      const config = this.#app.config.get(`http.listen.${configKey}`)
      // not a let's encrypt protected end point, sommething changed in the configuration
      if (config.acmeDomain === undefined) {
        warn(`config don't have acmeDomain, mandatory for let's encrypt`, { config })
        return
      }

      // register the handler for this domain
      this.#handlers[configKey] = new SslCertificate({
        app: this.#app,
        configKey,
        challengeCreateFn: (authz, challenge, keyAuthorization) => {
          this.#challenges[challenge.token] = keyAuthorization
        },
        challengeRemoveFn: (authz, challenge, keyAuthorization) => {
          delete this.#challenges[challenge.token]
        },
      })
    }
    return this.#handlers[configKey].getSecureContext(httpsDomainName)
  }

  // middleware that will serve the http challenge to let's encrypt servers
  #acmeChallendMiddleware(req, res, token) {
    debug('fetching challenge for token ', token)
    const challenge = this.#challenges[token]
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
