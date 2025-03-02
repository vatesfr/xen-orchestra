import {DiskPassthrough} from './DiskPassthrough.mjs'
import {Synchronized} from '@vates/generator-toolbox'
import {Disk, DiskBlock} from './Disk.mjs'

export class SynchronizedDisk extends DiskPassthrough{
    #synchronized:Synchronized<DiskBlock, any,any> |undefined 
    #source:Disk
    constructor(source:Disk){
        super()
        this.#source = source
    } 
    async openSource():Promise<Disk>{ 
       // await this.#source.init()
        this.#synchronized = new Synchronized(await  this.#source.buildDiskBlockGenerator())
        return this.#source
    } 
    async * diskBlocks(uid:string): AsyncGenerator<DiskBlock>{
        console.log('will fork')
        if(this.#synchronized === undefined){
            throw new Error("Can't cann fork before init")
        }
        return this.#synchronized.fork(uid)
    }

    async close(){
        console.log('SynchronizedDisk.close')
        await this.source.close() // this will trigger cleanup in syncrhonized
    }
}