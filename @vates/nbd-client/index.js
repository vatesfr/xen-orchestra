'use strict'
const assert = require('node:assert')
const { Socket } = require('node:net')
const { connect } = require('node:tls')
const {
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
} = require('./constants.js')
const { fromCallback } = require('promise-toolbox')
const { readChunkStrict } = require('@vates/read-chunk')

// documentation is here : https://github.com/NetworkBlockDevice/nbd/blob/master/doc/proto.md

module.exports = class NbdClient {
  #serverAddress
  #serverCert
  #serverPort
  #serverSocket

  #exportName
  #exportSize

  // AFAIK, there is no guaranty the server answers in the same order as the queries
  // so we handle a backlog of command waiting for response and handle concurrency manually

  #waitingForResponse // there is already a listenner waiting for a response
  #nextCommandQueryId = BigInt(0)
  #commandQueryBacklog // map of command waiting for an response queryId => { size/*in byte*/, resolve, reject}

  constructor({ address, port = NBD_DEFAULT_PORT, exportname, cert }) {
    this.#serverAddress = address
    this.#serverPort = port
    this.#exportName = exportname
    this.#serverCert = cert
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

  async connect() {
    // first we connect to the serve without tls, and then we upgrade the connection
    // to tls during the handshake
    await this.#unsecureConnect()
    await this.#handshake()

    // reset internal state if we reconnected a nbd client
    this.#commandQueryBacklog = new Map()
    this.#waitingForResponse = false
  }

  async disconnect() {
    const buffer = Buffer.alloc(28)
    buffer.writeInt32BE(NBD_REQUEST_MAGIC, 0) // it is a nbd request
    buffer.writeInt16BE(0, 4) // no command flags for a disconnect
    buffer.writeInt16BE(NBD_CMD_DISC, 6) // we want to disconnect from nbd server
    await this.#write(buffer)
    await this.#serverSocket.destroy()
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
    // it's  implictly closing the negociation phase.
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
    return readChunkStrict(this.#serverSocket, length)
  }

  #write(buffer) {
    return fromCallback.call(this.#serverSocket, 'write', buffer)
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
    await this.disconnect()
  }

  async #readBlockResponse() {
    // ensure at most one read occur in parallel
    if (this.#waitingForResponse) {
      return
    }

    try {
      this.#waitingForResponse = true
      const magic = await this.#readInt32()

      if (magic !== NBD_REPLY_MAGIC) {
        throw new Error(`magic number for block answer is wrong : ${magic} ${NBD_REPLY_MAGIC}`)
      }

      const error = await this.#readInt32()
      if (error !== 0) {
        // @todo use error code from constants.mjs
        throw new Error(`GOT ERROR CODE  : ${error}`)
      }

      const blockQueryId = await this.#readInt64()
      const query = this.#commandQueryBacklog.get(blockQueryId)
      if (!query) {
        throw new Error(` no query associated with id ${blockQueryId}`)
      }
      this.#commandQueryBacklog.delete(blockQueryId)
      const data = await this.#read(query.size)
      query.resolve(data)
      this.#waitingForResponse = false
      if (this.#commandQueryBacklog.size > 0) {
        await this.#readBlockResponse()
      }
    } catch (error) {
      // reject all the promises
      // we don't need to call readBlockResponse on failure
      // since we will empty the backlog
      await this.#rejectAll(error)
    }
  }

  async readBlock(index, size = NBD_DEFAULT_BLOCK_SIZE) {
    const queryId = this.#nextCommandQueryId
    this.#nextCommandQueryId++

    // create and send  command at once to ensure there is no concurrency issue
    const buffer = Buffer.alloc(28)
    buffer.writeInt32BE(NBD_REQUEST_MAGIC, 0) // it is a nbd request
    buffer.writeInt16BE(0, 4) // no command flags for a simple block read
    buffer.writeInt16BE(NBD_CMD_READ, 6) // we want to read a data block
    buffer.writeBigUInt64BE(queryId, 8)
    // byte offset in the raw disk
    buffer.writeBigUInt64BE(BigInt(index) * BigInt(size), 16)
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

  async *readBlocks(indexGenerator) {
    // default : read all blocks
    if (indexGenerator === undefined) {
      const exportSize = this.#exportSize
      const chunkSize = 2 * 1024 * 1024
      indexGenerator = function* () {
        const nbBlocks = Math.ceil(exportSize / chunkSize)
        for (let index = 0; index < nbBlocks; index++) {
          yield { index, size: chunkSize }
        }
      }
    }
    const readAhead = []
    const readAheadMaxLength = 10

    // read all blocks, but try to keep readAheadMaxLength promise waiting ahead
    for (const { index, size } of indexGenerator()) {
      // stack readAheadMaxLengthpromise before starting to handle the results
      if (readAhead.length === readAheadMaxLength) {
        // any error will stop reading blocks
        yield readAhead.shift()
      }

      // error is handled during unshift
      const promise = this.readBlock(index, size)
      promise.catch(() => {})
      readAhead.push(promise)
    }
    while (readAhead.length > 0) {
      yield readAhead.shift()
    }
  }
}
