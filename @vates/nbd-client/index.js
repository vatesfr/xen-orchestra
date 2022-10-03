const assert = require('node:assert')
const { Socket } = require('node:net')
const { connect } = require('node:tls')

// documentation is here : https://github.com/NetworkBlockDevice/nbd/blob/master/doc/proto.md

const INIT_PASSWD = 0x4e42444d41474943 // "NBDMAGIC" ensure we're connected to a nbd server
const OPTS_MAGIC = 0x49484156454f5054 // "IHAVEOPT" start an option block
const NBD_OPT_REPLY_MAGIC = 0x3e889045565a9 // magic received during negociation
const NBD_OPT_EXPORT_NAME = 1
const NBD_OPT_ABORT = 2
const NBD_OPT_LIST = 3
const NBD_OPT_STARTTLS = 5
const NBD_OPT_INFO = 6
const NBD_OPT_GO = 7

const NBD_FLAG_HAS_FLAGS = 1 << 0
const NBD_FLAG_READ_ONLY = 1 << 1
const NBD_FLAG_SEND_FLUSH = 1 << 2
const NBD_FLAG_SEND_FUA = 1 << 3
const NBD_FLAG_ROTATIONAL = 1 << 4
const NBD_FLAG_SEND_TRIM = 1 << 5

const NBD_FLAG_FIXED_NEWSTYLE = 1 << 0

const NBD_CMD_FLAG_FUA = 1 << 0
const NBD_CMD_FLAG_NO_HOLE = 1 << 1
const NBD_CMD_FLAG_DF = 1 << 2
const NBD_CMD_FLAG_REQ_ONE = 1 << 3
const NBD_CMD_FLAG_FAST_ZERO = 1 << 4

const NBD_CMD_READ = 0
const NBD_CMD_WRITE = 1
const NBD_CMD_DISC = 2
const NBD_CMD_FLUSH = 3
const NBD_CMD_TRIM = 4
const NBD_CMD_CACHE = 5
const NBD_CMD_WRITE_ZEROES = 6
const NBD_CMD_BLOCK_STATUS = 7
const NBD_CMD_RESIZE = 8

const NBD_REQUEST_MAGIC = 0x25609513 // magic number to create a new NBD request to send to the server
const NBD_REPLY_MAGIC = 0x67446698 // magic number received from the server when reading response to a nbd request

const NBD_DEFAULT_PORT = 10809
const NBD_DEFAULT_BLOCK_SIZE = 64 * 1024
const MAX_BUFFER_LENGTH = 10 * 1024 * 1024

module.exports = class NbdClient {
  _serverAddress
  _serverCert
  _serverPort
  _serverSocket
  _useSecureConnection = false

  _exportname
  _nbDiskBlocks = 0

  _buffer = Buffer.alloc(0)
  _readPromiseResolve
  _waitingForLength = 0

  // AFAIK, there is no guaranty the server answer in the same order as the query
  _nextBlockQueryId = 0
  _blockQueries = {} // map of queries waiting for an answer

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

  async _addListenners() {
    const serverSocket = this._serverSocket
    serverSocket.on('data', data => {
      this._buffer = Buffer.concat([this._buffer, Buffer.from(data)])
      if (this._buffer.length > MAX_BUFFER_LENGTH) {
        throw new Error(
          `Buffer grown too much with a total size of  ${this._buffer.length} bytes (last chunk is ${data.length})`
        )
      }
      // if we're waiting for a specific bit length (in the handshake for example or a block data)
      if (this._readPromiseResolve && this._buffer.length >= this._waitingForLength) {
        this._readPromiseResolve(this._takeFromBuffer(this._waitingForLength))
        this._readPromiseResolve = null
        this._waitingForLength = 0
      } else {
        //
        if (!this._readPromiseResolve && this._buffer.length > 4) {
          if (this._buffer.readInt32BE(0) === NBD_REPLY_MAGIC) {
            this._readBlockResponse()
          }
          // keep the received bits in the buffer for subsequent use
        }
      }
    })

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
    assert(flags === NBD_FLAG_FIXED_NEWSTYLE) // only FIXED_NEWSTYLE one is supported from the server options
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
    const res = Buffer.from(this._buffer.slice(0, length))
    this._buffer = this._buffer.slice(length)
    return res
  }

  _readFromSocket(length) {
    if (this._buffer.length >= length) {
      return this._takeFromBuffer(length)
    }
    return new Promise(resolve => {
      this._readPromiseResolve = resolve
      this._waitingForLength = length
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
      console.error('magic number for block answer is wrong : ', magic)
      return
    }
    // error
    const error = await this._readFromSocketInt32()
    if (error !== 0) {
      console.error('GOT ERROR CODE ', error)
      return
    }

    const blockQueryId = await this._readFromSocketInt64()
    const query = this._blockQueries[blockQueryId]
    if (!query) {
      throw new Error(` no query associated with id ${blockQueryId}`)
    }
    delete this._blockQueries[blockQueryId]
    query.resolve(await this._readFromSocket(query.size))
  }

  async readBlock(index, size = NBD_DEFAULT_BLOCK_SIZE) {
    const queryId = this._nextBlockQueryId
    this._nextBlockQueryId++
    this._writeToSocketInt32(NBD_REQUEST_MAGIC)
    this._writeToSocketInt16(0) // no command flags for a simple block read
    this._writeToSocketInt16(NBD_CMD_READ)
    this._writeToSocketInt64(queryId)
    // byte offset in the raw disk
    this._writeToSocketInt64(BigInt(index) * BigInt(size))
    // ensure we do not read after the end of the export (which immediatly disconnect us)
    // will overflow on disk > 2^^32 bytes

    const maxSize = Math.min(Number(this._exportSize) - index * size, size)
    console.log({ size, maxSize })
    // size wanted
    this._writeToSocketUInt32(maxSize)

    return new Promise(resolve => {
      this._blockQueries[queryId] = {
        size: maxSize,
        resolve,
      }
    })
  }
}
