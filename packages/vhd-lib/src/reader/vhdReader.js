import { Stream } from 'readable-stream'
import BAT from '../bat/bat'
import Block from '../block/block'
import Footer from '../footer'
import Header from '../header'

export default class VHDReader {
  uncompress(streamOrBuffer) {}
  decrypt(streamOrBuffer) {}
  /**
   * @returns {Header}
   */
  async getHeader() {}

  /**
   * @returns {Footer}
   */
  async getFooter() {}
  /**
   * @returns {BAT}
   */
  async getBAT() {}

  /**
   *
   * @param {Int} address
   * @param {Int} length
   * @returns {Buffer|Stream|null}
   */
  async _getRawData(address, length){ }

  supportPartialBlockRead(){}
}

export const VHDREADER_TYPE_UNDEFINED = 1
export const VHDREADER_TYPE_OBJECT_STORAGE = 2
export const VHDREADER_TYPE_FS = 3
export const VHDREADER_TYPE_MULTIPLE = 4
