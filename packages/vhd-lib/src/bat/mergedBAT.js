import Block from '../block/block'
import BAT from './bat'

export default class MergedBAT extends BAT {
  constructor(reader, [vhd]) {
    super()
    // loop through the BATs
    // construct an index called bat
    //     blockIndex => vhds:[]
    // loop through the index and compute the adress of the blocks when merging
    // for each vhd
    //  for each block of the bat
    //     if the address of the block is already used by another block
    //          move the block at the end
    //     else the block keep its address
    //    store the computed address into the index
    // if bat is growing more than the space allocated => move the first block at the end
  }
  toStream() {}
  getEndOfData() {} // end of the last block or parentlocator in the virtual BAT
  getSize() {} // size on disk

  /**
   *
   * @param {Int} index
   *
   * @returns {Block}
   */
  async getBlock(blockIndex) {
    if (!this.index[blockIndex]) {
      return null
    }
    const { vhds } = this.index[index]

    if (vhds.length === 0) {
      return null
    }

    if (vhds.length === 1) {
      return vhds[0].getBAT().getBlock(blockIndex)
    }

    const blocks = await Promise.all(vhds.map(vhd => vhd.getBlock(blockIndex)))
    return new MergedBlock(this.reader, this.computeBlockAddress(blockIndex), blocks)
  }
  computeBlockAddress(blockIndex) {
    // return the address in the virtual BAT
  }

  getIterator(sortBlocksByAddress = false) {
    // for all the block from  the BAts
  }
}
