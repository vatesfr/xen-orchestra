import { Disk, DiskBlock, RandomAccessDisk } from './Disk.mjs'

export class DiskPassthrough extends Disk {
  #source: Disk | undefined
  get source(): Disk {
    if (this.#source === undefined) {
      throw new Error(`Either transmit the source to the constructor or implement openSource and call init`)
    }
    return this.#source
  }
  get parent(): Disk | undefined {
    return this.#source?.parent
  }
  constructor(source:Disk|undefined =undefined){
    super()
    this.#source = source
  }
  getVirtualSize(): number {
    return this.source.getVirtualSize()
  }
  getBlockSize(): number {
    return this.source.getBlockSize()
  }

  async openSource(): Promise<Disk>{
    throw new Error('open source should be implemented to handle complex open scenario')
  }
  async init(): Promise<void> {
    // open only if nothing has been given to the constructor
    this.#source = this.#source ?? await this.openSource()
  }

  instantiateParent(): Disk {
    return this.source.instantiateParent()
  }
  async close(): Promise<void> {
    await this.#source?.close()
  }
  isDifferencing(): boolean {
    return this.source.isDifferencing()
  }
  getBlockIndexes(): Array<number> {
    return this.source.getBlockIndexes()
  }
  hasBlock(index: number): boolean {
    return this.source.hasBlock(index)
  }
  async buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>> {
    return this.source.buildDiskBlockGenerator()
  }
  getNbGeneratedBlock(): number { 
    return this.source.getNbGeneratedBlock()
  }
  diskBlocks():AsyncGenerator<DiskBlock>{
    return this.source.diskBlocks()
  }
}

export abstract class RandomDiskPassthrough extends RandomAccessDisk {
  #source: RandomAccessDisk | undefined
  get source(): RandomAccessDisk {
    if (this.#source === undefined) {
      throw new Error(`Either transmit the source to the constructor or implement openSource and call init`)
    }
    return this.#source
  }
  
  get parent(): RandomAccessDisk | undefined {
    return this.#source?.parent as RandomAccessDisk
  }

  constructor(source:RandomAccessDisk|undefined){
    super()
    this.#source = source
  }
  /**
   * return an empty block if asking for and block not included in this disk
   * @param index
   * @returns {Promise<DiskBlock>}
   */
  readBlock(index: number): Promise<DiskBlock> {
    return this.source.readBlock(index)
  }
  getVirtualSize(): number {
    return this.source.getVirtualSize()
  }
  getBlockSize(): number {
    return this.source.getBlockSize()
  }

  abstract openSource(): Promise<RandomAccessDisk>
  async init(): Promise<void> {
    // open only if nothing has been given to the constructor
    this.#source = this.#source ?? await this.openSource()
  }

  instantiateParent(): RandomAccessDisk {
    return this.source.instantiateParent()
  }

  async close(): Promise<void> {
    await this.source?.close()
  }

  isDifferencing(): boolean {
    return this.source.isDifferencing()
  }
  getBlockIndexes(): Array<number> {
    return this.source.getBlockIndexes()
  }
  hasBlock(index: number): boolean {
    return this.source.hasBlock(index)
  }
  getNbGeneratedBlock(): number { 
    console.log('random passthrough get generated ')
    return this.source.getNbGeneratedBlock()
  }
  diskBlocks():AsyncGenerator<DiskBlock>{
    return this.source.diskBlocks()
  }
}
