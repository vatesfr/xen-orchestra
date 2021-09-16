import VHDWriter from './writer'

class VHDWriterStream extends VHDWriter {
  constructor(path) {}
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
