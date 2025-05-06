import assert from 'node:assert'
import {  DiskBlock, RandomAccessDisk } from './Disk.mjs'
import { RandomDiskPassthrough } from './DiskPassthrough.mjs'

export class DiskSmallerBlock extends RandomDiskPassthrough {

  #blockSize
  #currentBlock?:DiskBlock

  constructor(source: RandomAccessDisk, blockSize: number) {
    super(source) 
    assert.ok(blockSize<= source.getBlockSize(), `target block size ${blockSize} must be smaller the source block size ${source.getBlockSize()} `)
    
    assert.strictEqual(
       this.source.getBlockSize()%blockSize,
      0,
      `target block size ${blockSize} must be a multiple of the source block size ${source.getBlockSize()} `
    )
    this.#blockSize = blockSize
  }

  openSource(): Promise<RandomAccessDisk> {
// not a issue since source MUST BE passed to the constructor
    throw new Error('Method not implemented.')
  } 
  async readBlock(index: number): Promise<DiskBlock> {
    const blockRatio =  this.source.getBlockSize()/this.#blockSize
    const sourceIndex = Math.floor(index/blockRatio)
    let sourceData:Buffer
    if(this.#currentBlock?.index !== sourceIndex){
        const sourceBlock = await this.source.readBlock(sourceIndex)
        this.#currentBlock = sourceBlock
    }
    sourceData = this.#currentBlock!.data
    const indexInSourceBlock = index%blockRatio
    const data = Buffer.alloc(this.getBlockSize(), 0)
    sourceData.copy(data, 0, indexInSourceBlock*this.getBlockSize())

    return {index, data}

  } 
  getBlockSize(): number {
    return this.#blockSize
  }   
  getBlockIndexes(): Array<number> {
    const blockRatio = this.source.getBlockSize() / this.getBlockSize()
    const sourceIndexes = this.source.getBlockIndexes()
    const indexes = []
    for(const sourceIndex of sourceIndexes){
        for (let i = 0; i < blockRatio; i++) { 
            const index = sourceIndex*blockRatio + i
            if(index * this.getBlockSize()< this.getVirtualSize()){
                indexes.push(index) 
            }
        }
    } 

    return indexes
  }

  hasBlock(index: number): boolean {
    const blockRatio = this.source.getBlockSize() / this.getBlockSize()
    const sourceIndex = Math.floor(index/blockRatio)
    return this.source.hasBlock(sourceIndex)
  }
}
