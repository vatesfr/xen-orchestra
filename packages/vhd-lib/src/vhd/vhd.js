import Header from '../header'

export default class VHD {
  reader
  header
  footer
  bat

  constructor(reader) {}
  uncompress(streamOrBuffer) {}
  decrypt(streamOrBuffer) {}

  async getHeader() {
    if (!this.header) {
      this.header = await this.reader.getHeader()
    }
    return this.header
  }
  async getFooter() {
    if (!this.footer) {
      this.footer = await this.reader.getFooter()
    }
    return this.footer
  }
  async getBAT() {
    if (!this.bat) {
      const content = await this.reader.getBAT()
      this.bat = new BAT(content)
    }
    return this.bat
  }
  getBlock(blockIndex) {
    return this.getBAT().getBlock(blockIndex)
  }
  getBlockBitmap(blockIndex) {
    return this.getBlock(blockIndex).getBlockBitmap()
  }
  getBlockData(blockIndex) {
    return this.getBlock(blockIndex).getBlockData()
  }

  //read part of a block or the bitmap
  getBlockPart(block, start, end) {
    return this.reader.getBlockPart(block, start, end)
  }

  getBlocksIterator(sortBlocksByAddress) {
    return this.getBAT().getIterator(sortBlocksByAddress)
  }
}
