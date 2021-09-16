import VHDWriter from './writer'

class VHDWriterStream extends VHDWriter {
  constructor(vhd, writableStream) {
    super(vhd)
  }
  write() {
    // write footer
    // write header
    // write BAT
    // get blocks order by address
    // for each block
    //  pad between the current offset and block.offset
    //  write block.getBUffer()
    // write footer
  }
}
