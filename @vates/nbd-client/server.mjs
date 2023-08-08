import assert, { deepEqual, strictEqual, notStrictEqual } from 'node:assert'
import { createServer } from 'node:net'
import { fromCallback } from 'promise-toolbox'
import { readChunkStrict } from '@vates/read-chunk'
import {
  INIT_PASSWD,
  NBD_CMD_READ,
  NBD_DEFAULT_PORT,
  NBD_FLAG_FIXED_NEWSTYLE,
  NBD_FLAG_HAS_FLAGS,
  NBD_OPT_EXPORT_NAME,
  NBD_OPT_REPLY_MAGIC,
  NBD_REPLY_ACK,
  NBD_REQUEST_MAGIC,
  OPTS_MAGIC,
  NBD_CMD_DISC,
  NBD_REP_ERR_UNSUP,
  NBD_CMD_WRITE,
  NBD_OPT_GO,
  NBD_OPT_INFO,
  NBD_INFO_EXPORT,
  NBD_REP_INFO,
  NBD_SIMPLE_REPLY_MAGIC,
  NBD_REP_ERR_UNKNOWN,
} from './constants.mjs'
import { PassThrough } from 'node:stream'

export default class NbdServer {
  #server
  #clients = new Map()
  constructor(port = NBD_DEFAULT_PORT) {
    this.#server = createServer()
    this.#server.listen(port)
    this.#server.on('connection', client => this.#handleNewConnection(client))
  }

  // will wait for a client to connect and upload the file to this server
  downloadStream(key) {
    strictEqual(this.#clients.has(key), false)
    const stream = new PassThrough()
    const offset = BigInt(0)
    this.#clients.set(key, { length: BigInt(2 * 1024 * 1024 * 1024 * 1024), stream, offset, key })
    return stream
  }

  // will wait for a client to connect and downlaod this stream
  uploadStream(key, source, length) {
    strictEqual(this.#clients.has(key), false)
    notStrictEqual(length, undefined)
    const offset = BigInt(0)
    this.#clients.set(key, { length: BigInt(length), stream: source, offset, key })
  }

  #read(socket, length) {
    return readChunkStrict(socket, length)
  }
  async #readInt32(socket) {
    const buffer = await this.#read(socket, 4)
    return buffer.readUInt32BE()
  }

  #write(socket, buffer) {
    return fromCallback.call(socket, 'write', buffer)
  }
  async #writeInt16(socket, int16) {
    const buffer = Buffer.alloc(2)
    buffer.writeUInt16BE(int16)
    return this.#write(socket, buffer)
  }
  async #writeInt32(socket, int32) {
    const buffer = Buffer.alloc(4)
    buffer.writeUInt32BE(int32)
    return this.#write(socket, buffer)
  }
  async #writeInt64(socket, int64) {
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64BE(int64)
    return this.#write(socket, buffer)
  }

  async #openExport(key) {
    if (!this.#clients.has(key)) {
      // export does not exists
      const err = new Error('Export not found ')
      err.code = 'ENOTFOUND'
      throw err
    }
    const { length } = this.#clients.get(key)
    return length
  }

  async #sendOptionResponse(socket, option, response, data = Buffer.alloc(0)) {
    await this.#writeInt64(socket, NBD_OPT_REPLY_MAGIC)
    await this.#writeInt32(socket, option)
    await this.#writeInt32(socket, response)
    await this.#writeInt32(socket, data.length)
    await this.#write(socket, data)
  }

  /**
   *
   * @param {Socket} socket
   * @returns true if server is waiting for more options
   */
  async #readOption(socket) {
    console.log('wait for option')
    const magic = await this.#read(socket, 8)
    console.log(magic.toString('ascii'), magic.length, OPTS_MAGIC.toString('ascii'))
    deepEqual(magic, OPTS_MAGIC)
    const option = await this.#readInt32(socket)
    const length = await this.#readInt32(socket)
    console.log({ option, length })
    const data = length > 0 ? await this.#read(socket, length) : undefined
    switch (option) {
      case NBD_OPT_EXPORT_NAME: {
        const exportNameLength = data.readInt32BE()
        const key = data.slice(4, exportNameLength + 4).toString()
        let exportSize
        try {
          exportSize = await this.#openExport(key)
        } catch (err) {
          if (err.code === 'ENOTFOUND') {
            this.#sendOptionResponse(socket, option, NBD_REP_ERR_UNKNOWN)
            return false
          }
          throw err
        }
        socket.key = key
        await this.#writeInt64(socket, exportSize)
        await this.#writeInt16(socket, NBD_FLAG_HAS_FLAGS /* transmission flag */)
        await this.#write(socket, Buffer.alloc(124) /* padding */)

        return false
      }
      /*
            case NBD_OPT_STARTTLS:
                console.log('starttls')
                // @todo not working
                return true 
            */

      case NBD_OPT_GO:
      case NBD_OPT_INFO: {
        const exportNameLength = data.readInt32BE()
        const key = data.slice(4, exportNameLength + 4).toString()
        let exportSize
        try {
          exportSize = await this.#openExport(key)
        } catch (err) {
          if (err.code === 'ENOTFOUND') {
            this.#sendOptionResponse(socket, option, NBD_REP_ERR_UNKNOWN)
            // @todo should disconnect
            return false
          }
          throw err
        }
        socket.key = key
        await this.#writeInt64(socket, NBD_OPT_REPLY_MAGIC)
        await this.#writeInt32(socket, option)
        await this.#writeInt32(socket, NBD_REP_INFO)
        await this.#writeInt32(socket, 12)
        // the export info
        await this.#writeInt16(socket, NBD_INFO_EXPORT)
        await this.#writeInt64(socket, exportSize)
        await this.#writeInt16(socket, NBD_FLAG_HAS_FLAGS /* transmission flag */)

        // an ACK at the end of the infos
        await this.#sendOptionResponse(socket, option, NBD_REPLY_ACK) // no additionnal data
        return option === NBD_OPT_INFO // we stays in option phase is option is INFO
      }
      default:
        // not supported
        console.log('not supported', option, length, data?.toString())
        await this.#sendOptionResponse(socket, option, NBD_REP_ERR_UNSUP) // no additionnal data
        // wait for next option
        return true
    }
  }

  async #readCommand(socket) {
    const key = socket.key
    // this socket has an export key
    notStrictEqual(key, undefined)
    // this export key is still valid
    strictEqual(this.#clients.has(key), true)
    const client = this.#clients.get(key)

    const buffer = await this.#read(socket, 28)
    const magic = buffer.readInt32BE(0)
    strictEqual(magic, NBD_REQUEST_MAGIC)
    /* const commandFlags = */ buffer.readInt16BE(4)
    const command = buffer.readInt16BE(6)
    const cookie = buffer.readBigUInt64BE(8)
    const offset = buffer.readBigUInt64BE(16)
    const length = buffer.readInt32BE(24)
    switch (command) {
      case NBD_CMD_DISC:
        console.log('gotdisconnect', client.offset)
        await client.stream?.destroy()
        // @todo : disconnect
        return false
      case NBD_CMD_READ: {
        /** simple replies  */

        // read length byte from offset in export

        // the client is writing in contiguous mode
        assert.strictEqual(offset, client.offset)
        client.offset += BigInt(length)
        const data = await readChunkStrict(client.stream, length)
        const reply = Buffer.alloc(16)
        reply.writeInt32BE(NBD_SIMPLE_REPLY_MAGIC)
        reply.writeInt32BE(0, 4) // no error
        reply.writeBigInt64BE(cookie, 8)
        await this.#write(socket, reply)
        await this.#write(socket, data)
        /*  if we implement non stream read, we can handle read in parallel
                const reply = Buffer.alloc(16+length)
                reply.writeInt32BE(NBD_SIMPLE_REPLY_MAGIC)
                reply.writeInt32BE(0,4)// no error
                reply.writeBigInt64BE(cookie,8)

                // read length byte from offset in export directly in the given buffer
                // may do multiple read in parallel on the same export
                size += length
                socket.fd.read(reply, 16, length, Number(offset))
                    .then(()=>{
                        return this.#write(socket, reply)
                    })
                    .catch(err => console.error('NBD_CMD_READ',err)) */
        return true
      }
      case NBD_CMD_WRITE: {
        // the client is writing in contiguous mode
        assert.strictEqual(offset, client.offset)

        const data = await this.#read(socket, length)
        client.offset += BigInt(length)
        await new Promise((resolve, reject) => {
          if (!client.stream.write(data, 0, length, Number(offset))) {
            client.stream.once('drain', err => (err ? reject(err) : resolve()))
          } else {
            process.nextTick(resolve)
          }
        })
        const reply = Buffer.alloc(16)
        reply.writeInt32BE(NBD_SIMPLE_REPLY_MAGIC)
        reply.writeInt32BE(0, 4) // no error
        reply.writeBigInt64BE(cookie, 8)
        await this.#write(socket, reply)
        return true
      }
      default:
        console.log('GOT unsupported command ', command)
        // fail to handle
        return true
    }
  }

  async #handleNewConnection(socket) {
    const remoteAddress = socket.remoteAddress + ':' + socket.remotePort
    console.log('new client connection from %s', remoteAddress)

    socket.on('close', () => {
      console.log('client ', remoteAddress, 'is done')
    })
    socket.on('error', error => {
      throw error
    })
    // handshake
    await this.#write(socket, INIT_PASSWD)
    await this.#write(socket, OPTS_MAGIC)

    // send flags , the bare minimum
    await this.#writeInt16(socket, NBD_FLAG_FIXED_NEWSTYLE)
    const clientFlag = await this.#readInt32(socket)
    assert.strictEqual(clientFlag & NBD_FLAG_FIXED_NEWSTYLE, NBD_FLAG_FIXED_NEWSTYLE) // only FIXED_NEWSTYLE one is supported from the server options

    // read client response flags
    let waitingForOptions = true
    while (waitingForOptions) {
      waitingForOptions = await this.#readOption(socket)
    }

    let waitingForCommand = true
    while (waitingForCommand) {
      waitingForCommand = await this.#readCommand(socket)
    }
  }

  #handleClientData(client, data) {}
}
