import { Disposable } from 'promise-toolbox'

export type DiskBlockData = Buffer
export type DiskBlock = {
  index: number
  data: DiskBlockData
}

export type BytesLength = number
export type Uuid = string

export abstract class DiskBlockGenerator {
  blockSize: number
  expectedNbBlocks?: number
  consumedBlocks: number = 0

  get isSizeComputable(): boolean {
    return this.expectedNbBlocks !== undefined
  }

  abstract hasBlock(index: number): boolean
  abstract readBlock(index: number): Promise<DiskBlockData>
  abstract [Symbol.asyncIterator](): AsyncIterator<DiskBlock>
}

export type Disposable<T> = {
  value: T
  dispose: () => Promise<void>
}

export abstract class PortableDiskMetadata {
  id: Uuid
  label: string
  description: string
  virtualSize: number
  parentUuid?: Uuid
  parentPath?: String
}

export abstract class PortableDifferencingDisk {
  abstract getMetadata(): Promise<PortableDiskMetadata>
  abstract getBlockIterator(): Promise<Disposable<DiskBlockGenerator>>
}
