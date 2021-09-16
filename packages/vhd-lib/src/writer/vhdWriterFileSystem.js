import VHDWriter from './writer'

class VHDWriterFileSystem extends VHDWriter {
  constructor(vhd) {
    super()
  }
  _writeBlock(streamOrBuffer, offset) {}

  write(path) {
    // shouldn't have concurrency problem since we know each block start and end
    Promise
      .concurrencyLimited
      // write footer
      // write header
      // write BAT
      // write block
      // write footer
      ()
  }
}
