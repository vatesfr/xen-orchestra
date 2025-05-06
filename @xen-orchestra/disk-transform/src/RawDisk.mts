import { DiskBlock, RandomAccessDisk } from "./Disk.mjs";
import { FileAccessor } from "./FileAccessor.mjs";


export class RawDisk extends RandomAccessDisk{
    #accessor
    #path
    #descriptor:number|undefined
    #blockSize:number
    #size: number|undefined


    constructor(accessor: FileAccessor, path: string, blockSize:number){
        super()
        this.#accessor= accessor
        this.#path = path
        this.#blockSize = blockSize
    }
    async readBlock(index: number): Promise<DiskBlock> {
        if(this.#descriptor === undefined || this.#size === undefined){
            throw new Error("Can't call readBlock before init");
        }
        const offset = index*this.getBlockSize() 
        if( offset > this.#size){
            throw new Error("Can't read after the en");
        }
        const data = Buffer.alloc(Math.min(this.getBlockSize(), this.#size - offset), 0)
        await this.#accessor.read(this.#descriptor, data, index*this.getBlockSize())
        return {
            index,
            data
        }
    }
    getVirtualSize(): number {
        if(this.#size === undefined){
            throw new Error("Can't call getVirtualsize before init");
        }
        return this.#size
    }
    getBlockSize(): number {
        return this.#blockSize
    }
    async init(): Promise<void> {
        this.#descriptor = await  this.#accessor.open(this.#path)
        this.#size = await this.#accessor.getSize(this.#path)
    }
    async close(): Promise<void> {
        this.#descriptor && await  this.#accessor.close(this.#descriptor)
        this.#descriptor = undefined
        this.#size = undefined
    }
    isDifferencing(): boolean {
        return false
    }
    getBlockIndexes(): Array<number> {
        const nbBlocks = Math.ceil(this.getVirtualSize()/ this.getBlockSize())
        const index =[]
        for(let i=0; i < nbBlocks; i ++){
            index.push(i)
        }
        return index
    }
    hasBlock(index: number): boolean {
        return index * this.getBlockSize() < this.getVirtualSize()
    }
    
}