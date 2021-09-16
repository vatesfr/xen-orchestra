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
  readBlock(block) {}
}
