import assert from 'node:assert'
import { Socket } from 'node:net'
import { connect } from 'node:tls'
import { pRetry, pDelay, pTimeout, pFromCallback } from 'promise-toolbox'
import { readChunkStrict } from '@vates/read-chunk'
import { createLogger } from '@xen-orchestra/log'
import {
  INIT_PASSWD,
  NBD_CMD_READ,
  NBD_DEFAULT_BLOCK_SIZE,
  NBD_DEFAULT_PORT,
  NBD_FLAG_FIXED_NEWSTYLE,
  NBD_FLAG_HAS_FLAGS,
  NBD_OPT_EXPORT_NAME,
  NBD_OPT_REPLY_MAGIC,
  NBD_OPT_STARTTLS,
  NBD_REPLY_ACK,
  NBD_REPLY_MAGIC,
  NBD_REQUEST_MAGIC,
  OPTS_MAGIC,
  NBD_CMD_DISC,
} from './constants.mjs'

const { warn } = createLogger('vates:nbd-client')

// documentation is here : https://github.com/NetworkBlockDevice/nbd/blob/master/doc/proto.md

export default class NbdClient {
  #serverAddress
  #serverCert
  #serverPort
  #serverSocket

  #exportName
  #exportSize

  #waitBeforeReconnect
  #readBlockRetries
  #reconnectRetry
  #connectTimeout
  #messageTimeout

  // AFAIK, there is no guaranty the server answers in the same order as the queries
  // so we handle a backlog of command waiting for response and handle concurrency manually

  #waitingForResponse // there is already a listener waiting for a response
  #nextCommandQueryId = BigInt(0)
  #commandQueryBacklog // map of command waiting for a response queryId => { size/*in byte*/, resolve, reject}
  #connected = false

  #reconnectingPromise
  constructor(
    { address, port = NBD_DEFAULT_PORT, exportname, cert },
    {
      connectTimeout = 6e4,
      messageTimeout = 6e4,
      waitBeforeReconnect = 1e3,
      readBlockRetries = 5,
      reconnectRetry = 5,
    } = {}
  ) {
    this.#serverAddress = address
    this.#serverPort = port
    this.#exportName = exportname
    this.#serverCert = cert
    this.#waitBeforeReconnect = waitBeforeReconnect
    this.#readBlockRetries = readBlockRetries
    this.#reconnectRetry = reconnectRetry
    this.#connectTimeout = connectTimeout
    this.#messageTimeout = messageTimeout
  }

  get exportSize() {
    return this.#exportSize
  }

  async #tlsConnect() {
    return new Promise((resolve, reject) => {
      this.#serverSocket = connect({
        socket: this.#serverSocket,
        rejectUnauthorized: false,
        cert: this.#serverCert,
      })
      this.#serverSocket.once('error', reject)
      this.#serverSocket.once('secureConnect', () => {
        this.#serverSocket.removeListener('error', reject)
        resolve()
      })
    })
  }

  // mandatory , at least to start the handshake
  async #unsecureConnect() {
    this.#serverSocket = new Socket()
    return new Promise((resolve, reject) => {
      this.#serverSocket.connect(this.#serverPort, this.#serverAddress)
      this.#serverSocket.once('error', reject)
      this.#serverSocket.once('connect', () => {
        this.#serverSocket.removeListener('error', reject)
        resolve()
      })
    })
  }

  async #connect() {
    // first we connect to the server without tls, and then we upgrade the connection
    // to tls during the handshake
    await this.#unsecureConnect()
    await this.#handshake()
    this.#connected = true
    // reset internal state if we reconnected a nbd client
    this.#commandQueryBacklog = new Map()
    this.#waitingForResponse = false
  }
  async connect() {
    return pTimeout.call(this.#connect(), this.#connectTimeout)
  }

  async disconnect() {
    if (!this.#connected) {
      return
    }
    this.#connected = false
    const socket = this.#serverSocket

    const queryId = this.#nextCommandQueryId
    this.#nextCommandQueryId++

    const buffer = Buffer.alloc(28)
    buffer.writeInt32BE(NBD_REQUEST_MAGIC, 0) // it is a nbd request
    buffer.writeInt16BE(0, 4) // no command flags for a disconnect
    buffer.writeInt16BE(NBD_CMD_DISC, 6) // we want to disconnect from nbd server
    buffer.writeBigUInt64BE(queryId, 8)
    buffer.writeBigUInt64BE(0n, 16)
    buffer.writeInt32BE(0, 24)
    const promise = pFromCallback(cb => {
      socket.end(buffer, 'utf8', cb)
    })
    try {
      await pTimeout.call(promise, this.#messageTimeout)
    } catch (error) {
      socket.destroy()
    }
    this.#serverSocket = undefined
    this.#connected = false
  }

  #clearReconnectPromise = () => {
    this.#reconnectingPromise = undefined
  }

  async #reconnect() {
    await this.disconnect().catch(() => {})
    await pDelay(this.#waitBeforeReconnect) // need to let the xapi clean things on its side
    await this.connect()
  }

  async reconnect() {
    // we need to ensure reconnections do not occur in parallel
    if (this.#reconnectingPromise === undefined) {
      this.#reconnectingPromise = pRetry(() => this.#reconnect(), {
        tries: this.#reconnectRetry,
      })
      this.#reconnectingPromise.then(this.#clearReconnectPromise, this.#clearReconnectPromise)
    }

    return this.#reconnectingPromise
  }

  // we can use individual read/write from the socket here since there is no concurrency
  async #sendOption(option, buffer = Buffer.alloc(0)) {
    await this.#write(OPTS_MAGIC)
    await this.#writeInt32(option)
    await this.#writeInt32(buffer.length)
    await this.#write(buffer)
    assert.strictEqual(await this.#readInt64(), NBD_OPT_REPLY_MAGIC) // magic number everywhere
    assert.strictEqual(await this.#readInt32(), option) // the option passed
    assert.strictEqual(await this.#readInt32(), NBD_REPLY_ACK) // ACK
    const length = await this.#readInt32()
    assert.strictEqual(length, 0) // length
  }

  // we can use individual read/write from the socket here since there is only one handshake at once, no concurrency
  async #handshake() {
    assert((await this.#read(8)).equals(INIT_PASSWD))
    assert((await this.#read(8)).equals(OPTS_MAGIC))
    const flagsBuffer = await this.#read(2)
    const flags = flagsBuffer.readInt16BE(0)
    assert.strictEqual(flags & NBD_FLAG_FIXED_NEWSTYLE, NBD_FLAG_FIXED_NEWSTYLE) // only FIXED_NEWSTYLE one is supported from the server options
    await this.#writeInt32(NBD_FLAG_FIXED_NEWSTYLE) // client also support  NBD_FLAG_C_FIXED_NEWSTYLE

    if (this.#serverCert !== undefined) {
      // upgrade socket to TLS if needed
      await this.#sendOption(NBD_OPT_STARTTLS)
      await this.#tlsConnect()
    }

    // send export name we want to access.
    // it's implicitly closing the negotiation phase.
    await this.#write(OPTS_MAGIC)
    await this.#writeInt32(NBD_OPT_EXPORT_NAME)
    const exportNameBuffer = Buffer.from(this.#exportName)
    await this.#writeInt32(exportNameBuffer.length)
    await this.#write(exportNameBuffer)

    // 8 (export size ) + 2 (flags) + 124 zero = 134
    // must read all to ensure nothing stays in the  buffer
    const answer = await this.#read(134)
    this.#exportSize = answer.readBigUInt64BE(0)
    const transmissionFlags = answer.readInt16BE(8)
    assert.strictEqual(transmissionFlags & NBD_FLAG_HAS_FLAGS, NBD_FLAG_HAS_FLAGS, 'NBD_FLAG_HAS_FLAGS') // must always be 1 by the norm

    // note : xapi server always send NBD_FLAG_READ_ONLY (3) as a flag
  }

  #read(length) {
    const promise = readChunkStrict(this.#serverSocket, length)
    return pTimeout.call(promise, this.#messageTimeout)
  }

  #write(buffer) {
    let timeout
    const messageTimeout = this.#messageTimeout
    const socket = this.#serverSocket
    return Promise.race([
      new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
          reject(new Error('timeout'))
        }, messageTimeout)
      }),
      new Promise(resolve =>
        socket.write(buffer, () => {
          clearTimeout(timeout)
          resolve()
        })
      ),
    ])
  }

  async #readInt32() {
    const buffer = await this.#read(4)
    return buffer.readInt32BE(0)
  }

  async #readInt64() {
    const buffer = await this.#read(8)
    return buffer.readBigUInt64BE(0)
  }

  #writeInt32(int) {
    const buffer = Buffer.alloc(4)
    buffer.writeInt32BE(int)
    return this.#write(buffer)
  }

  // when one read fail ,stop everything
  async #rejectAll(error) {
    this.#commandQueryBacklog.forEach(({ reject }) => {
      reject(error)
    })
  }

  async #readBlockResponse() {
    // ensure at most one read occur in parallel
    if (this.#waitingForResponse) {
      return
    }
    try {
      this.#waitingForResponse = true
      const buffer = await this.#read(16)
      const magic = buffer.readInt32BE(0)

      if (magic !== NBD_REPLY_MAGIC) {
        throw new Error(`magic number for block answer is wrong : ${magic} ${NBD_REPLY_MAGIC}`)
      }

      const error = buffer.readInt32BE(4)
      if (error !== 0) {
        // @todo use error code from constants.mjs
        throw new Error(`GOT ERROR CODE  : ${error}`)
      }

      const blockQueryId = buffer.readBigUInt64BE(8)
      const query = this.#commandQueryBacklog.get(blockQueryId)
      if (!query) {
        throw new Error(` no query associated with id ${blockQueryId}`)
      }
      this.#commandQueryBacklog.delete(blockQueryId)
      const data = await this.#read(query.size)
      query.resolve(data)
      this.#waitingForResponse = false
      if (this.#commandQueryBacklog.size > 0) {
        // it doesn't throw directly but will throw all relevant promise on failure
        this.#readBlockResponse()
      }
    } catch (error) {
      // reject all the promises
      // we don't need to call readBlockResponse on failure
      // since we will empty the backlog
      await this.#rejectAll(error)
    }
  }

  async #readBlock(index, size) {
    // we don't want to add anything in backlog while reconnecting
    if (this.#reconnectingPromise) {
      await this.#reconnectingPromise
    }

    const queryId = this.#nextCommandQueryId
    this.#nextCommandQueryId++

    // create and send  command at once to ensure there is no concurrency issue
    const buffer = Buffer.alloc(28)
    buffer.writeInt32BE(NBD_REQUEST_MAGIC, 0) // it is a nbd request
    buffer.writeInt16BE(0, 4) // no command flags for a simple block read
    buffer.writeInt16BE(NBD_CMD_READ, 6) // we want to read a data block
    buffer.writeBigUInt64BE(queryId, 8)
    // byte offset in the raw disk
    const offset = BigInt(index) * BigInt(size)
    const remaining = this.#exportSize - offset
    if (remaining < BigInt(size)) {
      size = Number(remaining)
    }

    buffer.writeBigUInt64BE(offset, 16)
    buffer.writeInt32BE(size, 24)

    return new Promise((resolve, reject) => {
      function decoratedReject(error) {
        error.index = index
        error.size = size
        reject(error)
      }

      // this will handle one block response, but it can be another block
      // since server does not guaranty to handle query in order
      this.#commandQueryBacklog.set(queryId, {
        size,
        resolve,
        reject: decoratedReject,
      })
      // really send the command to the server
      this.#write(buffer).catch(decoratedReject)

      // #readBlockResponse never throws directly
      // but if it fails it will reject all the promises in the backlog
      this.#readBlockResponse()
    })
  }

  async readBlock(index, size = NBD_DEFAULT_BLOCK_SIZE) {
    return pRetry(() => this.#readBlock(index, size), {
      tries: this.#readBlockRetries,
      onRetry: async err => {
        warn('will retry reading block ', index, err)
        await this.reconnect()
      },
    })
  }
}
