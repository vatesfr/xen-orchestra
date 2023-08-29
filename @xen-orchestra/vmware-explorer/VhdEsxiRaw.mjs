import _computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import { createFooter, createHeader } from 'vhd-lib/_createFooterHeader.js'
import { DISK_TYPES, FOOTER_SIZE } from 'vhd-lib/_constants.js'
import { readChunkStrict, skipStrict } from '@vates/read-chunk'
import { Task } from '@vates/task'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { VhdAbstract } from 'vhd-lib'
import assert from 'node:assert'

/* eslint-disable no-console */

// create a thin VHD from a raw disk
const VHD_BLOCK_LENGTH = 2 * 1024 * 1024
export default class VhdEsxiRaw extends VhdAbstract {
  #datastore
  #esxi
  #path
  #thin

  #bat
  #header
  #footer

  #streamOffset = 0
  #stream
  #reading = false

  static async open(esxi, datastore, path, opts) {
    const vhd = new VhdEsxiRaw(esxi, datastore, path, opts)
    await vhd.readHeaderAndFooter()
    return vhd
  }

  get header() {
    return this.#header
  }

  get footer() {
    return this.#footer
  }

  constructor(esxi, datastore, path, { thin = true } = {}) {
    super()
    this.#esxi = esxi
    this.#path = path
    this.#datastore = datastore
    this.#thin = thin
  }

  async readHeaderAndFooter() {
    const res = await this.#esxi.download(this.#datastore, this.#path)
    const length = res.headers.get('content-length')

    this.#header = unpackHeader(createHeader(length / VHD_BLOCK_LENGTH))
    const geometry = _computeGeometryForSize(length)

    this.#footer = unpackFooter(
      // length can be smaller than disk capacity due to alignment to head/cylinder/sector
      createFooter(length, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DYNAMIC)
    )
  }

  containsBlock(blockId) {
    if (!this.#thin) {
      return true
    }
    assert.notEqual(this.#bat, undefined, 'bat is not loaded')
    return this.#bat.has(blockId)
  }

  async #readChunk(start, length) {
    if (this.#reading) {
      throw new Error('reading must be done sequentially')
    }
    try {
      this.#reading = true
      if (this.#stream !== undefined) {
        // stream is too far ahead or to far behind
        if (this.#streamOffset > start || this.#streamOffset + VHD_BLOCK_LENGTH < start) {
          this.#stream.destroy()
          this.#stream = undefined
          this.#streamOffset = 0
        }
      }
      // no stream
      if (this.#stream === undefined) {
        const end = this.footer.currentSize - 1
        const res = await this.#esxi.download(this.#datastore, this.#path, `${start}-${end}`)
        this.#stream = res.body
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
      error.streamLength = this.footer.currentSize
      this.#stream?.destroy()
      this.#stream = undefined
      this.#streamOffset = 0
      throw error
    } finally {
      this.#reading = false
    }
  }

  async #readBlock(blockId) {
    const start = blockId * VHD_BLOCK_LENGTH
    let length = VHD_BLOCK_LENGTH
    let partial = false
    if (start + length > this.footer.currentSize) {
      length = this.footer.currentSize - start
      partial = true
    }

    let data = await this.#readChunk(start, length)

    if (partial) {
      data = Buffer.concat([data, Buffer.alloc(VHD_BLOCK_LENGTH - data.length)])
    }
    const bitmap = Buffer.alloc(512, 255)
    return {
      id: blockId,
      bitmap,
      data,
      buffer: Buffer.concat([bitmap, data]),
    }
  }

  async readBlock(blockId) {
    let tries = 5
    let lastError
    while (tries > 0) {
      try {
        const res = await this.#readBlock(blockId)
        return res
      } catch (error) {
        lastError = error
        lastError.blockId = blockId
        console.warn('got error , will retry in 2seconds', lastError)
      }
      await new Promise(resolve => setTimeout(() => resolve(), 2000))
      tries--
    }

    throw lastError
  }

  // this will read all the disk once to check which block contains data, it can take a long time to execute depending on the network speed
  async readBlockAllocationTable() {
    if (!this.#thin) {
      // fast path : is we do not use thin mode, the BAT is full
      return
    }
    const empty = Buffer.alloc(VHD_BLOCK_LENGTH, 0)
    let pos = 0
    this.#bat = new Set()
    let nextChunkLength = Math.min(VHD_BLOCK_LENGTH, this.footer.currentSize)
    Task.set('total', this.footer.currentSize / VHD_BLOCK_LENGTH)
    const progress = setInterval(() => {
      Task.set('progress', Math.round((pos * 100) / this.footer.currentSize))
      console.log('reading blocks', pos / VHD_BLOCK_LENGTH, '/', this.footer.currentSize / VHD_BLOCK_LENGTH)
    }, 30 * 1000)

    while (nextChunkLength > 0) {
      try {
        const chunk = await this.#readChunk(pos, nextChunkLength)
        let isEmpty
        if (nextChunkLength === VHD_BLOCK_LENGTH) {
          isEmpty = empty.equals(chunk)
        } else {
          // last block can be smaller
          isEmpty = Buffer.alloc(nextChunkLength, 0).equals(chunk)
        }
        if (!isEmpty) {
          this.#bat.add(pos / VHD_BLOCK_LENGTH)
        }
        pos += VHD_BLOCK_LENGTH
        nextChunkLength = Math.min(VHD_BLOCK_LENGTH, this.footer.currentSize - pos)
      } catch (error) {
        clearInterval(progress)
        throw error
      }
    }
    console.log(
      'BAT reading done, remaining  ',
      this.#bat.size,
      '/',
      Math.ceil(this.footer.currentSize / VHD_BLOCK_LENGTH)
    )
    clearInterval(progress)
  }

  rawContent() {
    return this.#esxi.download(this.#datastore, this.#path).then(res => {
      const stream = res.body
      stream.length = this.footer.currentSize
      return stream
    })
  }
}

/* eslint-enable no-console */
