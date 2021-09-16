import BAT from '../bat/bat'
import Footer from '../footer'
import Header from '../header'

export default class VHD {
  reader
  header
  footer
  bat

  constructor(reader) {}
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
   *
   * @returns {BAT}
   */
  async getBAT() {
    if (!this.bat) {
      const content = await this.reader.getBAT()
      this.bat = new BAT(content)
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
    return this.getBlock(blockIndex).getBlockBitmap()
  }

  /**
   *
   * @param {Int} blockIndex
   * @returns {Buffer|Stream| null}
   */
  getBlockData(blockIndex) {
    return this.getBlock(blockIndex).getBlockData()
  }

  /**
   *
   * @param {Int} blockIndex
   * @returns {Buffer|Stream| null}
   */
  getBlockDataAndBitmap(blockIndex) {
    return this.getBlock(blockIndex).getBlockData()
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
