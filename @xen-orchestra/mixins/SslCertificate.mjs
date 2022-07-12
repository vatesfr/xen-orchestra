import { createLogger } from '@xen-orchestra/log'

import acme from 'acme-client'
import { X509Certificate } from 'crypto'
import fs from 'fs-extra'

const { debug, warn } = createLogger('xo:mixins:sslCertificate')

// from https://github.com/publishlab/node-acme-client/blob/master/examples/auto.js

export default class SslCertificate {
  #app
  #cert
  #key
  #express
  #refreshing = false
  #challengePath = '/.well-known/acme-challenge/:token'
  #challenges = {}

  constructor(app, { httpServer, express }) {
    // don't setup the proxy if httpServer is not present
    //
    // that can happen when the app is instanciated in another context like xo-server-recover-account
    if (httpServer === undefined) {
      return
    }

    this.#app = app
    this.#express = express

    httpServer.getCertificate = this.getCertificate.bind(this)
  }

  async #updateSslCertificate(domain) {
    // @todo : look for the right (same external host) conf, not the first one
    const {
      cert: certPath,
      key: keyPath,
      certEmail,
    } = this.#app.config.get('http.listen').find(({ letsencrypt }) => letsencrypt === true)
    const httpProxy = process.env.http_proxy || process.env.HTTP_PROXY

    if (httpProxy) {
      acme.axios.defaults.proxy = httpProxy
    }

    acme.setLogger(message => {
      debug(message)
    })

    /* Init client */
    const client = new acme.Client({
      directoryUrl: acme.directory.letsencrypt.production,
      accountKey: await acme.forge.createPrivateKey(),
    })

    /* Create CSR */
    const [key, csr] = await acme.forge.createCsr({
      commonName: domain,
    })
    debug('Successfully generated key and csr')
    /* Certificate */

    const cert = await client.auto({
      csr,
      email: certEmail,
      termsOfServiceAgreed: true,
      challengeCreateFn: (authz, challenge, keyAuthorization) => {
        this.#challenges[challenge.token] = keyAuthorization
      },
      challengeRemoveFn: (authz, challenge, keyAuthorization) => {
        delete this.#challenges[challenge.token]
      },
    })
    debug('Successfully generated certificate')

    /* Done */
    debug(`CSR:\n${csr.toString()}`)
    debug(`Private key:\n${key.toString()}`)
    debug(`Certificate:\n${cert.toString()}`)
    await fs.writeFile(keyPath, key.toString())
    await fs.writeFile(certPath, cert.toString())
    debug('certificate key and cert are saved to disk')
    this.#cert = cert.toString()
    this.#key = key.toString()
    return {
      cert: cert.toString(),
      key: key.toString(),
    }
  }

  // get the current certificate for this hostname
  async getCertificate(hostName, currentCert, currentKey) {
    if (this.#refreshing) {
      debug('certificate is already refreshing')
      return this.#refreshing
    }
    const cert = this.#cert || currentCert
    const key = this.key || currentKey
    let certificateIsValid = !!cert
    let shouldRenew = !certificateIsValid

    // check date validity of the certificate
    if (certificateIsValid) {
      const { validTo } = new X509Certificate(currentCert)
      const validToDate = new Date(validTo)
      certificateIsValid = validToDate >= new Date()
      shouldRenew = !certificateIsValid || validToDate - new Date() < 30 * 24 * 60 * 60 * 1000
    }

    if (shouldRenew) {
      try {
        this.#refreshing = this.#updateSslCertificate(hostName)
      } catch (error) {
        warn('error while refreshing ssl certificate', { error })
        throw error
      }
    }
    if (certificateIsValid) {
      // still valid  : does not need to wait for the refresh
      return { cert, key }
    }
    // invalid cert : wait for refresh
    return this.#refreshing
  }

  // middleware that will serve the http challenge to let's encrypt servers
  #acmeChallendMiddleware(req, res) {
    const { params } = req
    debug('fetching challenge for token ', params.token)
    const challenge = this.#challenges[params.token]
    debug('challenge content is ', challenge)
    if (challenge === undefined) {
      res.status(404)
      res.end()
      return
    }

    res.write(challenge)
    res.end()
    debug('successfully answered challenge ')
  }

  register() {
    this.#express.use(this.#challengePath, this.#acmeChallendMiddleware.bind(this))
    // @todo : here we should check certificates of every let s encrypt enabled hostname
  }
}
