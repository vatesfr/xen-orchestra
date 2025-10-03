import { Throttle } from "@vates/generator-toolbox";
import { Disk, DiskBlock, RandomAccessDisk } from "./Disk.mjs";
import { DiskPassthrough, RandomDiskPassthrough } from "./DiskPassthrough.mjs";

export class ThrottledDisk extends DiskPassthrough{ 
    #throttle:Throttle
    constructor(source: Disk, throttle:Throttle){
        super(source)
        this.#throttle = throttle
    }
    async buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>>{
        const generator = await this.source.buildDiskBlockGenerator()
        //throttle ant to be able to know the length of the data 
        async function * generatorWithLength(){
            for await(const {index, data} of generator){
                yield {
                    index, 
                    data, 
                    length: data.length
                }
            }
        }
        const throttledGenerator = this.#throttle.createThrottledGenerator(generatorWithLength()) 
        return throttledGenerator as AsyncGenerator<DiskBlock>
    }

}


export class ThrottledRandomDisk extends RandomDiskPassthrough{
    #throttle:Throttle
    constructor(source: RandomAccessDisk, throttle:Throttle){
        super(source)
        this.#throttle = throttle
    }

    async readBlock(index: number): Promise<DiskBlock> { 
        const { promise } =  this.#throttle.getNextSlot(this.source.getBlockSize())
        const [block] = await Promise.all([
            await this.source.readBlock(index),
            promise ?? Promise.resolve()
        ])  
        return block
    }

}