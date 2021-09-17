import MergedBAT from '../bat/mergedBAT'
import MergedFooter from '../footer/mergedFooter'
import MergedHeader from '../header/mergedHeader'
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
    return new MergedFooter(this.vhds)
  }
  /**
   * @returns {Header}
   */
  getHeader() {
    return new MergedHeader(this.vhds)
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
