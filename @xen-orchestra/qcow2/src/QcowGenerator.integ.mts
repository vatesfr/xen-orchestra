import { DiskBlock, RandomAccessDisk } from "@xen-orchestra/disk-transform";
import fs from 'node:fs/promises'
import { toQcow2Stream } from "./toQcowStream.mjs";

class MockDisk extends RandomAccessDisk{
    #allocatedBlocks:Set<number>
    #blockSize = 64*1024 
    #size:number 
    constructor(size:number, allocatedBlock = new Set<number>()){
        super()
        this.#allocatedBlocks = allocatedBlock
        this.#size = size

    }
    readBlock(index: number): Promise<DiskBlock> {
        return Promise.resolve({
            index,
            data:Buffer.alloc(this.getBlockSize(), index%256)
        })
    }
    getVirtualSize(): number {
        return this.#size
    }
    getBlockSize(): number {
        return this.#blockSize
    }
    init(): Promise<void> {
        return Promise.resolve()
    }
    close(): Promise<void> {
        return Promise.resolve()
    }
    isDifferencing(): boolean {
        return false
    }
    getBlockIndexes(): Array<number> {
        return [...this.#allocatedBlocks]
    }
    hasBlock(index: number): boolean {
        return this.#allocatedBlocks.has(index)
    }
}

import { describe, it, before, after, mock } from 'node:test'
import assert from 'node:assert'


describe('Integration test for qcow2', ()=>{
    let disk:MockDisk

    before(() => {
        disk = new MockDisk(50*64*1024, new Set([1, 7 , 9]))
    })
    
    it('should create a valid disk ', async()=>{ 
        const stream  = toQcow2Stream(disk)
        await fs.writeFile('./disk.qcow', stream)
        console.log('written')
    })

})