import { Stream } from 'readable-stream'
import BAT from '../bat/bat'
import Footer from '../footer'
import Header from '../header'

export default class VHDReader {
  uncompress(streamOrBuffer) {
    return streamOrBuffer
  }
  decrypt(streamOrBuffer) {
    return streamOrBuffer
  }
  /**
   * @returns {Header}
   */
  async getHeader() {
    return new Header(await this._getRawData(512, 1024))
  }

  /**
   * @returns {Footer}
   */
  async getFooter() {
    return new Footer(await this._getRawData(0, 512))
  }

  /**
   * @returns {BAT}
   */
  async getBAT(start, size) {
    return new BAT(await this._getRawData(start, size))
  }

  /**
   *
   * @param {Int} address
   * @param {Int} length
   * @returns {Buffer|Stream|null}
   */
  async _getRawData(address, length) {
    throw new Error(`Reading ${length} bytes from ${address} is not implemented`)
  }

  /**
   * returns true if the underlying system allows reading of a part of a block
   *
   * @returns {Boolean}
   */
  supportPartialBlockRead() {
    return false
  }
}

export const VHDREADER_TYPE_UNDEFINED = 1
export const VHDREADER_TYPE_OBJECT_STORAGE = 2
export const VHDREADER_TYPE_FS = 3
export const VHDREADER_TYPE_MULTIPLE = 4
