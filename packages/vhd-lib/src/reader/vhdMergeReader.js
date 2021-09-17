import MergedBAT from '../bat/mergedBAT'
import VHDReader, { VHDREADER_TYPE_MULTIPLE } from './vhdReader'

export default class VHDFsReader extends VHDReader {
  vhds
  constructor(vhds) {
    super()
    this.vhds = vhds
  }

  /**
   * @returns {Footer}
   */
  getFooter() {
    // if the first one is DISK_TYPE_DYNAMIC, result type is  DISK_TYPE_DYNAMIC
    // if they are all DISK_TYPE_DIFFERENCING result type is DISK_TYPE_DIFFERENCING
    // other cases raise an error
    // other data comes from last vhd
  }
  /**
   * @returns {Header}
   */
  getHeader() {
    // reference to parent is the reference of the first vhd
    // other data comes from last vhd
  }

  getType() {
    return VHDREADER_TYPE_MULTIPLE
  }

  /**
   * @returns {MergedBAT}
   */
  getBAT() {
    return new MergedBAT(this, this.vhds)
  }

  supportPartialBlockRead() {
    // only if composed only of block thaht accepts partial reading
    let support = true
    this.vhds.forEach(vhd => {
      support = support && vhd.supportPartialBlockRead()
    })
    return support
  }

  async _getRawData(address, length) {
    throw new Error("Can't call directly _getRawData of a VhdMergeReader")
  }
}
