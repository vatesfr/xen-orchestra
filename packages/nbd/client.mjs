import assert from 'node:assert'
import { Socket } from 'node:net'

const BLOCK_SIZE = 64 * 1024
export default class NbdClient {
  #address
  #blockSize
  #cert
  #exportname
  #port
  #client
  #buffer = Buffer.alloc(0)
  #readPromiseResolve
  #waitingForLength = 0
  #nbDiskBlocks = 0
  #handle = 0

  #queries = {}
  constructor({ address, port = 10809, exportname, cert }) {
    this.#address = address
    this.#port = port
    this.#exportname = exportname
    this.#cert = cert
    this.#client = new Socket()
  }

  get nbBlocks() {
    return this.#nbDiskBlocks
  }
  async connect() {
    const client = this.#client
    return new Promise(resolve => {
      client.connect(this.#port, this.#address, async () => {
        await this.#handshake()
        resolve()
      })

      client.on('data', data => {
        this.#buffer = Buffer.concat([this.#buffer, Buffer.from(data)])

        if (this.#readPromiseResolve && this.#buffer.length >= this.#waitingForLength) {
          this.#readPromiseResolve(this.#takeFromBuffer(this.#waitingForLength))
          this.#readPromiseResolve = null
          this.#waitingForLength = 0
        } else {
          if (!this.#readPromiseResolve && this.#buffer.length > 4) {
            if (this.#buffer.readInt32BE(0) === 0x67446698) {
              this.#readResponse()
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
    })
  }

  async #handshake() {
    assert(await this.#readFromSocket(8), 'NBDMAGIC')
    assert(await this.#readFromSocket(8), 'IHAVEOPT')
    const flagsBuffer = await this.#readFromSocket(2)
    const flags = flagsBuffer.readInt16BE(0)
    assert(flags === 1) // only FIXED_NEWSTYLE one is supported
    await this.#writeToSocketInt32(1) //client also support  NBD_FLAG_C_FIXED_NEWSTYLE

    // send export name it's also implictly closing the negociation phase
    await this.#writeToSocket(Buffer.from('IHAVEOPT'))
    await this.#writeToSocketInt32(1) //command NBD_OPT_EXPORT_NAME
    await this.#writeToSocketInt32(this.#exportname.length)
    await this.#writeToSocket(Buffer.from(this.#exportname))
    // 8 + 2 + 124
    const answer = await this.#readFromSocket(134)
    const exportSize = answer.readBigUInt64BE(0)
    const transmissionFlags = answer.readInt16BE(8) // 3 is readonly
    this.#nbDiskBlocks = Number(exportSize / BigInt(64 * 1024))
    console.log(`disk is ${exportSize} bytes ${this.#nbDiskBlocks} 64KB blocks`)
  }

  #takeFromBuffer(length) {
    const res = Buffer.from(this.#buffer.slice(0, length))
    this.#buffer = this.#buffer.slice(length)
    return res
  }

  #readFromSocket(length) {
    if (this.#buffer.length >= length) {
      return this.#takeFromBuffer(length)
    }
    return new Promise(resolve => {
      this.#readPromiseResolve = resolve
      this.#waitingForLength = length
    })
  }

  #writeToSocket(buffer) {
    return new Promise(resolve => {
      this.#client.write(buffer, resolve)
    })
  }

  async #readFromSocketInt32() {
    const buffer = await this.#readFromSocket(4)

    return buffer.readInt32BE(0)
  }

  async #readFromSocketInt64() {
    const buffer = await this.#readFromSocket(8)
    return buffer.readBigUInt64BE(0)
  }

  #writeToSocketInt32(int) {
    const buffer = Buffer.alloc(4)
    buffer.writeInt32BE(int)
    return this.#writeToSocket(buffer)
  }
  #writeToSocketUInt32(int) {
    const buffer = Buffer.alloc(4)
    buffer.writeUInt32BE(int)
    return this.#writeToSocket(buffer)
  }

  #writeToSocketInt16(int) {
    const buffer = Buffer.alloc(2)
    buffer.writeInt16BE(int)
    return this.#writeToSocket(buffer)
  }
  #writeToSocketInt64(int) {
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64BE(BigInt(int))
    return this.#writeToSocket(buffer)
  }

  async #readResponse() {
    //NBD_SIMPLE_REPLY_MAGIC
    const magic = await this.#readFromSocketInt32()

    if (magic !== 0x67446698) {
      console.error('magic number for block answer is wrong : ', magic)
      return
    }
    // error
    const error = await this.#readFromSocketInt32()
    if (error !== 0) {
      console.error('GOT ERROR CODE ', error)
      return
    }
    // handle
    const handle = await this.#readFromSocketInt64()
    const query = this.#queries[handle]
    if (!query) {
      console.log('no query associated with handle ', response.handle, Object.keys(this.#queries))
      return
    }
    delete this.#queries[handle]
    query.resolve(await this.#readFromSocket(query.size))
  }

  async readBlock(index, size = BLOCK_SIZE) {
    if (index > this.#nbDiskBlocks) {
      return null
    }
    const handle = this.#handle
    this.#handle++
    this.#writeToSocketInt32(0x25609513) //NBD_REQUEST MAGIC
    this.#writeToSocketInt16(0) //command flags
    this.#writeToSocketInt16(0) //READ
    this.#writeToSocketInt64(handle)
    this.#writeToSocketInt64(BigInt(index) * BigInt(size))
    this.#writeToSocketUInt32(size)

    return new Promise(resolve => {
      this.#queries[handle] = {
        size,
        resolve,
      }
    })
  }
}
