import _computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import { createFooter, createHeader } from 'vhd-lib/_createFooterHeader.js'
import { DISK_TYPES, FOOTER_SIZE } from 'vhd-lib/_constants.js'
import { readChunk } from '@vates/read-chunk'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { VhdAbstract } from 'vhd-lib'
import assert from 'node:assert'

const VHD_BLOCK_LENGTH = 2 * 1024 * 1024
export default class VhdEsxiRaw extends VhdAbstract {
  #esxi
  #datastore
  #path

  #bat
  #header
  #footer

  #stream
  #bytesRead = 0

  static async open(esxi, datastore, path) {
    const vhd = new VhdEsxiRaw(esxi, datastore, path)
    await vhd.readHeaderAndFooter()
    return vhd
  }

  get header() {
    return this.#header
  }

  get footer() {
    return this.#footer
  }

  constructor(esxi, datastore, path) {
    super()
    this.#esxi = esxi
    this.#path = path
    this.#datastore = datastore
  }

  async readHeaderAndFooter(checkSecondFooter = true) {
    const res = await this.#esxi.download(this.#datastore, this.#path)
    const length = res.headers.get('content-length')

    this.#header = unpackHeader(createHeader(length / VHD_BLOCK_LENGTH))
    const geometry = _computeGeometryForSize(length)
    const actualSize = geometry.actualSize

    this.#footer = unpackFooter(
      createFooter(actualSize, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DYNAMIC)
    )
  }

  containsBlock(blockId) {
    assert.notEqual(this.#bat, undefined, "bat is not loaded")
    return this.#bat.has(blockId)
  }

  async readBlock(blockId) {
    const start = blockId * VHD_BLOCK_LENGTH
    if (!this.#stream) {
      this.#stream = (await this.#esxi.download(this.#datastore, this.#path)).body
      this.#bytesRead = 0
    }
    if (this.#bytesRead > start) {
      this.#stream.destroy()
      this.#stream = (
        await this.#esxi.download(this.#datastore, this.#path, `${start}-${this.footer.currentSize}`)
      ).body
      this.#bytesRead = start
    }

    if (start - this.#bytesRead > 0) {
      this.#stream.destroy()
      this.#stream = (
        await this.#esxi.download(this.#datastore, this.#path, `${start}-${this.footer.currentSize}`)
      ).body
      this.#bytesRead = start
    }

    const data = await readChunk(this.#stream, VHD_BLOCK_LENGTH)
    this.#bytesRead += data.length
    const bitmap = Buffer.alloc(512, 255)
    return {
      id: blockId,
      bitmap,
      data,
      buffer: Buffer.concat([bitmap, data]),
    }
  }

  async readBlockAllocationTable() {
    const res = await this.#esxi.download(this.#datastore, this.#path)
    const length = res.headers.get('content-length')
    const stream = res.body
    const empty = Buffer.alloc(VHD_BLOCK_LENGTH, 0)
    let pos = 0
    this.#bat = new Set()
    let nextChunkLength = Math.min(VHD_BLOCK_LENGTH, length)

    const progress = setInterval(() => {
      console.log("reading blocks", pos / VHD_BLOCK_LENGTH, "/", length/ VHD_BLOCK_LENGTH)
    }, 30 * 1000)

    while (nextChunkLength > 0) {
      try{
        const chunk = await readChunk(stream, nextChunkLength)
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
        nextChunkLength = Math.min(VHD_BLOCK_LENGTH, length - pos)
      }catch(error){
        clearInterval(progress)
        throw error
      }
    }
    console.log("BAT reading done, remaining  ", this.#bat.size, "/", Math.ceil(length / VHD_BLOCK_LENGTH))
    clearInterval(progress)

  }
}
