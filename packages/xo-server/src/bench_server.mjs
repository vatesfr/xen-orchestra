//@ts-check
import { NBDServer } from "../../../@vates/nbd-server/dist/index.js"
import {RandomAccessDisk} from '@xen-orchestra/disk-transform/dist/Disk.mjs'

/**
 * 
 * @param {number} ms 
 * @returns {Promise<void>}
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
class RandomDisk extends RandomAccessDisk{
    #blockSize
    #diskSize
    readLatency

    /**
     * 
     * @param {number} blockSize 
     * @param {number} diskSize 
     */
    constructor(blockSize, diskSize, readLatency=1){
        super()
        this.#blockSize = blockSize
        this.#diskSize = diskSize
        this.readLatency = readLatency
    }
    /**
     * 
     * @param {number} index 
     * @returns 
     */
   async  readBlock(index) {
        if(this.readLatency){
            await sleep(this.readLatency)
        }
        return {
            index, 
            data: Buffer.alloc(this.getBlockSize(), index%256)
        }
    }
    getVirtualSize() {
        return this.#diskSize
    }
    getBlockSize() {
        return this.#blockSize
    }
    async init() {  }
    async close() {  }
    isDifferencing() {
        return false
    }
    getBlockIndexes() {
        const nbBlock = Math.ceil(this.getVirtualSize() / this.getBlockSize())
        return [...Array(nbBlock).keys()]
    }
    hasBlock() {
        return true
    }

}


async function bench(){ 
    const HOST =  'localhost'
    const PORT =  11000
    const BLOCK_SIZE = 2*1024*1024
    const DISK_SIZE = 10*1024*1024*1024  
    /**
     * @type {Map<string,RandomAccessDisk>}
     */
    const exportNames = new Map()
    const sourceDisk = new RandomDisk(BLOCK_SIZE, DISK_SIZE)
    exportNames.set('disk', sourceDisk)

     new NBDServer({port: PORT, host: HOST,exports:exportNames }) 
 
}   


bench()