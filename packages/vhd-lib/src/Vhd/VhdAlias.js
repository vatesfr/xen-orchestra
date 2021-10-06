import { VhdFile } from './VhdFile'
import { VhdDirectory } from './VhdDirectory'
import { VhdAbstract } from './VhdAbstract'
import { openVhd } from '../openVhd'
import assert from 'assert'

export class VhdAlias extends VhdAbstract {
  #aliasFileExists = false
  #vhd

  get bitmapSize() {
    return this.#vhd.bitmapSize
  }
  set bitmapSize(bitmapSize) {
    this.#vhd.bitmapSize = bitmapSize
  }

  get footer() {
    return this.#vhd.footer
  }
  set footer(footer) {
    this.#vhd.footer = footer
  }

  get fullBlockSize() {
    return this.#vhd.fullBlockSize
  }
  set fullBlockSize(fullBlockSize) {
    this.#vhd.fullBlockSize = fullBlockSize
  }

  get header() {
    return this.#vhd.header
  }
  set header(header) {
    this.#vhd.header = header
  }

  get sectorsOfBitmap() {
    return this.#vhd.sectorsOfBitmap
  }
  set sectorsOfBitmap(sectorsOfBitmap) {
    this.#vhd.sectorsOfBitmap = sectorsOfBitmap
  }

  get sectorsPerBlock() {
    return this.#vhd.sectorsPerBlock
  }
  set sectorsPerBlock(sectorsPerBlock) {
    this.#vhd.header = sectorsPerBlock
  }

  static async open(handler, path) {
    const buf = Buffer.from(await handler.readFile(path), 'utf-8')
    const aliasContent = buf.toString().trim()
    const targetVhd = await openVhd(handler, aliasContent)
    const vhd = new VhdAlias(handler, path, targetVhd)
    return {
      dispose: () => {},
      value: vhd
    }
  }

  static async create(handler, path, { target }) {
    const { path: targetPath, format } = target
    let targetVhd
    if (format === 'file') {
      targetVhd = await VhdFile.create(handler, targetPath)
    } else if (format === ' directory') {
      targetVhd = await VhdDirectory.create(handler, targetPath)
    }
    const vhd = new VhdAlias(handler, path, targetVhd)
    return {
      dispose: () => {},
      value: vhd
    }
  }

  constructor(handler, path, targetVhd) {
    super()
    this._handler = handler
    this._path = path
    this.#vhd = targetVhd
  }

  async _updateAliasFile() {
    assert(this._path.endsWith('.alias.vhd'), `An alias file name must end by .alias.vhd, ${this._path} given`)
    if (this.#aliasFileExists) {
      return
    }
    await this._handler.writeFile(this._path, this.#vhd._path)
    this.#aliasFileExists = true
  }

  readBlockAllocationTable() {
    return this.#vhd.readBlockAllocationTable()
  }

  containsBlock(blockId) {
    return this.#vhd.containsBlock(blockId)
  }

  async readHeaderAndFooter() {
    return this.#vhd.readHeaderAndFooter()
  }

  async readBlock(blockId, onlyBitmap = false) {
    return this.#vhd.readHeaderAndFooter(blockId, onlyBitmap)
  }

  ensureBatSize() {
    return this.#vhd.ensureBatSize()
  }

  async writeFooter() {
    await this._updateAliasFile()
    return this.#vhd.writeFooter()
  }

  async writeHeader() {
    await this._updateAliasFile()
    return this.#vhd.writeHeader()
  }

  async writeBlockAllocationTable() {
    await this._updateAliasFile()
    return this.#vhd.writeBlockAllocationTable()
  }

  async setUniqueParentLocator(fileNameString) {
    await this._updateAliasFile()
    return this.#vhd.setUniqueParentLocator(fileNameString)
  }

  async coalesceBlock(child, blockId) {
    await this._updateAliasFile()
    return this.#vhd.coalesceBlock(child, blockId)
  }

  async writeEntireBlock(block) {
    await this._updateAliasFile()
    return this.#vhd.writeEntireBlock(block)
  }

  _readParentLocatorData(id) {
    return this.#vhd._readParentLocatorData(id)
  }

  async _writeParentLocatorData(id, data) {
    await this._updateAliasFile()
    return this.#vhd._writeParentLocatorData(id, data)
  }

  // also delete the vhd
  async unlink() {
    await this.#vhd.unlink()
    await this._handler.unlink(this._path)
  }

  async rename(path) {
    // only rename the alias, does not move the target vhd
    await this._handler.rename(this._path, path)
  }
}
