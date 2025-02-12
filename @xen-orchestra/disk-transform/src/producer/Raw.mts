import { FileAccessor } from "../FileAccessor.mjs";
import { DiskBlock, PortableDisk, RandomAccessDisk } from "../PortableDisk.mjs";

/**
 * create a portable disk from a raw disk 
 */
export class RawDisk extends RandomAccessDisk{

    #handler: FileAccessor
    #path: string

    #fileHandle:number | Promise<number>
    #blockSize:number
    #virtualSize:number
    
    constructor(handler: FileAccessor, path:string, blockSize:number){
        super()
        this.#handler = handler
        this.#path = path
        this.#blockSize = blockSize
    }
    getVirtualSize(): number {
        return this.#virtualSize
    }
    getBlockSize(): number {
        return this.#blockSize
    }
    async readBlock(index: number): Promise<DiskBlock> {
        if(this.#fileHandle === undefined){
            this.#fileHandle = this.#handler.open(this.#path, {offset: index*this.getBlockSize()})
        }
        
        if(typeof this.#fileHandle !== 'number'){
            this.#fileHandle  = await this.#fileHandle 
        }
        const data = Buffer.alloc(this.getBlockSize(), 0)
        await this.#handler.read(this.#path, data, index*this.getBlockSize() ) 
        return {index, data}
    }
    async init(): Promise<void> {
        const size = await this.#handler.getSize(this.#path)
        this.#virtualSize = size
    }
    async close(): Promise<void> { 
        if(this.#fileHandle === undefined){
            return 
        }
        if(typeof this.#fileHandle !== 'number'){
            this.#fileHandle = await this.#fileHandle
        }
        await this.#handler.close(this.#fileHandle)
    }
    isDifferencing(): boolean {
        return false
    }
    openParent(): Promise<PortableDisk> {
        throw new Error("Method not implemented.");
    }
    getBlockIndexes(): Array<number> {
        const nbBlocks = Math.ceil(this.getVirtualSize()/this.getBlockSize())
        const indexes = []
        for(let i=0; i <nbBlocks ; i++ ){
            indexes.push(i)
        }
        return indexes
    }
    hasBlock(index: number): boolean {
        return true
    }
    
}