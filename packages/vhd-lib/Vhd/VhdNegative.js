'use strict'

const { VhdAbstract } = require('./VhdAbstract')

const VhdNegative = class VhdNegative extends VhdAbstract {
  #from
  #to

  get header() { 
    return this.#from.header
  }

  get footer() { 
    return this.#from.footer
  }

  get compressionType() { 
    return this.#from.compressionType
  }

  static async open(from , to) {
    const vhd = new VhdNegative(from , to)
    await vhd.readHeaderAndFooter()
    return {
      dispose: () => {
        // @todo : must dispose from and to 
      },
      value: vhd,
    }
  }
  /**
   * @param {VhdAbstract} from
   * @param {VhdAbstract} to
   * 
   * compute a VHDAbstract compatible vhd with all the block that are in both VHD , with the data of from 
   * that way a chain from -> to -> negative will contains the data of from 
   */
  constructor(from , to) { 
    super() 
    this.#from = from
    this.#to = to
  }

  async readBlockAllocationTable() {
    return  Promise.all([
      this.#from.readBlockAllocationTable(),
      this.#to.readBlockAllocationTable()
    ])
  }

  containsBlock(blockId) {
    return this.#from.containsBlock(blockId) && this.#to.containsBlock(blockId)
  }

  async readHeaderAndFooter() {
    return  Promise.all([
      this.#from.readHeaderAndFooter(),
      this.#to.readHeaderAndFooter()
    ])
  }
 

  async readBlock(blockId, onlyBitmap = false) {
    this.#from.readBlock(blockId, onlyBitmap)
  }

  async mergeBlock(child, blockId) {
    throw new Error(`can't coalesce block into a vhd synthetic`)
  }

}
 

exports.VhdNegative = VhdNegative
