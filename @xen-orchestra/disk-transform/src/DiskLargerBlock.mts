import assert, { throws } from "node:assert";
import { Disk, DiskBlock, RandomAccessDisk } from "./Disk.mjs";

export class DiskLargerBlock extends RandomAccessDisk{

    
    #source:RandomAccessDisk
    #blockSize 
    constructor(source:RandomAccessDisk, blockSize:number){
        super()
        this.#source = source
        this.#blockSize = blockSize
    } 


    async readBlock(index: number): Promise<DiskBlock> {
        // @todo handle partial block at the end
        const source = this.#source
        const destinationBlock = Buffer.alloc(this.getBlockSize(), 0) 
        let blockRatio = this.#blockSize / source.getBlockSize() 
        for(let i=index*blockRatio; i < (index+1)*blockRatio; i ++){
            let data:Buffer|undefined
            if(source.hasBlock(i)){
                data = (await source.readBlock(i)).data 
            } else {
                if(this.isDifferencing()){
                    if(this.parent === undefined){
                        throw new Error(`can't read block of differencing disk in DiskLargerBlock if parent is not already open`)
                    }
                    const parent = (this.parent) as RandomAccessDisk
                    data = (await parent.readBlock(i)).data 
                }
            }
            if(data !==undefined){
                data.copy(destinationBlock, i*source.getBlockSize())
            }
        }
        return {
            index, 
            data: destinationBlock
        }
    }
    getVirtualSize(): number {
        return this.#source.getVirtualSize()
    }
    getBlockSize(): number {
        return this.#blockSize
    }
    async init(): Promise<void> {
        await this.#source.init()
        assert.strictEqual(this.#blockSize% this.#source.getBlockSize(), 0)
    }
    close(): Promise<void> {
        return  this.#source.close()
    }
    isDifferencing(): boolean {
        return  this.#source.isDifferencing()
    }
    instantiateParent(): Promise<Disk> {
        return  this.#source.instantiateParent()
    } 
    getBlockIndexes(): Array<number> {
        let maxBlock = Math.ceil(this.getVirtualSize()/this.getBlockSize())
        const indexes =[]
        for(let i = 0; i < maxBlock; i++){
            if(this.#source.hasBlock(i)){
                if(this.hasBlock(i)){
                    indexes.push(i)
                }
            }
        }
        return indexes
    }

    hasBlock(index: number): boolean {
        const source = this.#source
        let maxBlockSource = Math.ceil(source.getVirtualSize()/source.getBlockSize())
        let blockRatio = this.#blockSize / this.#source.getBlockSize()
        for(let i = index*blockRatio; i < Math.min((index+1)*blockRatio, maxBlockSource); i++){
            if(this.#source.hasBlock(i)){
                return true
            }
        }
        return false
    }
}