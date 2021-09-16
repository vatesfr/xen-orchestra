import VHDWriter from './writer'

export default class VHDWriterObjectStorage extends VHDWriter {
  constructor(vhd, s3) {}
  write(bucket, path) {
    Promise
      .concurrencyLimited
      // write footer at OOOO
      // write header at 512
      // write BAT
      // write blocks in parallel
      // if writing in place
      ()
  }

  _writeBlock(index) {
    //fast track writing a block : if it already exists in S3  copy instead of downloading and then uploading it

    // since we want to be able to make block level compression/encryption
    // we can't update a part of a block
    // also check if source block is already on s3
    if (!this.vhd.bat.isBlockVirtual(index) && this.vhd.getReader().type === VHDREADER_TYPE_OBJECT_STORAGE) {
      // copy block from source without downloading it
    } else {
      // download block(s) buffer(s) and upload it
    }
  }
}
