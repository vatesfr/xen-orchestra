import VHDReader, { VHDREADER_TYPE_MULTIPLE } from './vhdReader'

export default class VHDFsReader extends VHDReader {
  constructor(vhds) {
    super()
  }

  getType() {
    return VHDREADER_TYPE_MULTIPLE
  }

  /**
   * @returns {MergedBAT}
   */
  getBAT() {}

  supportPartialBlockRead() {
    // only if composed only of block thaht accepts partial reading
  }

  async _getRawData(address, length){
    throw new Error("Can't call directly _getRawData of a VhdMergeReader")
  }
}
