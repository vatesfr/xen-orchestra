import { Stream } from 'readable-stream'
import BAT from '../bat/bat'
import Footer from '../footer'
import Header from '../header'

export default class VHDReader {
  /**
   * @returns {Header}
   */
  getHeader() {}

  /**
   * @returns {Footer}
   */
  getFooter() {}
  /**
   * @returns {BAT}
   */
  getBAT() {}

  getBlockData(block) {}

  getBlockBitmap(block) {}

  getBlockDataAndBitmap(block) {}
}

export const VHDREADER_TYPE_UNDEFINED = 1
export const VHDREADER_TYPE_OBJECT_STORAGE = 2
export const VHDREADER_TYPE_FS = 3
export const VHDREADER_TYPE_MULTIPLE = 4
