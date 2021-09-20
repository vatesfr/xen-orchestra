import assert from 'assert'
import { AbstractVhd } from './abstractVhd'
import { sectorsRoundUpNoZero, sectorsToBytes, buildHeader, buildFooter } from './_utils'
import { fuFooter, fuHeader, checksumStruct } from '../_structs'
import { test } from '../_bitmap'
import { SECTOR_SIZE } from '../_constants'
import { createLogger } from '@xen-orchestra/log'

const { debug } = createLogger('vhd-lib:ChunkedVhd')

export class ChunkedVhd extends AbstractVhd {
  static open(handler, path) {
    const vhd = new ChunkedVhd(handler, path)
    return {
      dispose: () => {},
      value: vhd,
    }
  }

  async readBlockAllocationTable() {
    const { buffer } = await this._readChunk('bat')
    /**
     * In chunked mode, the bat is a sequence of bits
     * A zero bit indicates that the block is not present
     */
    this.blockTable = buffer
  }

  containsBlock(blockId) {
    assert(this.blockTable, 'Block table must not be empty to access a block address')
    return test(this.blockTable, blockId)
  }

  async _readChunk(partName) {
    // here we can implement compression and / or crypto
    return this._handler.read(this._path + '/' + partName)
  }

  async _writeChunk(partName, buffer) {
    assert(Buffer.isBuffer(buffer))
    // here we can implement compression and / or crypto
    return this._handler.write(this._path + '/' + partName, buffer, 0)
  }

  async readHeaderAndFooter() {
    const { bufHeader } = await this._readChunk('header')
    const { bufFooter } = await this._readChunk('footer')

    const footer = buildFooter(bufFooter)
    const header = buildHeader(bufHeader, footer)

    this.footer = footer
    this.header = header

    // Compute the number of sectors in one block.
    // Default: One block contains 4096 sectors of 512 bytes.
    const sectorsPerBlock = (this.sectorsPerBlock = header.blockSize / SECTOR_SIZE)

    // Compute bitmap size in sectors.
    // Default: 1.
    const sectorsOfBitmap = (this.sectorsOfBitmap = sectorsRoundUpNoZero(sectorsPerBlock >> 3))

    // Full block size => data block size + bitmap size.
    this.fullBlockSize = sectorsToBytes(sectorsPerBlock + sectorsOfBitmap)

    // In bytes.
    // Default: 512.
    this.bitmapSize = sectorsToBytes(sectorsOfBitmap)
  }

  _readBlock(blockId, onlyBitmap = false) {
    if (onlyBitmap) {
      throw new Error(`reading 'bitmap of block' ${blockId} in a ChunkedVhd is not implemented`)
    }

    const { buffer } = this._readChunk(blockId)
    return {
      id: blockId,
      bitmap: buffer.slice(0, this.bitmapSize),
      data: buffer.slice(this.bitmapSize),
      buffer,
    }
  }
  ensureBatSize() {
    // nothing to do in chunked mode
  }

  async writeFooter() {
    const { footer } = this

    const rawFooter = fuFooter.pack(footer)

    footer.checksum = checksumStruct(rawFooter, fuFooter)
    debug(`Write footer  (checksum=${footer.checksum}). (data=${rawFooter.toString('hex')})`)

    await this._writeChunk('footer', rawFooter)
  }

  writeHeader() {
    const { header } = this
    const rawHeader = fuHeader.pack(header)
    header.checksum = checksumStruct(rawHeader, fuHeader)
    debug(`Write header  (checksum=${header.checksum}). (data=${rawHeader.toString('hex')})`)
    return this._writeChunk('header', rawHeader)
  }

  setUniqueParentLocator(fileNameString) {
    const encodedFilename = Buffer.from(fileNameString, 'utf16le')
    return this._write('parentLocator0', encodedFilename)
  }

  // only works if data are in the same bucket
  // and if the full block is modified in child ( which is the case whit xcp)

  coalesceBlock(child, blockId) {
    // should implement a copy operator on handler to preserve the child
    this._handler.rename(child._path + '/' + blockId, this._path + '/' + blockId)
  }
}
