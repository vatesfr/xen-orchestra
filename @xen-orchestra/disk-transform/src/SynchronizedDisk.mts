import { DiskPassthrough } from './DiskPassthrough.mjs'
import { Synchronized } from '@vates/generator-toolbox'
import { Disk, DiskBlock } from './Disk.mjs'


class ForkedDisk extends DiskPassthrough{
  #source:Disk
  // source is already openned and init
  get source(): Disk { 
    return this.#source
  }
  #generator:AsyncGenerator<DiskBlock, any, any> 
  constructor(source:Disk, generator:AsyncGenerator<DiskBlock, any, any>){
    super()
    this.#generator = generator
    this.#source = source 

  }
  async openSource(): Promise<Disk> { 
    return this.#source
  }
  diskBlocks( ){
    console.log('CALL DISK BLOCK ')
    return this.#generator
  }
}

export class SynchronizedDisk  {
  #synchronized: Synchronized<DiskBlock, any, any> | undefined
  #source: Disk

  constructor(source: Disk) { 
    this.#source = source
  }
 
  fork(uid:string):ForkedDisk{
    if(this.#synchronized === undefined){
    const generator = this.#source.diskBlocks()
    this.#synchronized = new Synchronized(generator)
    }
    console.log('forked', uid)
    return new ForkedDisk(this.#source, this.#synchronized.fork(uid))
  }
  close(){
    return this.#source.close()
  }
}
