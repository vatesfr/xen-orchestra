import Blocks from './block'

class MergedBlock extends Block {
  subblocks
  constructor(reader, address, blocks) {
    super()
  }
  isVirtual() {
    return true
  }

  /**
   * @returns {Block|null}
   */
  async getBlockData() {
    // should be implemented onlyif we want to use multi level merge [vhd1, vhd2], vhd3]
  }

  /**
   *
   * @returns {Buffer|Stream|null}
   */
  async getBlockBitmap() {
    // should be implemented only if we want to use multi level merge [vhd1, vhd2], vhd3]
  }
  /**
   *
   * @returns {Buffer|Stream|null}
   */
  async getBlockDataAndBitmap() {
    // candidates = block.subblocks
    // if candidates is empty
    // return null
    // sort in descending order ( grand child -> child -> parent )
    // result = { bitmap:[], sector: []}
    // for subblock of block.subblocks
    //  if reader does not support partial reading , read full block and keep data aside
    //  get subblock bitmap (subblock.reader.readBlock(subblock.index))
    //  for each  sector of the defined in the subblock.bitmap
    //  if subblock.bitmap[sector.index] = 0 // empty in DYNAMIC, unchanged in DIFFERENCE
    //    continue
    //  if result.bitmap[sector.index] = 1 // already got this sector
    //    continue
    //  result.bitmap[sector.index] = 1
    //  result.sector[sector.index] = sector
    //  if result.bitmap.isFull()
    //      return a new Buffer built from result
    // build a Buffer from result and return it
  }
}
