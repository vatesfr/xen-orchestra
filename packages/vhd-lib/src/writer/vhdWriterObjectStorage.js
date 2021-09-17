import VHDWriter from './writer'

export default class VHDWriterObjectStorage extends VHDWriter {
  constructor(vhd, { s3, bucket, path }) {
    super(vhd)
  }
  write() {
    Promise
      .concurrencyLimited
      // write footer at OOOO
      // write header at 512
      // write BAT
      // write blocks in parallel
      // if writing in place
      ()
  }

  /**
   *
   * @param {Block} sourceBlock
   * @returns {Boolean}
   */
  canDirectCopy(sourceBlock){
    // should probably check if it's from the same object storage  service
    return ! sourceBlock.isVirtual()
      && sourceBlock.reader.type === VHDREADER_TYPE_OBJECT_STORAGE
  }

  directCopy(sourceBlock){
    // copy block from source without downloading it

  }

  _writeBlock(sourceBlock) {
    //fast track writing a block : if it already exists in S3  copy instead of downloading and then uploading it

    // since we want to be able to make block level compression/encryption
    // we can't update a part of a block
    // also check if source block is already on s3
    if (canDirectCopy(sourceBlock)) {
      return directCopy(sourceBlock)
    }
    // download block(s) buffer(s) and upload it
    return  this._writeRawData(
      sourceBlock.getBlockDataAndBitmap(),
      sourceBlock.getAddress()
      )
  }

  async _writeRawData(data, offset){

  }
}
