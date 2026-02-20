

 class BlockStore{

  constructor(handler, basePath){} 
  /**
   * write the block, returns the key in store
   * @param {string} hash 
   * @param {Buffer} content 
   */
    writeBlock( hash, content){
    
    }

   /**
   * return the code from its key 
   * @param {string} hash 
   * @param {Buffer} content 
   */
    readBlock( hash){

    }
 
   /**
   * free one block use 
   * @param {string} hash 
   * @param {Buffer} content 
   */
    removeReference(hash){
      
    }
 
   /**
   * mark this bock as used
   * @param {string} hash 
   * @param {path} string 
   */
    addBlockReference(hash, path){
      
    }
}

 class BlockStoreFileSystem extends BlockStore{

  constructor(handler, basePath){}
  #handler
    hash(diskBlock){}

    #computePathInStore(hash){

    }

    /** 
     * write the file in a temporary folder
     * rename to the path computed from the hash/0
     * treat EEXIST as success
     * 
     * @param {string} hash 
     * @param {Buffer} content 
     * @returns {Promise<size>} the size written on disk, 0 if if block already here
     */
    async writeBlock( hash, content){
      try{
        return await this.#handler.outputFile(this.#computePathInStore(hash), content)
      }catch(err){
        if(err.code === 'EEXIST'){
          return 0
        }
        throw err
      }
    
    }


    /**
     * compute the path from the hash 
     * read the file from this path 
     * @param {string} hash 
     * @returns {Promise<Buffer} content 
     */
    readBlock( hash){
      const path = this.#computePathInStore(hash)
      return this.#handler.readFile(path)
    }

    /**
     * remove the hard link
     * check the hash/i and remove any that have a nLinks < 2 
     * @param {*} hash 
     */
    removeReference(hash){
      
    }

    /**
     * nLinks is probably limited to 32 bits, but can be as low as 16 bits
     * blocks are referenced once per disk 
     * the chain should not be very long , even blocks present in all the disks like the empty block 
     * 
     * do a hard link from the hashed path
     * to the path hash/0
     * 
     * ON EMLINK error ( too )
     * try hash/1  ,.. hash/2 ... 
     * if out of file copy the last then link from this new block
     * @param {*} hash 
     * @param {*} path 
     */
    addBlockReference(hash, path){
      
    }
}


 /**
 * this class stores disk blocks in a global store at the root of the remote
 * this class is more the second step after a complete HashedDisk implementation
 * and should be  used in production instead of HashedDisk
  */

export class HashedDiskDeduplicated extends HashedDisk{
  #blockStore
  /**
   * 
   * @param {*} handler 
   * @param {*} path 
   * @param {BlockStore} blockStore 
   */
  constructor(handler, path, blockStore){

  }

  /**
   * write the block into the block store, get the block key 
   * link the block key to the same path as HashedDisk
   * 
   * if link return a ENOENT that means another process clean this block , re-add to block store
   * 
   * if this overwrite another block, then remove the old reference from the store 
   * @param {DiskBlock} diskBlock 
   */
  async writeBlock(diskBlock) { 
    let size
    const path = this.computeBlockPath(diskBlock)
    const hash = this.#blockStore.hash(diskBlock)
    try{
      // optimistically try if block exists
      size = await this.#blockStore.addBlockReference(hash, path)
      return size 
    }catch(error){
      // not really an issue , it was just that the block did not already exists
    }
    
    size = await this.#blockStore.writeBlock(hash, diskBlock.data)
    size += await this.#blockStore.addBlockReference(hash, path)
    return size 
  }

  /** 
   * remove all the references of this disk in the block store 
   */
   async unlink() {
    throw new Error(`unlink must be implemented`)
  }

  /**
   * or maybe another callback ? 
   * call removeReference on each hash that is not present anymore in the parent after merge
   * doing this once will limit the risks of race conditions when removing
   */
  flushMetadata(){

  }

}