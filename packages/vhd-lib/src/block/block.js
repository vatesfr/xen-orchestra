export default class Block {
  reader
  address
  constructor(reader, address) {}

  isVirtual() {
    return false
  }

  getBitmapLength() {
    return 512
  }
  getDataLength() {
    return 2 * 1024 * 1024 * 1024
  }

  /**
   * @returns {Block|null}
   */
  async getBlockData() {
    this.reader._getRawData(this.address + this.getBitmapLength(), this.getDataLength())
  }

  /**
   *
   * @returns {Buffer|Stream|null}
   */
  async getBlockBitmap() {
    this.reader._getRawData(this.address, this.getBitmapLength())
  }
  /**
   *
   * @returns {Buffer|Stream|null}
   */
  async getBlockDataAndBitmap() {
    this.reader._getRawData(0, this.getBitmapLength() + this.getDataLength())
  }
}
