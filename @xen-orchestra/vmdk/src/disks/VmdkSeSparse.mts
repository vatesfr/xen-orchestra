import { DiskBlock, FileAccessor, RandomAccessDisk } from "@xen-orchestra/disk-transform";

import { notEqual, strictEqual } from 'node:assert'
import { VmdkDisk } from "./Vmdk.mjs"
import { dirname, join } from "node:path"

/**
 * SeSparse has 
 *  * a grain directory , telling the address of the grain tables
 *  * multiples grain table telling the adress of the grains 
 *  * 8 bit per entry in grain table
 *  * 4KB bytes grain size
 *  * no compression
 *  *
 */
 

const SE_SPARSE_DIR_NON_ALLOCATED = 0
const SE_SPARSE_DIR_ALLOCATED = 1

const SE_SPARSE_GRAIN_NON_ALLOCATED = 0 // check in parent
const SE_SPARSE_GRAIN_UNMAPPED = 1 // grain has been unmapped, but index of previous grain still readable for reclamation
const SE_SPARSE_GRAIN_ZERO = 2
const SE_SPARSE_GRAIN_ALLOCATED = 3

const GRAIN_SIZE_BYTES = 4 * 1024
const GRAIN_TABLE_COUNT = 4 * 1024

const EMPTY_GRAIN = Buffer.alloc(GRAIN_SIZE_BYTES, 0)

const ones = (n: number) => (1n << BigInt(n)) - 1n

function asNumber(n: bigint) {
    if (n > BigInt(Number.MAX_SAFE_INTEGER))
        throw new Error(`can't handle ${n} ${Number.MAX_SAFE_INTEGER} ${n & 0x00000000ffffffffn}`)
    return Number(n)
}

const readInt64 = (buffer: Buffer, index: number) => asNumber(buffer.readBigInt64LE(index * 8))

/**
 * @returns {{topNibble: number, low60: bigint}} topNibble is the first 4 bits of the 64 bits entry, indexPart is the remaining 60 bits
 */
function readTaggedEntry(buffer: Buffer, index: number):{type:number, offset:bigint} {
    const entry = buffer.readBigInt64LE(index * 8)
    return { type: Number(entry >> 60n), offset: entry & ones(60) }
}

function readSeSparseDir(buffer: Buffer, index: number) {
    const { type, offset } = readTaggedEntry(buffer, index)
    return { type, tableIndex: asNumber(offset) }
}

function readSeSparseTable(buffer: Buffer, index: number) {
    const { type, offset } = readTaggedEntry(buffer, index)
    // https://lists.gnu.org/archive/html/qemu-block/2019-06/msg00934.html
    const topIndexPart = offset >> 48n // bring the top 12 bits down
    const bottomIndexPart = (offset & ones(48)) << 12n // bring the bottom 48 bits up
    return { type, grainIndex: asNumber(bottomIndexPart | topIndexPart) }
}


export class VmdkSeSparse extends RandomAccessDisk {

    #accessor: FileAccessor
    #path: string
    #descriptor: number | undefined

    #grainIndex =new  Map<number, number>  // Map blockId => offset
    #size: number | undefined

    #parent:VmdkDisk
    get parent(){
        return this.#parent
    }
    constructor(accessor:FileAccessor, path:string, parent:VmdkDisk){
        super()
        this.#accessor = accessor
        this.#parent = parent
        this.#path = path
    }

    async init() {
        this.#descriptor = await this.#accessor.open(this.#path)
        const vmdkHeaderBuffer = Buffer.alloc(2048)
        await this.#accessor.read(this.#descriptor, vmdkHeaderBuffer, 0)

        strictEqual(vmdkHeaderBuffer.readBigInt64LE(0), 0xcafebaben)
        strictEqual(readInt64(vmdkHeaderBuffer, 1), 0x200000001) // version 2.1

        const grainDirOffsetBytes = readInt64(vmdkHeaderBuffer, 16) * 512
        // console.log('grainDirOffsetBytes', this.#grainDirOffsetBytes)
        const grainDirSizeBytes = readInt64(vmdkHeaderBuffer, 17) * 512
        // console.log('grainDirSizeBytes', this.#grainDirSizeBytes)

        const grainSizeSectors = readInt64(vmdkHeaderBuffer, 3)
        const grainSizeBytes = grainSizeSectors * 512 // 8 sectors = 4KB default
        strictEqual(grainSizeBytes, GRAIN_SIZE_BYTES) // we only support default grain size

        const grainTableOffsetBytes = readInt64(vmdkHeaderBuffer, 18) * 512
        // console.log('grainTableOffsetBytes', this.#grainTableOffsetBytes)

        const grainTableCount = (readInt64(vmdkHeaderBuffer, 4) * 512) / 8 // count is the number of 64b entries in each tables
        // console.log('grainTableCount', grainTableCount)
        strictEqual(grainTableCount, GRAIN_TABLE_COUNT) // we only support tables of 4096 entries (default)

        const grainOffsetBytes = readInt64(vmdkHeaderBuffer, 24) * 512
        // console.log('grainOffsetBytes', this.#grainOffsetBytes)

        this.#size = readInt64(vmdkHeaderBuffer, 2) * 512


        const tableSizeBytes = GRAIN_TABLE_COUNT * 8
        const grainDirBuffer = Buffer.alloc(grainDirSizeBytes, 0)
        await this.#accessor.read(this.#descriptor, grainDirBuffer, grainDirOffsetBytes)
        for (let grainDirIndex = 0; grainDirIndex < grainDirBuffer.length / 8; grainDirIndex++) {
            const { type: grainDirType, tableIndex } = readSeSparseDir(grainDirBuffer, grainDirIndex)
            if (grainDirType === SE_SPARSE_DIR_NON_ALLOCATED) {
                // no grain table allocated at all in this grain dir
                continue
            }
            strictEqual(grainDirType, SE_SPARSE_DIR_ALLOCATED)
            // read the corresponding grain table ( second level )

            const grainTableBuffer = Buffer.alloc(tableSizeBytes, 0)
            await this.#accessor.read(this.#descriptor, grainTableBuffer, grainTableOffsetBytes + tableIndex * tableSizeBytes) 

            for (let grainTableIndex = 0; grainTableIndex < grainTableBuffer.length / 8; grainTableIndex++) {
                const { type: grainType, grainIndex } = readSeSparseTable(grainTableBuffer, grainTableIndex)
                if (grainType === SE_SPARSE_GRAIN_ALLOCATED) {
                    strictEqual(grainIndex < Number.MAX_SAFE_INTEGER / GRAIN_SIZE_BYTES, true, `SeSparse can only handle offset up to ${Number.MAX_SAFE_INTEGER} (2^${Math.log2(Number.MAX_SAFE_INTEGER)}) -1 bytes`)
                    const offsetByte = grainIndex * GRAIN_SIZE_BYTES + grainOffsetBytes
                    this.#grainIndex?.set(grainDirIndex * GRAIN_TABLE_COUNT + grainTableIndex, offsetByte)
                } else {
                    if([SE_SPARSE_GRAIN_ZERO, SE_SPARSE_GRAIN_UNMAPPED].includes(grainType)){
                        // multiply by -1 to differenciate type and offset
                        // no offset can be zero
                        this.#grainIndex?.set(grainDirIndex * GRAIN_TABLE_COUNT + grainTableIndex, -grainType)
                    }
                    // SE_SPARSE_GRAIN_NON_ALLOCATED may be in parent, but this a concern of the chain not of this disk
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
    getBlockSize(): number {
        return 4 * 1024
    }
    getVirtualSize(): number {
        if (this.#size === undefined) {
            throw new Error("Can't getVirtualSize before calling init")
        }
        return this.#size
    }
    hasBlock(index: number): boolean {
        return this.#grainIndex.has(index)
    }

    async readBlock(index: number): Promise<DiskBlock> {
        if (this.#descriptor === undefined) {
            throw new Error('SeSparse disk must be init before reading blocks')
        }
        const offset = this.#grainIndex.get(index)
        if(offset === undefined){
            throw new Error("Can't read unallocated grain")
        }
        if(offset === 0){
            throw new Error( "Can't read SE_SPARSE_GRAIN_NON_ALLOCATED grain")
        }
        if(offset >0){
            const grainBuffer = Buffer.alloc(GRAIN_SIZE_BYTES, 0)
            await this.#accessor.read(this.#descriptor, grainBuffer, offset) 
            return  {index, data:grainBuffer}

        } else {

            return {index, data:EMPTY_GRAIN}
        }
        
    }
}