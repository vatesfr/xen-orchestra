import VHDReader, { VHDREADER_TYPE_OBJECT_STORAGE } from './vhdReader'

export default class VHDObjectStorageReader extends VHDReader {
  s3
  bucket
  path
  constructor({ s3, bucket, path }) {
    super()
  }

  getType() {
    return VHDREADER_TYPE_OBJECT_STORAGE
  }

  supportPartialBlockRead() {
    return false
  }
  /**
   *throw an error if address and length aren't aligned with existing objects

   * @param {Int} address
   * @param {Int} length
   * @returns {Buffer|Stream|null}
   */
  async _getRawData(address, length) {}
}
