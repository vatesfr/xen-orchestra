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
  #serverAddress
  #serverCert
  #serverPort
  #serverSocket
  #useSecureConnection = false

  #exportname
  #exportSize

  #receptionBuffer = Buffer.alloc(0)

  // ensure the read are handled in the right order
  // this is a FIFO
  #rawReadBacklog = []

  // AFAIK, there is no guaranty the server answers in the same order as the queries
  #nextCommandQueryId = BigInt(0)
  #commandQueryBacklog = {} // map of queries waiting for an answer

  constructor({ address, port = NBD_DEFAULT_PORT, exportname, cert, secure = true }) {
    this.#serverAddress = address
    this.#serverPort = port
    this.#exportname = exportname
    this.#serverCert = cert
    this.#useSecureConnection = secure
  }

  get exportSize() {
    return this.#exportSize
  }

  #handleData(data) {
    if (data !== undefined) {
      this.#receptionBuffer = Buffer.concat([this.#receptionBuffer, Buffer.from(data)])
    }
    if (this.#receptionBuffer.length > MAX_BUFFER_LENGTH) {
      throw new Error(
        `Buffer grown too much with a total size of  ${this.#receptionBuffer.length} bytes (last chunk is ${
          data.length
        })`
      )
    }
    // if we're waiting for a specific bit length (in the handshake for example or a block data)
    while (this.#rawReadBacklog.length > 0 && this.#receptionBuffer.length >= this.#rawReadBacklog[0].length) {
      const { resolve, length } = this.#rawReadBacklog.shift()
      resolve(this.#takeFromBuffer(length))
    }
    // all the raw reads are done, check if we received an answer to a waiting command
    if (this.#rawReadBacklog.length === 0 && this.#receptionBuffer.length > 4) {
      if (this.#receptionBuffer.readInt32BE(0) === NBD_REPLY_MAGIC) {
        // for now only the command READ is implemented
        this.#handleBlockReadResponse().then(() => {
          // maybe there is other commands or raw reads waiting
          this.#handleData()
        })
      }
      // keep the received bits in the buffer for subsequent use
    }
  }

  async #addListenners() {
    const serverSocket = this.#serverSocket
    serverSocket.on('data', data => this.#handleData(data))

    serverSocket.on('close', function () {
      console.log('Connection closed')
    })
    serverSocket.on('error', function (err) {
      throw err
    })
  }

  async #tlsConnect() {
    return new Promise(resolve => {
      this.#serverSocket = connect(
        {
          socket: this.#serverSocket,
          rejectUnauthorized: false,
          cert: this.#serverCert,
        },
        resolve
      )
      this.#addListenners()
    })
  }

  // mandatory , at least to start the handshake
  async #unsecureConnect() {
    this.#serverSocket = new Socket()
    this.#addListenners()
    return new Promise((resolve, reject) => {
      this.#serverSocket.connect(this.#serverPort, this.#serverAddress, () => {
        resolve()
      })
    })
  }

  async connect() {
    // first we connect to the serve without tls, and then we upgrade the connection
    // to tls during the handshake
    await this.#unsecureConnect()
    await this.#handshake()
  }

  async disconnect() {
    await this.#serverSocket.destroy()
    if(this.#receptionBuffer.length > 0){
      throw new Error(`local buffer still contains ${this.#receptionBuffer.length } bytes`)
    }
  }

  // we can use individual read/write from the socket here since there is no concurrency
  async #sendOption(option, buffer = Buffer.alloc(0)) {
    await this.#write(OPTS_MAGIC)
    await this.#writeInt32(option)
    await this.#writeInt32(buffer.length)
    await this.#write(buffer)
    assert(await this.#readInt64(), NBD_OPT_REPLY_MAGIC) // magic number everywhere
    assert(await this.#readInt32(), option) // the option passed
    assert(await this.#readInt32(), 1) // ACK
    const length = await this.#readInt32()
    assert(length === 0) // length
  }

  // we can use individual read/write from the socket here since there is only one handshake at once, no concurrency
  async #handshake() {
    assert(await this.#read(8), INIT_PASSWD)
    assert(await this.#read(8), OPTS_MAGIC)
    const flagsBuffer = await this.#read(2)
    const flags = flagsBuffer.readInt16BE(0)
    assert(flags | NBD_FLAG_FIXED_NEWSTYLE) // only FIXED_NEWSTYLE one is supported from the server options
    await this.#writeInt32(NBD_FLAG_FIXED_NEWSTYLE) // client also support  NBD_FLAG_C_FIXED_NEWSTYLE

    if (this.#useSecureConnection) {
      // upgrade socket to TLS if needed
      await this.#sendOption(NBD_OPT_STARTTLS)
      await this.#tlsConnect()
    }

    // send export name we want to access.
    // it's  implictly closing the negociation phase.
    await this.#write(Buffer.from(OPTS_MAGIC))
    await this.#writeInt32(NBD_OPT_EXPORT_NAME)
    await this.#writeInt32(this.#exportname.length)
    await this.#write(Buffer.from(this.#exportname))

    // 8 (export size ) + 2 (flags) + 124 zero = 134
    // must read all to ensure nothing stays in the  buffer
    const answer = await this.#read(134)
    this.#exportSize = answer.readBigUInt64BE(0)
    const transmissionFlags = answer.readInt16BE(8)
    assert(transmissionFlags & NBD_FLAG_HAS_FLAGS, 'NBD_FLAG_HAS_FLAGS') // must always be 1 by the norm

    // note : xapi server always send NBD_FLAG_READ_ONLY (3) as a flag
  }

  #takeFromBuffer(length) {
    const res = Buffer.from(this.#receptionBuffer.slice(0, length))
    this.#receptionBuffer = this.#receptionBuffer.slice(length)
    return res
  }

  #read(length) {
    // if we got enough data in local cache : return them immediatly
    if (this.#receptionBuffer.length >= length) {
      return this.#takeFromBuffer(length)
    }
    // if not, wait for the data, add the read to the fifo
    return new Promise(resolve => {
      this.#rawReadBacklog.push({
        resolve,
        length,
      })
    })
  }

  #write(buffer) {
    return new Promise(resolve => {
      this.#serverSocket.write(buffer, resolve)
    })
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

  async #handleBlockReadResponse() {
    const magic = await this.#readInt32()

    if (magic !== NBD_REPLY_MAGIC) {
      throw new Error(`magic number for block answer is wrong : ${magic}`)
    }

    const error = await this.#readInt32()
    if (error !== 0) {
      // @todo use error code from constants.mjs
      throw new Error(`GOT ERROR CODE  : ${error}`)
    }

    const blockQueryId = await this.#readInt64()
    const query = this.#commandQueryBacklog[blockQueryId]
    if (!query) {
      throw new Error(` no query associated with id ${blockQueryId} ${Object.keys(this.#commandQueryBacklog)}`)
    }
    delete this.#commandQueryBacklog[blockQueryId]
    const data = await this.#read(query.size)
    query.resolve(data)
  }

  async readBlock(index, size = NBD_DEFAULT_BLOCK_SIZE) {
    const queryId = this.#nextCommandQueryId
    this.#nextCommandQueryId++

    // create and send  command at once to ensure there is no concurrency issue
    const buffer = Buffer.alloc(28)
    buffer.writeInt32BE(NBD_REQUEST_MAGIC, 0)
    buffer.writeInt16BE(0, 4) // no command flags for a simple block read
    buffer.writeInt16BE(NBD_CMD_READ, 6)
    buffer.writeBigUInt64BE(queryId, 8)
    // byte offset in the raw disk
    const offset = BigInt(index) * BigInt(size)
    buffer.writeBigUInt64BE(offset, 16)

    // ensure we do not read after the end of the export (which would immediatly disconnect us)
    // truncate size if needed
    // it will fail when trying to read more than 2**32 bytes at once ( lol )
    const maxSize = Math.min(Number(this.#exportSize - offset), size)
    buffer.writeInt32BE(maxSize, 24)

    return new Promise(resolve => {
      this.#commandQueryBacklog[queryId] = {
        size: maxSize,
        resolve,
      }
      // really send the command to the server
      this.#write(buffer)
    })
  }
}
