import { once } from 'node:events'
import { isIP, isIPv6, Socket } from 'node:net'
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
   * @param {object} [options] - see {@link AbstractNbdClient}
   */
  constructor(
    { address, port = NBD_DEFAULT_PORT, exportname, cert, httpProxy, proxyRejectUnauthorized = true },
    options
  ) {
    super({ exportname }, options)
    this.#serverAddress = address
    this.#serverPort = port
    this.#serverCert = cert
    this.#httpProxy = httpProxy
    this.#proxyRejectUnauthorized = proxyRejectUnauthorized
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
    // URL keeps the brackets around IPv6 addresses
    const proxyHost = proxy.hostname.replace(/^\[(.*)\]$/, '$1')
    const proxyPort = Number(proxy.port) || (isHttps ? 443 : 80)

    let socket
    if (isHttps) {
      socket = connect({
        host: proxyHost,
        port: proxyPort,
        rejectUnauthorized: this.#proxyRejectUnauthorized,
        // SNI does not support IP addresses
        servername: isIP(proxyHost) === 0 ? proxyHost : undefined,
      })
      await once(socket, 'secureConnect')
    } else {
      socket = new Socket()
      socket.connect(proxyPort, proxyHost)
      await once(socket, 'connect')
    }

    try {
      const address = this.#serverAddress
      const target = `${isIPv6(address) ? `[${address}]` : address}:${this.#serverPort}`
      let request = `CONNECT ${target} HTTP/1.1\r\nHost: ${target}\r\n`
      if (proxy.username !== '' || proxy.password !== '') {
        const credentials = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`
        request += `Proxy-Authorization: Basic ${Buffer.from(credentials).toString('base64')}\r\n`
      }
      socket.write(request + '\r\n')

      // read the proxy response headers, the NBD server may already have sent
      // some data after them
      const { head, rest } = await new Promise((resolve, reject) => {
        let buffer = Buffer.alloc(0)
        const cleanUp = () => {
          socket.removeListener('data', onData)
          socket.removeListener('end', onEnd)
          socket.removeListener('error', reject)
        }
        const onData = chunk => {
          buffer = Buffer.concat([buffer, chunk])
          const index = buffer.indexOf('\r\n\r\n')
          if (index !== -1) {
            cleanUp()
            socket.pause()
            resolve({ head: buffer.subarray(0, index).toString(), rest: buffer.subarray(index + 4) })
          } else if (buffer.length > 16 * 1024) {
            cleanUp()
            reject(new Error('HTTP proxy response headers too large'))
          }
        }
        const onEnd = () => {
          cleanUp()
          reject(new Error('HTTP proxy closed the connection before answering'))
        }
        socket.on('data', onData)
        socket.once('end', onEnd)
        socket.once('error', reject)
      })

      const statusLine = head.split('\r\n', 1)[0]
      const statusCode = Number(statusLine.split(' ')[1])
      if (statusCode !== 200) {
        const error = new Error(`HTTP proxy refused to connect to ${target}: ${statusLine}`)
        error.code = 'NBD_PROXY_CONNECT_FAILED'
        throw error
      }
      if (rest.length !== 0) {
        socket.unshift(rest)
      }
      return socket
    } catch (error) {
      socket.destroy()
      throw error
    }
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
