import assert from 'node:assert'
import { Socket } from 'node:net'
import { connect } from 'node:tls'
import {
  INIT_PASSWD,
  MAX_BUFFER_LENGTH,
  NBD_CMD_READ,
  NBD_DEFAULT_BLOCK_SIZE,
  NBD_DEFAULT_PORT,
  NBD_FLAG_FIXED_NEWSTYLE,
  NBD_FLAG_HAS_FLAGS,
  NBD_OPT_EXPORT_NAME,
  NBD_OPT_REPLY_MAGIC,
  NBD_OPT_STARTTLS,
  NBD_REPLY_MAGIC,
  NBD_REQUEST_MAGIC,
  OPTS_MAGIC,
} from './constants.mjs'

// documentation is here : https://github.com/NetworkBlockDevice/nbd/blob/master/doc/proto.md

export default class NbdClient {
  _serverAddress
  _serverCert
  _serverPort
  _serverSocket
  _useSecureConnection = false

  _exportname
  _nbDiskBlocks = 0

  _receptionBuffer = Buffer.alloc(0)
  _sendingBuffer = Buffer.alloc(0)

  // ensure the read are resolved in the right order
  _rawReadResolve = []
  _rawReadLength = []

  // AFAIK, there is no guaranty the server answer in the same order as the query
  _nextCommandQueryId = BigInt(0)
  _commandQueries = {} // map of queries waiting for an answer

  constructor({ address, port = NBD_DEFAULT_PORT, exportname, cert, secure = true }) {
    this._address = address
    this._serverPort = port
    this._exportname = exportname
    this._serverCert = cert
    this._useSecureConnection = secure
  }

  get nbBlocks() {
    return this._nbDiskBlocks
  }

  _handleData(data) {
    if (data !== undefined) {
      this._receptionBuffer = Buffer.concat([this._receptionBuffer, Buffer.from(data)])
    }
    if (this._receptionBuffer.length > MAX_BUFFER_LENGTH) {
      throw new Error(
        `Buffer grown too much with a total size of  ${this._receptionBuffer.length} bytes (last chunk is ${data.length})`
      )
    }
    // if we're waiting for a specific bit length (in the handshake for example or a block data)
    while (this._rawReadResolve.length > 0 && this._receptionBuffer.length >= this._rawReadLength[0]) {
      const resolve = this._rawReadResolve.shift()
      const waitingForLength = this._rawReadLength.shift()
      resolve(this._takeFromBuffer(waitingForLength))
    }
    if (this._rawReadResolve.length === 0 && this._receptionBuffer.length > 4) {
      if (this._receptionBuffer.readInt32BE(0) === NBD_REPLY_MAGIC) {
        this._readBlockResponse()
      }
      // keep the received bits in the buffer for subsequent use
    }

  }

  async _addListenners() {
    const serverSocket = this._serverSocket
    serverSocket.on('data', data => this._handleData(data))

    serverSocket.on('close', function () {
      console.log('Connection closed')
    })
    serverSocket.on('error', function (err) {
      throw err
    })
  }

  async _tlsConnect() {
    return new Promise(resolve => {
      this._serverSocket = connect(
        {
          socket: this._serverSocket,
          rejectUnauthorized: false,
          cert: this._serverCert,
        },
        resolve
      )
      this._addListenners()
    })
  }
  async _unsecureConnect() {
    this._serverSocket = new Socket()
    this._addListenners()
    return new Promise((resolve, reject) => {
      this._serverSocket.connect(this._serverPort, this._serverAddress, () => {
        resolve()
      })
    })
  }
  async connect() {
    await this._unsecureConnect()
    await this._handshake()
  }

  async disconnect() {
    await this._serverSocket.destroy()
  }
  async _sendOption(option, buffer = Buffer.alloc(0)) {
    await this._writeToSocket(OPTS_MAGIC)
    await this._writeToSocketInt32(option)
    await this._writeToSocketInt32(buffer.length)
    await this._writeToSocket(buffer)
    assert(await this._readFromSocketInt64(), NBD_OPT_REPLY_MAGIC) // magic number everywhere
    assert(await this._readFromSocketInt32(), option) // the option passed
    assert(await this._readFromSocketInt32(), 1) // ACK
    const length = await this._readFromSocketInt32()
    assert(length === 0) // length
  }

  async _handshake() {
    assert(await this._readFromSocket(8), INIT_PASSWD)
    assert(await this._readFromSocket(8), OPTS_MAGIC)
    const flagsBuffer = await this._readFromSocket(2)
    const flags = flagsBuffer.readInt16BE(0)
    assert(flags | NBD_FLAG_FIXED_NEWSTYLE) // only FIXED_NEWSTYLE one is supported from the server options
    await this._writeToSocketInt32(NBD_FLAG_FIXED_NEWSTYLE) // client also support  NBD_FLAG_C_FIXED_NEWSTYLE

    if (this._useSecureConnection) {
      // upgrade socket to TLS
      await this._sendOption(NBD_OPT_STARTTLS)
      await this._tlsConnect()
    }

    // send export name required it also implictly closes the negociation phase
    await this._writeToSocket(Buffer.from(OPTS_MAGIC))
    await this._writeToSocketInt32(NBD_OPT_EXPORT_NAME)
    await this._writeToSocketInt32(this._exportname.length)

    await this._writeToSocket(Buffer.from(this._exportname))
    // 8 + 2 + 124
    const answer = await this._readFromSocket(134)
    const exportSize = answer.readBigUInt64BE(0)
    const transmissionFlags = answer.readInt16BE(8)
    assert(transmissionFlags & NBD_FLAG_HAS_FLAGS, 'NBD_FLAG_HAS_FLAGS') // must always be 1 by the norm

    // xapi server always send NBD_FLAG_READ_ONLY (3) as a flag

    this._nbDiskBlocks = Number(exportSize / BigInt(NBD_DEFAULT_BLOCK_SIZE))
    this._exportSize = exportSize
  }

  _takeFromBuffer(length) {
    const res = Buffer.from(this._receptionBuffer.slice(0, length))
    this._receptionBuffer = this._receptionBuffer.slice(length)
    return res
  }

  _readFromSocket(length) {
    if (this._receptionBuffer.length >= length) {
      return this._takeFromBuffer(length)
    }
    return new Promise(resolve => {
      this._rawReadResolve.push(resolve)
      this._rawReadLength.push(length)
    })
  }

  _writeToSocket(buffer) {
    return new Promise(resolve => {
      this._serverSocket.write(buffer, resolve)
    })
  }

  async _readFromSocketInt32() {
    const buffer = await this._readFromSocket(4)

    return buffer.readInt32BE(0)
  }

  async _readFromSocketInt64() {
    const buffer = await this._readFromSocket(8)
    return buffer.readBigUInt64BE(0)
  }

  _writeToSocketUInt32(int) {
    const buffer = Buffer.alloc(4)
    buffer.writeUInt32BE(int)
    return this._writeToSocket(buffer)
  }
  _writeToSocketInt32(int) {
    const buffer = Buffer.alloc(4)
    buffer.writeInt32BE(int)
    return this._writeToSocket(buffer)
  }

  _writeToSocketInt16(int) {
    const buffer = Buffer.alloc(2)
    buffer.writeInt16BE(int)
    return this._writeToSocket(buffer)
  }
  _writeToSocketInt64(int) {
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64BE(BigInt(int))
    return this._writeToSocket(buffer)
  }

  async _readBlockResponse() {
    const magic = await this._readFromSocketInt32()

    if (magic !== NBD_REPLY_MAGIC) {
      throw new Error(`magic number for block answer is wrong : ${magic}`)
    }
    // error
    const error = await this._readFromSocketInt32()
    if (error !== 0) {
      throw new Error(`GOT ERROR CODE  : ${error}`)
    }

    const blockQueryId = await this._readFromSocketInt64()
    const query = this._commandQueries[blockQueryId]
    if (!query) {
      throw new Error(` no query associated with id ${blockQueryId} ${Object.keys(this._commandQueries)}`)
    }
    delete this._commandQueries[blockQueryId]
    const data = await this._readFromSocket(query.size)
    assert.strictEqual(data.length, query.size)
    query.resolve(data)
    this._handleData()
  }

  async readBlock(index, size = NBD_DEFAULT_BLOCK_SIZE) {
    const queryId = this._nextCommandQueryId
    this._nextCommandQueryId++

    const buffer = Buffer.alloc(28)
    buffer.writeInt32BE(NBD_REQUEST_MAGIC, 0)
    buffer.writeInt16BE(0, 4) // no command flags for a simple block read
    buffer.writeInt16BE(NBD_CMD_READ, 6)
    buffer.writeBigUInt64BE(queryId, 8)
    // byte offset in the raw disk
    const offset = BigInt(index) * BigInt(size)
    buffer.writeBigUInt64BE(offset, 16)
    // ensure we do not read after the end of the export (which immediatly disconnect us)

    const maxSize = Math.min(Number(this._exportSize - offset), size)
    // size wanted
    buffer.writeInt32BE(maxSize, 24)

    return new Promise(resolve => {
      this._commandQueries[queryId] = {
        size: maxSize,
        resolve,
      }

      // write command at once to ensure no concurrency issue
      this._writeToSocket(buffer)
    })
  }
}
