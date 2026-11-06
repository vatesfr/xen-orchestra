import { RemoteDisk } from "./RemoteDisk.mjs";


/**
 * this class stores disk blocks by there has instead of their position
 * doing per disk dedup as a bonus
 * 
 * it also integrate the alias part to simplify the rename 
 * 
 * determine the extension of these new disk ( Vates Backup Disk ? Hashed Backup Storage ?)
 * 
 * {diskname}.{extension}
 *   |- blockStorePath
 *          |- hash1
 *              |- hash2
 *                  ...
 *                  |- hashn 
 */

/**
 * @typedef {Object} HashedDiskMetadata
 * @property {number} virtualSize 
 * @property {string} uuid 
 * @property {string|undefined} parentUuid 
 * @property {string|undefined} parentPath 
 * @property {number} blockSize 
 * @property {PER_DISK | PER_BACKUP_REPOSITORY  } dedupType  implement PER_DISK here, PER_BACKUP_REPOSITORY will be for later
 * @property {string} blockStorePath path relative to this file, random name 
 */

export class HashedDisk extends RemoteDisk{
   
  async canMergeConcurently() {
    return true
  }
 
  /**
   * Checks if the hash is not empty in the BAT
   * @param {number} index
   * @returns {boolean}
   */
  hasBlock(index) {
    throw new Error(`hasBlock must be implemented`)
  }

  /**
   * Gets the indexes of all blocks in the VHD.
   * @returns {Array<number>}
   */
  getBlockIndexes() {
    throw new Error(`getBlockIndexes must be implemented`)
  }

  /**
   * determine the hash algorithm and hash length from https://en.wikipedia.org/wiki/Birthday_problem 
   * compute the hash from the clear data 
   * compute the path from the hash 
   * split the path in 8 bytes parts at most , and create the directory tree if needed
   * write the block in a temp place 
   * rename the block to its defintive place, treat EEXIST as success ( block is already here )
   * 
   * @param {DiskBlock} diskBlock
   * @return {Promise<number>} blockSize
   */
  async writeBlock(diskBlock) {
    throw new Error(`writeBlock must be implemented`)
  }

  /**
   * read the hash 
   * compute the path from the hash 
   * read the block from its path 
   * @param {number} index
   * @returns {Promise<DiskBlock>} diskBlock
   */
  async readBlock(index) {
    throw new Error(`readBlock must be implemented`)
  }

  /**
   * if block is already present in parent : not an issue, but still update the parent BAT
   * @param {RemoteDisk} childDisk
   * @param {number} index
   * @param {boolean} isResumingMerge
   * @returns {Promise<number>} blockSize
   */
  async mergeBlock(childDisk, index, isResumingMerge) {
    throw new Error(`mergeBlock must be implemented`)
  }

  /**
   * will need to also update he hashes 
   * @param {Array<number>} blockIds
   * @returns {Promise<void>}
   */
  async setAllocatedBlocks(blockIds) {
    throw new Error(`setAllocatedBlocks must be implemented`)
  }

  /**
   * write the metadata as a JSON flat file 
   * @param {RemoteDisk} childDisk
   * @returns {Promise<void>}
   */
  async flushMetadata(childDisk) {
    throw new Error(`flushMetadata must be implemented`)
  }


  /**
   * rename only the metadata file 
   * delete overwritten target / disks if needed
   * @param {string} newPath
   */
  async rename(newPath) {
    throw new Error(`rename must be implemented`)
  }

  /**
   * This must write the hashes and bat into a new files
   * update the metadata that point to it
   * then remove the older file
   * 
   * this is built on the fact that the merge now only
   *  write it at the end of the job, so we don't update BAT
   */
  async flushMetadata(){

  }


  /**
   * (for cleanVM)
   * detecte older bat/hashes files 
   */
  async check(){

  }

}