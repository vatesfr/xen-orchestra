import { FileAccessor } from '../FileAccessor.mjs'
import { DiskBlock, Disk, RandomAccessDisk } from '../Disk.mjs'
import { DiskChain } from '../DiskChain.mjs'
import { RemoteVhd } from './RemoteVhd.mjs'

export class RemoteChain extends RandomAccessDisk {
  #path: string
  #handler: FileAccessor
  #chain: DiskChain
  #until?: string

  constructor({ handler, path, until }: { handler: FileAccessor; path: string; until?: string }) {
    super()
    this.#path = path
    this.#handler = handler
    this.#until = until
  }
  getVirtualSize(): number {
    return this.#chain.getVirtualSize()
  }
  getBlockSize(): number {
    return this.#chain.getBlockSize()
  }
  readBlock(index: number): Promise<DiskBlock> {
    return this.#chain.readBlock(index)
  }
  async init(): Promise<void> {
    let disk: RemoteVhd
    disk = new RemoteVhd({ handler: this.#handler, path: this.#path })
    await disk.init()
    const disks = [disk]

    while (disk.isDifferencing()) {
      disk = (await disk.openParent()) as RemoteVhd
      disks.unshift(disk)
    }
    // the root disk
    this.#chain = new DiskChain({ disks })

    // already initialized by individual open
    // await this.#chain.init()
  }
  close(): Promise<void> {
    return this.#chain.close()
  }
  isDifferencing(): boolean {
    return this.#chain.isDifferencing()
  }
  openParent(): Promise<Disk> {
    throw new Error('Method not implemented.')
  }
  getBlockIndexes(): Array<number> {
    return this.#chain.getBlockIndexes()
  }
  hasBlock(index: number): boolean {
    return this.#chain.hasBlock(index)
  }
}
