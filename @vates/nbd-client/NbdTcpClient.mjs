import { once } from 'node:events'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { isIPv6, Socket } from 'node:net'
import { connect } from 'node:tls'
import { spawn } from 'node:child_process'
import AbstractNbdClient from './AbstractNbdClient.mjs'
import { NBD_DEFAULT_PORT, NBD_OPT_STARTTLS } from './constants.mjs'

/**
 * NBD client talking to a server over TCP, optionally upgrading the connection
 * to TLS during the handshake.
 *
 * @extends {AbstractNbdClient}
 */
export default class NbdTcpClient extends AbstractNbdClient {
  #httpProxy
  #proxyRejectUnauthorized
  #proxyTimeout
  #serverAddress
  #serverCert
  #serverPort

  /**
   * @param {object} settings
   * @param {string} settings.address
   * @param {number} [settings.port]
   * @param {string} [settings.exportname]
   * @param {string} [settings.cert] - PEM certificate, enables TLS when set
   * @param {string} [settings.httpProxy] - URL of an HTTP(S) proxy, the connection is tunneled through it with `CONNECT`
   * @param {boolean} [settings.proxyRejectUnauthorized=true] - whether to check the certificate of an HTTPS proxy
   * @param {number} [settings.proxyTimeout=6e4] - delay in ms after which an unanswered `CONNECT` is aborted
   * @param {object} [options] - see {@link AbstractNbdClient}
   */
  constructor(
    {
      address,
      port = NBD_DEFAULT_PORT,
      exportname,
      cert,
      httpProxy,
      proxyRejectUnauthorized = true,
      proxyTimeout = 6e4,
    },
    options
  ) {
    super({ exportname }, options)
    // other proxy protocols (e.g. SOCKS) are not supported for now
    if (httpProxy !== undefined) {
      const { protocol } = new URL(httpProxy)
      if (protocol !== 'http:' && protocol !== 'https:') {
        const error = new Error(`unsupported proxy protocol ${protocol}, only http: and https: are supported`)
        error.code = 'NBD_PROXY_UNSUPPORTED_PROTOCOL'
        throw error
      }
    }
    this.#serverAddress = address
    this.#serverPort = port
    this.#serverCert = cert
    this.#httpProxy = httpProxy
    this.#proxyRejectUnauthorized = proxyRejectUnauthorized
    this.#proxyTimeout = proxyTimeout
  }

  /**
   * Open a raw TCP tunnel to the NBD server through an HTTP proxy
   *
   * https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.6
   *
   * @returns {Promise<import('node:net').Socket>}
   */
  async #connectThroughHttpProxy() {
    const proxy = new URL(this.#httpProxy)
    const isHttps = proxy.protocol === 'https:'

    const address = this.#serverAddress
    const target = `${isIPv6(address) ? `[${address}]` : address}:${this.#serverPort}`
    const headers = { host: target }
    if (proxy.username !== '' || proxy.password !== '') {
      const credentials = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`
      headers['proxy-authorization'] = `Basic ${Buffer.from(credentials).toString('base64')}`
    }

    const req = (isHttps ? httpsRequest : httpRequest)({
      agent: false,
      headers,
      // URL keeps the brackets around IPv6 addresses
      hostname: proxy.hostname.replace(/^\[(.*)\]$/, '$1'),
      method: 'CONNECT',
      path: target,
      port: proxy.port,
      rejectUnauthorized: this.#proxyRejectUnauthorized,
      timeout: this.#proxyTimeout,
    })
    // `timeout` only emits an event, the request must be aborted explicitly
    req.on('timeout', () => {
      const error = new Error(`HTTP proxy did not answer the CONNECT to ${target} in time`)
      error.code = 'NBD_PROXY_CONNECT_TIMEOUT'
      req.destroy(error)
    })
    req.end()

    // the NBD server may already have sent some data, it is in `head`
    const [res, socket, head] = await once(req, 'connect')
    // the tunnel is established, NBD has its own timeouts
    socket.setTimeout(0)
    if (res.statusCode !== 200) {
      socket.destroy()
      const error = new Error(`HTTP proxy refused to connect to ${target}: ${res.statusCode} ${res.statusMessage}`)
      error.code = 'NBD_PROXY_CONNECT_FAILED'
      throw error
    }
    if (head.length !== 0) {
      socket.unshift(head)
    }
    return socket
  }

  // mandatory , at least to start the handshake: the connection always starts
  // unsecured, and is upgraded to TLS during the handshake
  async _openTransport() {
    if (this.#httpProxy !== undefined) {
      const socket = await this.#connectThroughHttpProxy()
      return { readable: socket, writable: socket }
    }

    const socket = new Socket()
    await new Promise((resolve, reject) => {
      socket.connect(this.#serverPort, this.#serverAddress)
      socket.once('error', reject)
      socket.once('connect', () => {
        socket.removeListener('error', reject)
        resolve()
      })
    })
    return { readable: socket, writable: socket }
  }

  async _secureTransport(transport) {
    if (this.#serverCert === undefined) {
      return transport
    }
    await this._sendOption(transport, NBD_OPT_STARTTLS)
    const secured = await new Promise((resolve, reject) => {
      const socket = connect({
        socket: transport.writable,
        rejectUnauthorized: false,
        cert: this.#serverCert,
      })
      socket.once('error', reject)
      socket.once('secureConnect', () => {
        socket.removeListener('error', reject)
        resolve(socket)
      })
    })
    return { readable: secured, writable: secured }
  }

  /**
   * @param {AbortSignal} [signal]
   * @returns {Promise<{ offset: number, length: number, type: number }[]>}
   */
  /* async */ getMap(signal) {
    return new Promise((resolve, reject) => {
      const process = spawn('nbdinfo', [
        '--json',
        '--map',
        `nbd://${this.#serverAddress}:${this.#serverPort}/${encodeURIComponent(this.exportName)}`,
      ])
      let text = ''
      let errText = ''
      process.stdout.on('data', data => (text += data))
      process.stderr.on('data', data => (errText += data))
      const onAbort = () => {
        process.kill()
        reject(signal.reason)
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      process.on('error', err => {
        signal?.removeEventListener('abort', onAbort)
        reject(err)
      })
      process.on('close', code => {
        signal?.removeEventListener('abort', onAbort)
        if (code !== 0) {
          return reject(new Error(`Error during getMap (code: ${code}): ${errText}`))
        }
        try {
          const json = JSON.parse(text)
          resolve(json)
        } catch (error) {
          reject(new Error(`${error} ${text}`))
        }
      })
    })
  }
}
