import { createLogger } from '@xen-orchestra/log'
import { genSelfSignedCert } from '@xen-orchestra/self-signed'

import { X509Certificate } from 'crypto'
import fs from 'node:fs/promises'
import pw from 'pw'
import tls from 'node:tls'

const { debug, info, warn } = createLogger('xo:mixins:sslCertificate')

export default class SslCertificate {
  #cert
  #config
  #updateSslCertificatePromise
  #secureContext

  constructor(app, { httpServer, config }) {
    // don't setup the proxy if httpServ, configer is not present
    //
    // that can happen when the app is instanciated in another context like xo-server-recover-account
    if (httpServer === undefined) {
      return
    }

    this.#config = config

    httpServer.getSecureContext = this.getSecureContext.bind(this)
  }

  // load on register
  async #loadSslCertificate(config) {
    const certPath = config.cert
    const keyPath = config.key
    let key, cert, passphrase
    try {
      ;[cert, key] = await Promise.all([fs.readFile(certPath), fs.readFile(keyPath)])
      if (keyPath.includes('ENCRYPTED')) {
        passphrase = await new Promise(resolve => {
          // eslint-disable-next-line no-console
          process.stdout.write(`Enter pass phrase: `)
          pw(resolve)
        })
      }
      this.#secureContext = tls.createSecureContext({
        cert,
        key,
        passphrase,
      })
      this.#cert = cert
    } catch (error) {
      if (!(config.autoCert && error.code === 'ENOENT')) {
        throw error
      }
      // self signed certificate or let's encrypt will be generated on demand
    }
  }

  async #getSelfSignedContext(config) {
    const { cert, key } = await genSelfSignedCert()
    info('new certificates generated', { cert, key })
    try {
      await Promise.all([
        fs.writeFile(config.cert, cert, { flag: 'w', mode: 0o400 }),
        fs.writeFile(config.key, key, { flag: 'w', mode: 0o400 }),
      ])
    } catch (error) {
      warn(`can't save self signed certificates `, { error, config })
    }

    this.#cert = cert
    this.#secureContext = tls.createSecureContext({
      cert,
      key,
    })

    return this.#secureContext
  }

  // get the current certificate for this hostname
  async getSecureContext(hostName) {
    if (this.#updateSslCertificatePromise) {
      debug('certificate is already refreshing')
      return this.#updateSslCertificatePromise
    }
    const cert = this.#cert
    const config = this.#getHttpsConfig()
    let certificateIsValid = cert !== undefined
    let shouldRenew = !certificateIsValid

    if (certificateIsValid) {
      const { validTo } = new X509Certificate(cert)
      const validToDate = new Date(validTo)
      certificateIsValid = validToDate >= new Date()
      shouldRenew = !certificateIsValid || validToDate - new Date() < 30 * 24 * 60 * 60 * 1000
    }

    if (shouldRenew) {
      try {
        // @todo : should also handle let's encrypt
        if (config?.autoCert === true) {
          this.#updateSslCertificatePromise = this.#getSelfSignedContext(config)
        }

        // cleanup
        this.#updateSslCertificatePromise.then(
          () => (this.#updateSslCertificatePromise = undefined),
          error => {
            console.warn('error while updating ssl certificate', { error })
            this.#updateSslCertificatePromise = undefined
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

  // only handle ONE https config at once
  #getHttpsConfig() {
    const configs = this.#config.http.listen ?? []
    return Object.values(configs).find(({ cert, key }) => cert !== undefined && key !== undefined)
  }

  async register() {
    const config = this.#getHttpsConfig()
    if (config !== undefined) {
      await this.#loadSslCertificate(config)
    }
  }
}
