import type { FileAccessor } from '../FileAccessor.mts'
import {
  PortableDisk,
  RandomAccessDisk,
  type DiskBlock,
} from '../PortableDisk.mjs'
import { openVhd } from 'vhd-lib'
import type { VhdDirectory } from 'vhd-lib/Vhd/VhdDirectory.js'
import type { VhdFile } from 'vhd-lib/Vhd/VhdFile.js'

export class RemoteVhd extends RandomAccessDisk  {
  #path:string
  #handler: FileAccessor
  #vhd: VhdFile | VhdDirectory
  #dispose: () => any

  constructor({ handler, path }: { handler: FileAccessor; path: string }) {
    super()
    // @todo : ensure this is the full path from the root of the remote 
    this.#path =path
    this.#handler = handler 
  }

  async init(): Promise<void> {
    const { value, dispose } = await openVhd(this.#handler, this.#path)
    this.#vhd = value
    this.virtualSize = this.#vhd.footer.currentSize
    this.blockSize = 2*1024*1024
    this.#dispose = dispose
    await this.#vhd.readBlockAllocationTable()
  }
  async close(): Promise<void> {
    await this.#dispose()
  }
  hasBlock(index: number): boolean {
    return this.#vhd.containsBlock(index)
  }

  getBlockIndexes(): Array<number> {
    let index = []
    for (let blockIndex = 0; blockIndex < this.#vhd.header.maxTableEntries; blockIndex++) {
      if (this.hasBlock(blockIndex)) {
        index.push(blockIndex)
      }
    }
    return index
  }

  async readBlock(index: number): Promise<DiskBlock> {
    const {data} = await this.#vhd.readBlock(index)
    return {
      index,
      data
    }
  }


  async openParent():Promise<PortableDisk>{
    const parentPath = this.#vhd.header.parentUnicodeName
    if(!parentPath){
      throw new Error(`Disk ${this.#path} doesn't have parents`)
    }
    const parent = new RemoteVhd({handler: this.#handler, path: parentPath})
    await parent.init()
    return parent
  }  
  isDifferencing():boolean{
    return !!this.#vhd.header.parentUnicodeName
  }
}
