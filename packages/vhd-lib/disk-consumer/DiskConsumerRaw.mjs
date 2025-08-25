import { Readable } from 'stream'
import { BaseVhd } from './BaseVhd.mjs' 
import assert from 'node:assert'
const FOOTER_SIZE = 512
const HEADER_SIZE = 1024
const DEFAULT_BLOCK_SIZE = 2*1024*1024 +512
/**
 * @typedef {Readable & { length: number }} VhdStream
 */

/**
 * @typedef {Object} StreamInterval
 * @property {number} length - End position of the interval (exclusive)
 * @property {() => Promise<Buffer>} getBuffer - Function returning the buffer for this interval
 */


export class DiscreteStreamAccessor {
  #intervals
    /**
     * @param {StreamInterval[]} intervals - Array of stream intervals
     */
    constructor(intervals = []) {
      this.#intervals = intervals
    }

    /**
     * 
     * @param {number} start 
     * @param {number} end 
     */
    async read(start, buffer){
      let read = 0
      let currentPos = 0
      const length = buffer.length
      let currentIntervalIndex = 0
      while(read < length){
        if(currentIntervalIndex>= this.#intervals.length){
          return read
          throw new Error(`Reached end of available data, tried to read ${length} from ${start}, and found only ${read} bytes`)
        }
        const {length:intervalLength, getBuffer, name} = this.#intervals[currentIntervalIndex]
        const intervalEnd = currentPos + intervalLength
        if(start < intervalEnd ){
          const startInBuffer = Math.max(start - currentPos,0)
          const lengthInBuffer =  Math.min(length -read, intervalLength - startInBuffer )
          const truncatedBuffer = await getBuffer(startInBuffer, lengthInBuffer)
          truncatedBuffer.copy(buffer,read)
          read += lengthInBuffer
        }
        currentIntervalIndex++
        currentPos += intervalLength
      }
      return read
    }
}

const BLOCK_AND_BITMAP_SIZE =(2*1024*1024+512)
/**
 * @extends {BaseVhd}
 */
export class DiskConsumerVhdDiscrete extends BaseVhd {
  #accessor 
  fileSize

  constructor(source){
    super(source)

    const footer = this.computeVhdFooter(Buffer.from('660c15cb-1643-4d32-b034-6e5b346a9c20'))
    const header = this.computeVhdHeader('f30f068a-bd96-4997-b8ab-befa82fee550','./parent.vhd')
    const { bat, fileSize, nbBlocks} = this.computeVhdBatAndFileSize()
    this.fileSize = fileSize
    const indexes = this.source.getBlockIndexes()

    this.#accessor = new DiscreteStreamAccessor([
      {length: FOOTER_SIZE, getBuffer:(s,l)=>footer.subarray(s, s+l), name:'footer'},
      {length: HEADER_SIZE, getBuffer:(s,l)=>header.subarray(s, s+l), name:'header'},
      {length: bat.length, getBuffer:(s,l)=>bat.subarray(s, s+l), name:'bat'},
      // we don't want to create one entry per block
      // so we creaet an entry for all the block and do the gluing  inside
      // reading only the impacted blocks 
      {length:  BLOCK_AND_BITMAP_SIZE * nbBlocks, name:'blocks',getBuffer: async (startInblocks, length)=>{
        const blockIndexStart =  Math.floor(startInblocks / BLOCK_AND_BITMAP_SIZE)
        const blockIndexEnd = Math.floor( (startInblocks +length ) / BLOCK_AND_BITMAP_SIZE)
        const buffer = Buffer.alloc((blockIndexEnd- blockIndexStart+1) * BLOCK_AND_BITMAP_SIZE, 255)
        let currentPos = 512 // bitmap is preallocated
        for(let index= blockIndexStart; index < blockIndexEnd; index++){
          const data = (await this.source.readBlock(indexes[index])).data
          data.copy(buffer, currentPos)
          currentPos += BLOCK_AND_BITMAP_SIZE
        }
        const startInBlock = startInblocks - blockIndexStart*BLOCK_AND_BITMAP_SIZE
        return buffer.subarray(startInBlock, startInBlock+ length)
      }},
      {length: FOOTER_SIZE, getBuffer:(s,l)=>footer.subarray(s, s+l), name:'footer2'},

    ])

  }

  async read(offset, buffer){
    return this.#accessor.read(offset, buffer)
  }

  async close(){
    await this.source.close()
  }
}
