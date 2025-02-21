import { Synchronized } from '@vates/generator-toolbox'

export type DiskBlockData = Buffer
export type DiskBlock = {
  index: number // the index of the block. Offset in raw disk is index * blockSize
  data: DiskBlockData // thue Buffer like data of this block. Must be blockSize length
}

export type BytesLength = number

export abstract class Disk {
  generatedDiskBlocks = 0
  yieldedDiskBlocks = 0
  #synchronized:Synchronized<DiskBlock, any, any> | undefined
  #parent?: Disk
  get parent(): Disk | undefined {
    return this.#parent
  }

  abstract getVirtualSize(): number
  abstract getBlockSize(): number
  abstract init(): Promise<void>
  abstract close(): Promise<void>

  abstract isDifferencing(): boolean
  // optional method, must throw if disk is not differencing
  instantiateParent(): Promise<Disk> {
    throw new Error('Method not implemented.')
  }
  async openParent(): Promise<Disk> {
    this.#parent = await this.instantiateParent()
    await this.#parent.init()
    return this.#parent
  }

  /**
   * return the block without any order nor stability guarantee
   */
  abstract getBlockIndexes(): Array<number>
  abstract hasBlock(index: number): boolean
  abstract buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>> | AsyncGenerator<DiskBlock>
  async diskBlocks(uid?:string): Promise<AsyncGenerator<DiskBlock>>{
    if(this.#synchronized === undefined){  
      try{

        const blockGenerator = await this.buildDiskBlockGenerator()   
        const self = this   
        async function *trackedGenerator():AsyncGenerator<DiskBlock>{
          for await (const block of blockGenerator){
            self.generatedDiskBlocks ++
            yield block
            self.yieldedDiskBlocks ++
  
          }
        } 
        this.#synchronized = new Synchronized(trackedGenerator())
      }finally{
        await this.close()
      }  
    }
    return this.#synchronized.fork(uid ?? "unanamed generator fork")
    
  } 

  check() {
    // @todo move here the checks done in cleanVm if possible
    return Promise.resolve(true)
  }

  // @todo readRawData will be needed for file level restore
  // @todo rename will be needed for merge
  // @todo : should the alias part moved from remote/vhd ?
}

/**
 * Disks implementing this class can be accessed in any order
 * For example xva will need to have data in the offset order
 */

export abstract class RandomAccessDisk extends Disk {
  #parent?: RandomAccessDisk
  get parent(): RandomAccessDisk | undefined {
    return this.#parent
  }
  abstract readBlock(index: number): Promise<DiskBlock>
  async *buildDiskBlockGenerator() {
    for (const index of this.getBlockIndexes()) {
      yield this.readBlock(index)
    }
  }
}
