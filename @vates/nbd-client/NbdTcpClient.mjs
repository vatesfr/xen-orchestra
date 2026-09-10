import { Socket } from 'node:net'
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
  #serverAddress
  #serverCert
  #serverPort

  /**
   * @param {object} settings
   * @param {string} settings.address
   * @param {number} [settings.port]
   * @param {string} [settings.exportname]
   * @param {string} [settings.cert] - PEM certificate, enables TLS when set
   * @param {object} [options] - see {@link AbstractNbdClient}
   */
  constructor({ address, port = NBD_DEFAULT_PORT, exportname, cert }, options) {
    super({ exportname }, options)
    this.#serverAddress = address
    this.#serverPort = port
    this.#serverCert = cert
  }

  // mandatory , at least to start the handshake: the connection always starts
  // unsecured, and is upgraded to TLS during the handshake
  async _openTransport() {
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
    await this._sendOption(NBD_OPT_STARTTLS)
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
