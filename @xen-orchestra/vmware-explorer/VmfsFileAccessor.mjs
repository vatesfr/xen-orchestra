// @ts-nocheck

import { readChunkStrict, skipStrict } from '@vates/read-chunk'
import assert from 'node:assert'

class VmfsFileDescriptor {
  #datastore
  #path
  #streamOffset = 0
  #stream
  #reading = false

  #esxi
  #datastoreName

  #size
  constructor(path, esxi, datastoreName) {
    this.#path = path
    this.#datastoreName = datastoreName
    this.#esxi = esxi
  }

  async open() {
    const res = await this.#esxi.download(this.datastoreName, this.#path)
    // @todo close the connection
    this.#size = Number(res.headers.get('content-length'))
  }

  async #readChunk(start, length) {
    if (this.#reading) {
      throw new Error('reading must be done sequentially')
    }
    try {
      this.#reading = true
      if (this.#stream !== undefined) {
        // stream is too far ahead or to far behind
        if (this.#streamOffset > start || this.#streamOffset + 1024 * 1024 < start) {
          this.#stream.destroy()
          this.#stream = undefined
          this.#streamOffset = 0
        }
      }
      // no stream
      if (this.#stream === undefined) {
        const end = this.#size - 1
        this.#stream = await this.#datastore.getStream(this.#path, start, end)
        this.#streamOffset = start
      }

      // stream a little behind
      if (this.#streamOffset < start) {
        await skipStrict(this.#stream, start - this.#streamOffset)
        this.#streamOffset = start
      }

      // really read data
      this.#streamOffset += length
      const data = await readChunkStrict(this.#stream, length)
      return data
    } catch (error) {
      error.start = start
      error.length = length
      error.streamLength = this.#size
      this.#stream?.destroy()
      this.#stream = undefined
      this.#streamOffset = 0
      throw error
    } finally {
      this.#reading = false
    }
  }

  async read(buffer, position) {
    const chunk = await this.#readChunk(position, buffer.length)
    chunk.copy(buffer)
    return { buffer, bytesRead: buffer.length }
  }

  close() {
    return this.#stream.destroy()
  }
}

export class VmfsFileAccessor /* implements file accessor */ {
  #descriptors = new Map()
  #esxi
  #datastoreName

  #nextDescriptorIndex = 0

  get datastoreName() {
    return this.#datastoreName
  }

  constructor({ datastoreName, esxi, ...otherOptions } = {}) {
    this.#datastoreName = datastoreName
    this.#esxi = esxi
  }
  async open(path) {
    const descriptor = new VmfsFileDescriptor(this.#esxi, this.#datastoreName, path)
    this.#descriptors.set(this.#nextDescriptorIndex, descriptor)
    this.#nextDescriptorIndex++
  }

  async close(filedecriptor) {
    assert.strictEqual(typeof file, 'Number')
    const descriptor = this.#descriptors.get(filedecriptor)
    return descriptor.close()
  }

  async read(file, buffer, position) {
    assert.strictEqual(typeof file, 'Number')
    const descriptor = this.#descriptors.get(file)
    return descriptor.read(buffer, position)
  }
  async getSize(path) {
    const res = await this.#esxi.download(this.datastoreName, path)
    // @todo close the connection
    return Number(res.headers.get('content-length'))
  }

  // write function are not implemented on this backend
}
