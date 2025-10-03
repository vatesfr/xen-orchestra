import { Timeout } from "@vates/generator-toolbox";
import { Disk, DiskBlock, RandomAccessDisk } from "./Disk.mjs";
import { DiskPassthrough, RandomDiskPassthrough } from "./DiskPassthrough.mjs";

export class TimeoutDisk extends DiskPassthrough{ 
    #timeout:number
    constructor(source: Disk, timeout:number){
        super(source)
        this.#timeout = timeout
    }
    async buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>>{
        const generator = await this.source.buildDiskBlockGenerator()
        const timeoutedGenerator = new Timeout(generator, this.#timeout)
        return timeoutedGenerator
    }

}


export class TimeoutRandomDisk extends RandomDiskPassthrough{
    #timeout:number
    constructor(source: RandomAccessDisk, timeout:number){
        super(source)
        this.#timeout = timeout
    } 

    async readBlock(index: number): Promise<DiskBlock> { 
        let success = false
        let interval
        let _resolve : (value:unknown)=>void
        const timeoutPromise = new Promise((resolve, reject)=>{
            interval = setInterval(()=>{
                if(!success){
                    reject(new Error(`ReadBlock of ${index} timeouted, (timeout is ${this.#timeout})`))
                }
            }, this.#timeout)
            _resolve = resolve

        })
        const start = performance.now()
       return Promise.race([
            this.source.readBlock(index).then((block:DiskBlock)=>{
                success = true
                const duration = performance.now() - start
                // resolve immediatly after the timeoutto ensure now promise is dangling
                // we can read a few hundred blocks per seconds
                setImmediate(()=>_resolve(undefined))
                return block
            }),  
            timeoutPromise
       ]) as Promise<DiskBlock>
    }

}