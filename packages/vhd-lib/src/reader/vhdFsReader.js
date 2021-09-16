import { Stream } from 'readable-stream'
import BAT from '../bat/bat'
import VHDReader, { VHDREADER_TYPE_FS } from './vhdReader'

export default class VHDFsReader extends VHDReader {
  constructor(path) {
    super()
  }

  /**
   * @returns {Header}
   */
  getHeader() {
    // if the first one is DISK_TYPE_DYNAMIC, result type is  DISK_TYPE_DYNAMIC
    // if they are all DISK_TYPE_DIFFERENCING result type is DISK_TYPE_DIFFERENCING
    // other cases raise an error
  }

  /**
   * @returns {Header}
   */
  getFooter() {}

  getType() {
    return VHDREADER_TYPE_FS
  }

  /**
   * @returns {BAT}
   */
  getBAT() {}

  /**
   * @param {Block} block
   *
   * @returns {Stream | Buffer}
   */
  getBlockDataAndBitmap(block) {}

  /**
   * @param {Block} block
   *
   * @returns {Stream | Buffer}
   */
  getBlockBitmap(block) {}

  /**
   * @param {Block} block
   *
   * @returns {Stream | Buffer}
   */
  getBlockData(block) {}
}
