const assert = require('node:assert')
const { Socket } = require('node:net')
const { connect } = require('node:tls')

const BLOCK_SIZE = 64 * 1024
module.exports = class NbdClient {
  _address
  _cert
  _exportname
  _port
  _client
  _buffer = Buffer.alloc(0)
  _readPromiseResolve
  _waitingForLength = 0
  _nbDiskBlocks = 0
  _handle = 0
  _secure = false
  _queries = {}

  constructor({ address, port = 10809, exportname, cert, secure = true }) {
    this._address = address
    this._port = port
    this._exportname = exportname
    this._cert = cert
    this._secure = secure
  }

  get nbBlocks() {
    return this._nbDiskBlocks
  }

  async _addListenners() {
    const client = this._client
    client.on('data', data => {
      this._buffer = Buffer.concat([this._buffer, Buffer.from(data)])
      if (this._readPromiseResolve && this._buffer.length >= this._waitingForLength) {
        this._readPromiseResolve(this._takeFromBuffer(this._waitingForLength))
        this._readPromiseResolve = null
        this._waitingForLength = 0
      } else {
        if (!this._readPromiseResolve && this._buffer.length > 4) {
          if (this._buffer.readInt32BE(0) === 0x67446698) {
            this._readResponse()
          }
        }
      }
    })

    client.on('close', function () {
      console.log('Connection closed')
    })
    client.on('error', function (err) {
      console.error('ERRROR', err)
    })
  }

  async _tlsConnect() {
    return new Promise(resolve => {
      this._client = connect(
        {
          socket: this._client,
          rejectUnauthorized: false,
          cert: this._cert,
        },
        resolve
      )
      this._addListenners()
    })
  }
  async _unsecureConnect() {
    console.log('unsecure connect')
    this._client = new Socket()
    this._addListenners()
    return new Promise((resolve, reject) => {
      this._client.connect(this._port, this._address, () => {
        console.log('connected will resolve')
        resolve()
      })
    })
  }
  async connect() {
    await this._unsecureConnect()
    await this._handshake()
  }

  async _sendOption(option, buffer = Buffer.alloc(0)) {
    await this._writeToSocket(Buffer.from('IHAVEOPT'))
    await this._writeToSocketInt32(option)
    await this._writeToSocketInt32(buffer.length)
    await this._writeToSocket(buffer)
    assert(await this._readFromSocketInt64(), 0x3e889045565a9) //magic number everywhere
    assert(await this._readFromSocketInt32(), option) // the option passed
    assert(await this._readFromSocketInt32(), 1) // ACK
    const length = await this._readFromSocketInt32()
    assert(length === 0) // length
  }

  async _handshake() {
    assert(await this._readFromSocket(8), 'NBDMAGIC')
    assert(await this._readFromSocket(8), 'IHAVEOPT')
    const flagsBuffer = await this._readFromSocket(2)
    const flags = flagsBuffer.readInt16BE(0)
    assert(flags === 1) // only FIXED_NEWSTYLE one is supported
    await this._writeToSocketInt32(1) //client also support  NBD_FLAG_C_FIXED_NEWSTYLE

    if (this._secure) {
      // upgrade socket to TLS
      await this._sendOption(5) //command NBD_OPT_STARTTLS
      await this._tlsConnect()
      console.log('switched to TLS')
    }

    // send export name it's also implictly closing the negociation phase
    await this._writeToSocket(Buffer.from('IHAVEOPT'))
    await this._writeToSocketInt32(1) //command NBD_OPT_EXPORT_NAME
    await this._writeToSocketInt32(this._exportname.length)

    await this._writeToSocket(Buffer.from(this._exportname))
    // 8 + 2 + 124
    const answer = await this._readFromSocket(134)
    const exportSize = answer.readBigUInt64BE(0)
    const transmissionFlags = answer.readInt16BE(8) // 3 is readonly
    this._nbDiskBlocks = Number(exportSize / BigInt(64 * 1024))
    this._exportSize = exportSize
    console.log(`disk is ${exportSize} bytes ${this._nbDiskBlocks} 64KB blocks`)
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
      this._client.write(buffer, resolve)
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

  _writeToSocketInt32(int) {
    const buffer = Buffer.alloc(4)
    buffer.writeInt32BE(int)
    return this._writeToSocket(buffer)
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

  async _readResponse() {
    //NBD_SIMPLE_REPLY_MAGIC
    const magic = await this._readFromSocketInt32()

    if (magic !== 0x67446698) {
      console.error('magic number for block answer is wrong : ', magic)
      return
    }
    // error
    const error = await this._readFromSocketInt32()
    if (error !== 0) {
      console.error('GOT ERROR CODE ', error)
      return
    }
    // handle
    const handle = await this._readFromSocketInt64()
    const query = this._queries[handle]
    if (!query) {
      console.log('no query associated with handle ', response.handle, Object.keys(this._queries))
      return
    }
    delete this._queries[handle]
    query.resolve(await this._readFromSocket(query.size))
  }

  async readBlock(index, size = BLOCK_SIZE) {
    const handle = this._handle
    this._handle++
    this._writeToSocketInt32(0x25609513) //NBD_REQUEST MAGIC
    this._writeToSocketInt16(0) //command flags
    this._writeToSocketInt16(0) //READ
    this._writeToSocketInt64(handle)
    this._writeToSocketInt64(BigInt(index) * BigInt(size))
    // ensure we do not read after the end of the export (which immediatly disconnect us)
    // will overflow on disk > 2^^32 bytes

    const maxSize = Math.min(Number(this._exportSize) - index * size, size)
    console.log({ size, maxSize })
    this._writeToSocketUInt32(maxSize)

    return new Promise(resolve => {
      this._queries[handle] = {
        size: maxSize,
        resolve,
      }
    })
  }
}
