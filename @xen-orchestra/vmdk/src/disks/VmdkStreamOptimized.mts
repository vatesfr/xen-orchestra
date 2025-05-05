import {  DiskBlock,FileAccessor, RandomAccessDisk } from "@xen-orchestra/disk-transform";

import { unpackVmdkHeader } from "../definitions.mjs";
import assert from 'node:assert'
import zlib from 'node:zlib'

const VMDKHEADER_SIZE = 1024
const SECTOR_SIZE = 512
/**
 * SeSparse
 *  * grain are comrpessed
 *  * grain / grain directory / table are preceded by a marker  a marker type + data
 *  * the grain marker contains the size of the  compressed data following
 */
export class VmdkCowd extends RandomAccessDisk{
    #accessor:FileAccessor
    #path:string
    #descriptor:number|undefined
    #size:number|undefined
    #grainIndex = new Map<number, number>()
    #blockSize:number |undefined

    constructor(accessor:FileAccessor, path:string){
        super()
        this.#accessor = accessor
        this.#path = path
    }

    // streamoptimized blocks are compressed 
    // and they are preceded by a marker indicating their size  
    async readBlock(index: number): Promise<DiskBlock> { 
        const offset = this.#grainIndex.get(index)
        if(offset === undefined){
            throw new Error("can't read an unallocated grain")
        }
        if(this.#descriptor === undefined){
            throw new Error("Can't readblock before calling init")
        }
        const dataSizeBuffer = Buffer.alloc(4, 0)
        await this.#accessor.read(this.#descriptor, dataSizeBuffer, offset + 8 )
        const dataSize = dataSizeBuffer.readUInt32LE(0)
        const compressedData = Buffer.alloc(dataSize, 0)
        await this.#accessor.read(this.#descriptor, compressedData, offset * SECTOR_SIZE + 12 )
        const inflated = zlib.inflateSync(compressedData)
        assert.strictEqual(inflated.length, this.getBlockSize())
        return {
            index, 
            data: inflated
        }
    }
    getVirtualSize(): number {
        if(this.#size === undefined){
            throw new Error("Can't getVirtualSize before calling init")
        }
        return this.#size
    }
    getBlockSize(): number {
        if(this.#blockSize=== undefined){
            throw new Error("Can't getBlockSize before calling init")

        }
        return this.#blockSize
    }

    async init(): Promise<void> {
        this.#descriptor = await this.#accessor.open(this.#path)

        // complete header is at the end of the file
        // the header at the beginning don't have the L1 table position
        const size = await this.#accessor.getSize(this.#path)
        const headerBuffer = Buffer.alloc(VMDKHEADER_SIZE, 0)
        await this.#accessor.read(this.#descriptor, headerBuffer, size - 1024)
        
        const vmdkHeader = unpackVmdkHeader(headerBuffer)
        
        // default of streamoptimized is 64KB blocks 
        this.#blockSize = vmdkHeader.grainSizeSectors * SECTOR_SIZE

        this.#size = vmdkHeader.capacitySectors * SECTOR_SIZE

        const l1entries = Math.floor(
            (vmdkHeader.capacitySectors + vmdkHeader.l1EntrySectors - 1) / vmdkHeader.l1EntrySectors
        )
        const l1Buffer = Buffer.alloc(l1entries * 4)
        await this.#accessor.read(this.#descriptor,l1Buffer, vmdkHeader.grainDirectoryOffsetSectors * SECTOR_SIZE )
        
        for (let grainTableIndex = 0; grainTableIndex < l1entries; grainTableIndex++) {
            const l1Entry = l1Buffer.readUInt32LE(grainTableIndex * 4)
            if(l1Entry === 0){
                continue
            }
            const l2ByteSize = vmdkHeader.numGTEsPerGT * 4
            const l2Buffer = Buffer.alloc(l2ByteSize,0)
            await this.#accessor.read(this.#descriptor,l2Buffer, l1Entry * SECTOR_SIZE )
            
            for (let i = 0; i < vmdkHeader.numGTEsPerGT; i++) {
                const offset = l2Buffer.readUInt32LE(i * 4)
                if(offset !== 0){
                    this.#grainIndex.set(vmdkHeader.numGTEsPerGT * grainTableIndex + i, offset*SECTOR_SIZE)
                }
            }
        }
        
    }
    async close(): Promise<void> {
        this.#descriptor && this.#accessor.close(this.#descriptor)
    }
    isDifferencing(): boolean {
        return true
    } 
    getBlockIndexes(): Array<number> {
        return [...this.#grainIndex.keys()]
    }
    hasBlock(index: number): boolean {
        return this.#grainIndex.has(index)
    }
    
}