import {  DiskBlock,FileAccessor, RandomAccessDisk } from "@xen-orchestra/disk-transform";


import { strictEqual } from 'node:assert'
import { VmdkDisk } from "./Vmdk.mjs";
import { dirname, join } from "node:path";

export class VmdkCowd extends RandomAccessDisk{
    #accessor:FileAccessor
    #parentPath:string
    #path:string
    #descriptor:number|undefined
    #grainDirectory: Buffer|undefined
    #size:number|undefined

    constructor(accessor:FileAccessor, path:string, parentPath:string){
        super()
        this.#accessor = accessor
        this.#parentPath = parentPath
        this.#path = path

    }

    async instantiateParent():Promise<RandomAccessDisk>{
        return new VmdkDisk(this.#accessor, join(dirname(this.#path), this.#parentPath))
    }

    async readBlock(index: number): Promise<DiskBlock> {
        const parent = await this.openParent() as RandomAccessDisk
        if(this.#grainDirectory === undefined){
            throw new Error("Can't read block before calling init")
        }
        if(this.#descriptor === undefined){
            throw new Error("Can't read block before calling init")
        }
        const sectorOffset = this.#grainDirectory.readUInt32LE(index * 4)
        if(sectorOffset === 0){
            return parent.readBlock(index)
        } else {

            let parentBlock:DiskBlock|undefined
            const graintable = Buffer.alloc( 4096 * 4 /* grain table length */)
            const data = Buffer.alloc(this.getBlockSize(), 0) 
            const sector = Buffer.alloc(512,0)
            await this.#accessor.read(this.#descriptor, graintable,sectorOffset* 512 ) 

            for (let i = 0; i < graintable.length / 4; i++) {
                const grainOffset = graintable.readUInt32LE(i * 4)
                if (grainOffset === 0) {
                    //  look into parent
                    if(parentBlock === undefined){
                        parentBlock = await parent.readBlock(index)
                    }
                    parentBlock.data.copy(data, i* 512,i*512, (i+1)*512)
                } else if (grainOffset === 1) { 
                  // this is a emptied grain, no data, don't look into parent 
                  // buffer is already zeroed
                } else if (grainOffset > 1) {
                  // non empty grain, read from file
                  await this.#accessor.read(this.#descriptor,sector,grainOffset*512 )
                }
              }
            return {index, data}
        }
        
    }
    getVirtualSize(): number {
        if(this.#size === undefined){
            throw new Error("Can't getVirtualSize before calling init")
        }
        return this.#size
    }
    getBlockSize(): number {
        return 2 *1024*1024 // one grain directory entry
    }

    async init(): Promise<void> {
        this.#descriptor = await this.#accessor.open(this.#path)
        const buffer = Buffer.alloc(2048)
        await this.#accessor.read(this.#descriptor, buffer, 0)

        strictEqual(buffer.slice(0, 4).toString('ascii'), 'COWD')
        strictEqual(buffer.readUInt32LE(4), 1) // version
        strictEqual(buffer.readUInt32LE(8), 3) // flags
        const numSectors = buffer.readUInt32LE(12)
        const grainSize = buffer.readUInt32LE(16)
        strictEqual(grainSize, 1) // 1 grain should be 1 sector long
        strictEqual(buffer.readUInt32LE(20), 4) // grain directory position in sectors

        const nbGrainDirectoryEntries = buffer.readUInt32LE(24)
        strictEqual(nbGrainDirectoryEntries, Math.ceil(numSectors / 4096))
        this.#size = numSectors * 512

        // a grain directory entry contains the address of a grain table
        // a grain table can adresses at most 4096 grain of 512 Bytes of data 
        this.#grainDirectory = Buffer.alloc(nbGrainDirectoryEntries*4)
        // load the grain directory
        await this.#accessor.read(this.#descriptor, this.#grainDirectory, 2048)

    }
    async close(): Promise<void> {
        this.#descriptor && this.#accessor.close(this.#descriptor)
    }
    isDifferencing(): boolean {
        return true
    } 
    getBlockIndexes(): Array<number> {
        if(this.#grainDirectory === undefined){
            throw new Error("Can't getBlockIndexes before calling init")
        }
        const indexes = []
        for(let i=0;i < this.#grainDirectory.length /4; i ++){
            if(this.hasBlock(i)){
                indexes.push(i)
            }
        }
        return indexes
    }
    hasBlock(index: number): boolean {
        if(this.#grainDirectory === undefined){
            throw new Error("Can't hasBlock before calling init")
        }
        // only check if a grain table exist for on of the sector of the block
        // the great news is that a grain size has 4096 entries of 512B = 2M
        // and a vhd block is also 2M
        // so we only need to check if a grain table exists (it's not created without data)

        return this.#grainDirectory.readUInt32LE(index * 4) !== 0
    }
    
}