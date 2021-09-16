import { Stream } from 'readable-stream'
import Block from '../block/block'

export default class BAT {
  reader
  constructor(reader, buffer) {}
  /**
   * @returns {Stream}
   */
  toStream() {} //bat content as a stream

  /**
   * end of the last block or parentlocator
   * @returns {Int}
   */
  getEndOfData() {}

  /**
   * size of the BAT on disk
   * @returns  {Int}
   */
  getSize() {}

  /**
   *
   * @param {Boolean} sortBlocksByAddress
   * @returns {Iterator}
   */
  getIterator(sortBlocksByAddress = false) {
    // list all blocks in the BAT blockId => {address, block,  }
  }
  /**
   *
   * @param {Int} index
   * @returns {Block?}
   */
  getBlock(blockIndex) {
    if (!this.bat[index]) {
      return null
    }
    const address = this.computeBlockAddress(blockIndex)
    return new Block(this.reader, address)
  }

  computeBlockAddress(blockIndex) {
    return this.bat[blockIndex] * 512 + 1024 + 512
  }

  createBlock() {}
}
