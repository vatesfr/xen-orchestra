import { createLogger } from '@xen-orchestra/log'
import { genSelfSignedCert } from '@xen-orchestra/self-signed'
import pRetry from 'promise-toolbox/retry'

import { X509Certificate } from 'crypto'
import fs from 'node:fs/promises'
import { dirname } from 'path'
import pw from 'pw'
import tls from 'node:tls'

const { debug, info, warn } = createLogger('xo:mixins:sslCertificate')

async function outputFile(path, content) {
  await fs.mkdir(dirname(path), { recursive: true })
  await fs.writeFile(path, content, { flag: 'w', mode: 0o400 })
}

class SslCertificate {
  #app
  #configKey
  #updateSslCertificatePromise
  #secureContext
  #validTo

  constructor(app, configKey) {
    this.#app = app
    this.#configKey = configKey
  }

  #createSecureContext(cert, key, passphrase) {
    return tls.createSecureContext({
      cert,
      key,
      passphrase,
    })
  }

  // load on register
  async #loadSslCertificate(config) {
    const certPath = config.cert
    const keyPath = config.key
    let key, cert, passphrase
    try {
      ;[cert, key] = await Promise.all([fs.readFile(certPath), fs.readFile(keyPath)])
      if (keyPath.includes('ENCRYPTED')) {
        if (config.autoCert) {
          throw new Error(`encrytped certificates aren't compatible with autoCert option`)
        }
        passphrase = await new Promise(resolve => {
          // eslint-disable-next-line no-console
          process.stdout.write(`Enter pass phrase: `)
          pw(resolve)
        })
      }
    } catch (error) {
      if (!(config.autoCert && error.code === 'ENOENT')) {
        throw error
      }
      // self signed certificate or let's encrypt will be generated on demand
    }

    // create secure context also make a validation of the certificate
    const secureContext = this.#createSecureContext(cert, key, passphrase)
    this.#secureContext = secureContext

    // will be tested and eventually renewed on first query
    const { validTo } = new X509Certificate(cert)
    this.#validTo = new Date(validTo)
  }

  #getConfig() {
    const config = this.#app.config.get(this.#configKey)
    if (config === undefined) {
      throw new Error(`config for key ${this.#configKey} is unavailable`)
    }
    return config
  }

  async #getSelfSignedContext(config) {
    return pRetry(
      async () => {
        const { cert, key } = await genSelfSignedCert()
        info('new certificates generated', { cert, key })
        try {
          await Promise.all([outputFile(config.cert, cert), outputFile(config.key, key)])
        } catch (error) {
          warn(`can't save self signed certificates `, { error, config })
        }

        // create secure context also make a validation of the certificate
        const { validTo } = new X509Certificate(cert)
        return { secureContext: this.#createSecureContext(cert, key), validTo: new Date(validTo) }
      },
      {
        tries: 2,
        when: e => e.code === 'ERR_SSL_EE_KEY_TOO_SMALL',
        onRetry: () => {
          warn('got ERR_SSL_EE_KEY_TOO_SMALL while generating self signed certificate ')
        },
      }
    )
  }

  // get the current certificate for this hostname
  async getSecureContext(hostName) {
    const config = this.#getConfig()
    if (config === undefined) {
      throw new Error(`config for key ${this.#configKey} is unavailable`)
    }

    if (this.#updateSslCertificatePromise) {
      debug('certificate is already refreshing')
      return this.#updateSslCertificatePromise
    }

    let certificateIsValid = this.#validTo !== undefined
    let shouldRenew = !certificateIsValid

    if (certificateIsValid) {
      certificateIsValid = this.#validTo >= new Date()
      shouldRenew = !certificateIsValid || this.#validTo - new Date() < 30 * 24 * 60 * 60 * 1000
    }

    let promise = Promise.resolve()
    if (shouldRenew) {
      try {
        // @todo : should also handle let's encrypt
        if (config.autoCert === true) {
          promise = promise.then(() => this.#getSelfSignedContext(config))
        }

        this.#updateSslCertificatePromise = promise

        // cleanup and store
        promise = promise.then(
          ({ secureContext, validTo }) => {
            this.#validTo = validTo
            this.#secureContext = secureContext
            this.#updateSslCertificatePromise = undefined
            return secureContext
          },
          async error => {
            console.warn('error while updating ssl certificate', { error })
            this.#updateSslCertificatePromise = undefined
            if (!certificateIsValid) {
              // we couldn't generate a valid certificate
              // only throw if the current certificate is invalid
              warn('deleting invalid certificate')
              this.#secureContext = undefined
              this.#validTo = undefined
              await Promise.all([fs.unlink(config.cert), fs.unlink(config.key)])
              throw error
            }
          }
        )
      } catch (error) {
        warn('error while refreshing ssl certificate', { error })
        throw error
      }
    }
    if (certificateIsValid) {
      // still valid  : does not need to wait for the refresh
      return this.#secureContext
    }

    if (this.#updateSslCertificatePromise === undefined) {
      throw new Error(`Invalid certificate and no strategy defined to renew it. Try activating autoCert in the config`)
    }

    // invalid cert : wait for refresh
    return this.#updateSslCertificatePromise
  }

  async register() {
    await this.#loadSslCertificate(this.#getConfig())
  }
}

export default class SslCertificates {
  #app
  #handlers = {}
  constructor(app, { httpServer }) {
    // don't setup the proxy if httpServer is not present
    //
    // that can happen when the app is instanciated in another context like xo-server-recover-account
    if (httpServer === undefined) {
      return
    }
    this.#app = app

    httpServer.getSecureContext = this.getSecureContext.bind(this)
  }

  async getSecureContext(hostname, configKey) {
    const config = this.#app.config.get(`http.listen.${configKey}`)
    if (!config || !config.cert || !config.key) {
      throw new Error(`HTTPS configuration does no exists for key http.listen.${configKey}`)
    }

    if (this.#handlers[configKey] === undefined) {
      throw new Error(`the SslCertificate handler for key  http.listen.${configKey} does not exists.`)
    }
    return this.#handlers[configKey].getSecureContext(hostname, config)
  }

  async register() {
    // http.listen can be an array or an object
    const configs = this.#app.config.get('http.listen') || []
    const configKeys = Object.keys(configs) || []
    await Promise.all(
      configKeys
        .filter(configKey => configs[configKey].cert !== undefined && configs[configKey].key !== undefined)
        .map(async configKey => {
          this.#handlers[configKey] = new SslCertificate(this.#app, `http.listen.${configKey}`)
          return this.#handlers[configKey].register(configs[configKey])
        })
    )
  }
}
