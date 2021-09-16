import VHDReader, { VHDREADER_TYPE_OBJECT_STORAGE } from './vhdReader'

export default class VHDObjectStorageReader extends VHDReader {
  constructor({ s3, bucket, path }) {
    super()
  }

  getType() {
    return VHDREADER_TYPE_OBJECT_STORAGE
  }
  getHeader() {}
  getFooter() {}
  getBAT() {}

  supportPartialBlockRead(){
    return false
  }
  /**
   *throw an error if adderss and length aren't aligne with existing objects

   * @param {Int} address
   * @param {Int} length
   * @returns {Buffer|Stream|null}
   */
  async _getRawData(address, length){ }

}
