import assert from 'assert'
import { AbstractVhd } from './abstractVhd'
import { sectorsRoundUpNoZero, sectorsToBytes, buildHeader, buildFooter } from './_utils'
import { fuFooter, fuHeader, checksumStruct } from '../_structs'
import { test } from '../_bitmap'
import { FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE } from '../_constants'
import { createLogger } from '@xen-orchestra/log'

const { debug } = createLogger('vhd-lib:ChunkedVhd')
// File structure on remotes:
//
// <remote>
// └─ xo-vm-backups
//   ├─ index.json // TODO
//   └─ <VM UUID>
//      ├─ index.json // TODO
//      ├─ vdis
//      │  └─ <job UUID>
//      │     └─ <VDI UUID>
//      │        ├─ index.json // TODO
//      │        ├─ <YYYYMMDD>T<HHmmss>.vhd // a text file containing the path of the folder storing the chuncked vhd
//      |        └─ <uid>
//      |           ├─ footer
//      |           ├─ header
//      |           ├─ bat // a bits array where a 1 at index i indicate that the block i is present
//      |           └─ <index> // block with id 'index'
//      ├─ <YYYYMMDD>T<HHmmss>.json // backup metadata
//      ├─ <YYYYMMDD>T<HHmmss>.xva
//      └─ <YYYYMMDD>T<HHmmss>.xva.checksum

export class ChunkedVhd extends AbstractVhd {
  static async open(handler, path) {
    let resolved = null
    if (typeof handler.resolveAlias === 'function') {
      resolved = handler.resolveAlias(path)
    }
    const vhd = new ChunkedVhd(handler, resolved || path)
    return {
      dispose: () => {},
      value: vhd,
    }
  }

  constructor(handler, path) {
    super()
    this._handler = handler
    this._path = path
  }

  async readBlockAllocationTable() {
    assert(this.header, 'Header must not be empty to access bat')

    const { buffer } = await this._readChunk('bat', this.header.maxTableEntries)
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

  getChunkPath(partName) {
    return this._path + '/' + partName
  }

  async _readChunk(partName, maxLength) {
    // here we can implement compression and / or crypto
    return this._handler.read(this.getChunkPath(partName), Buffer.alloc(maxLength))
  }

  async _writeChunk(partName, buffer) {
    assert(Buffer.isBuffer(buffer))
    // here we can implement compression and / or crypto
    return this._handler.write(this.getChunkPath(partName), buffer, 0)
  }

  async readHeaderAndFooter() {
    const { bufHeader } = await this._readChunk('header', HEADER_SIZE)
    const { bufFooter } = await this._readChunk('footer', FOOTER_SIZE)

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

    const { buffer } = this._readChunk(blockId, this.fullBlockSize)
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
    this._handler.copy(child.getChunkPath(blockId), this.getChunkPath(blockId))
  }
}
