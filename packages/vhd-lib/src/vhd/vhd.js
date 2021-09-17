import BAT from '../bat/bat'
import Footer from '../footer'
import Header from '../header'
import instantiateReader from '../reader/instantiateReader'
import { SECTOR_SIZE } from '../_constants'

const computeBatSize = entries => sectorsToBytes(sectorsRoundUpNoZero(entries * 4))

// Sectors conversions.
const sectorsRoundUpNoZero = bytes => Math.ceil(bytes / SECTOR_SIZE) || 1
const sectorsToBytes = sectors => sectors * SECTOR_SIZE
export default class VHD {
  reader
  header
  footer
  bat

  constructor(readerOpts) {
    this.reader = instantiateReader(readerOpts)
  }
  /**
   *
   * @returns {Header}
   */
  async getHeader() {
    if (!this.header) {
      this.header = await this.reader.getHeader()
    }
    return this.header
  }

  /**
   * @returns {Footer}
   */
  async getFooter() {
    if (!this.footer) {
      this.footer = await this.reader.getFooter()
    }
    return this.footer
  }

  /**
   * return the size of the BAT from the header
   *
   * @returns {Int}
   */
  async _getBATSize() {
    const header = await this.getHeader()
    return computeBatSize(header.maxTableEntries)
  }

  /**
   * extract the starting point of the bat from the header
   * @returns {Int}
   */
  async _getBATStart() {
    const header = await this.getHeader()
    return computeBatSize(header.maxTableEntries)
  }

  /**
   *
   * @returns {BAT}
   */
  async getBAT() {
    if (!this.bat) {
      this.bat = await this.reader.getBAT(await this._getBATStart(), await this._getBATSize())
    }
    return this.bat
  }
  /**
   *
   * @param {Int} blockIndex
   * @returns {Block|null}
   */
  getBlock(blockIndex) {
    return this.getBAT().getBlock(blockIndex)
  }

  /**
   *
   * @param {Int} blockIndex
   * @returns {Buffer|Stream| null}
   */
  getBlockBitmap(blockIndex) {
    return this.getBlock(blockIndex)?.getBlockBitmap()
  }

  /**
   *
   * @param {Int} blockIndex
   * @returns {Buffer|Stream| null}
   */
  getBlockData(blockIndex) {
    return this.getBlock(blockIndex)?.getBlockData()
  }

  /**
   *
   * @param {Int} blockIndex
   * @returns {Buffer|Stream| null}
   */
  getBlockDataAndBitmap(blockIndex) {
    return this.getBlock(blockIndex)?.getBlockData()
  }

  /**
   *
   * @param {Boolean} sortBlocksByAddress if false blocks are ordered by blockINdex
   * @returns {Iterator}
   */
  getBlocksIterator(sortBlocksByAddress) {
    return this.getBAT().getIterator(sortBlocksByAddress)
  }
}
