import { Disk, type DiskBlock, RandomAccessDisk,type FileAccessor} from '@xen-orchestra/disk-transform' 


export class VmdkFlat extends RandomAccessDisk{
    #datastore: FileAccessor
    #path:string
    #descriptor?:number 
    #blockSize:number
    #size?:number

    constructor(datastore:FileAccessor, path:string, blockSize:number){
        super()
        this.#datastore = datastore
        this.#path= path
        this.#blockSize = blockSize

    }
    async readBlock(index: number): Promise<DiskBlock> {
        if(this.#descriptor === undefined){
            throw new Error(`can't call readBlock of VmdkFlat before init`);
        }
        const data = Buffer.alloc(this.getBlockSize())
        await this.#datastore.read(this.#descriptor, data, index*this.getBlockSize())
        return {
            index,
            data
        }
        
    }
    getVirtualSize(): number {
        if(this.#size === undefined){
            throw new Error(`can't call getVirtualSize of VmdkFlat before init`);
        }
        return this.#size
    }
    getBlockSize(): number {
        return this.#blockSize
    }
    async init(): Promise<void> {
        this.#descriptor = await this.#datastore.open(this.#path) 
        this.#size = await this.#datastore.getSize(this.#path)
    }
    async close(): Promise<void> {
        if(this.#descriptor !== undefined){
            await this.#datastore.close(this.#descriptor)  
        }
    }
    isDifferencing(): boolean {
        return false
    }
    openParent(): Promise<Disk> {
        throw new Error('Method not implemented.');
    }
    getBlockIndexes(): Array<number> {
        throw new Error('Method not implemented.');
    }
    hasBlock(index: number): boolean {
        // flat disk are full 
        return true
    }
    
}