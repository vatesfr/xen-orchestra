import { openVhd } from 'vhd-lib'
import {
  DiskBlock,
  DiskBlockData,
  DiskBlockGenerator,
  Disposable,
  PortableDifferencingDisk,
  PortableDiskMetadata,
  Uuid,
} from '../PortableDifferencingDisk.mjs'
import { FileAccessor } from '../file-accessor/FileAccessor.mjs'
import { dirname, join, relative } from 'path'

type VhdBlock = {
  id: number
  bitmap: Buffer
  data: Buffer
  buffer: Buffer
}

export type Vhd = {
  header: { maxTableEntries: number }
  footer: { blockSize: number }
  open(handler: any /* remoteadapter */, path: string): Promise<Disposable<Vhd>>
  containsBlock(id: number): boolean
  readHeaderAndFooter(): Promise<void>
  readBlockAllocationTable(): Promise<void>
  readBlock(index: number): Promise<VhdBlock>
  blocks(): AsyncIterator<VhdBlock>
  writeHeaderAndFooter(): Promise<void>
  writeBlockAllocationTable(): Promise<void>
  writeEntireBlock(block: VhdBlock): Promise<void>
}

class VhdFileGenerator extends DiskBlockGenerator {
  #vhd: Vhd
  constructor(vhd: Vhd) {
    super()
    this.#vhd = vhd
    this.expectedNbBlocks = vhd.header.maxTableEntries
    this.blockSize = vhd.footer.blockSize * 512
  }
  hasBlock(index: number): boolean {
    return this.#vhd.containsBlock(index)
  }
  async readBlock(index: number): Promise<DiskBlockData> {
    const block = await this.#vhd.readBlock(index)
    return block.buffer
  }
  async *[Symbol.asyncIterator](): AsyncIterator<DiskBlock> {
    const blockIterator = this.#vhd.blocks()
    let res: { value: VhdBlock; done?: boolean }
    do {
      res = await blockIterator.next(this)
      this.consumedBlocks++
      yield {
        index: res.value.id,
        data: res.value.data,
      }
    } while (!res.done)
  }
}

type Vdi = {
  virtual_size: number
  name_label: string
  desc: string
  uuid: Uuid
  ref: string
}
export type RemoteMetadata = {
  vdis: Array<Vdi>
  vhds: Object
}

type VhdRemoteDiskMetadata = PortableDiskMetadata & {
  path: string
}

export class VhdRemote extends PortableDifferencingDisk {
  #handler: FileAccessor
  #metadataPath: string
  #diskUuid: Uuid

  constructor({ handler, metadataPath, diskUuid }: { handler: FileAccessor; metadataPath: string; diskUuid: Uuid }) {
    super()
    this.#handler = handler
    this.#metadataPath = metadataPath
    this.#diskUuid = diskUuid
  }
  async getMetadata(): Promise<VhdRemoteDiskMetadata> {
    const metadata = JSON.parse((await this.#handler.readFile(this.#metadataPath)).toString('utf8')) as RemoteMetadata

    const vdi = Object.entries(metadata.vdis)
      .map(([ref, vdi]) => ({ ...vdi, ref }))
      .find(({ uuid }) => uuid === this.#diskUuid)
    if (vdi === undefined) {
      throw new Error(`Couldn't find disk with uuid ${this.#diskUuid}`)
    }
    const vhd = metadata.vhds[vdi.ref]
    if (vhd === undefined) {
      throw new Error(`Couldn't find vhd with ref ${vdi.ref}`)
    }
    return Promise.resolve({
      id: this.#diskUuid,
      label: vdi.name_label,
      description: vdi.desc,
      virtualSize: vdi.virtual_size,
      path: vhd,
    })
  }

  async getBlockIterator(): Promise<Disposable<DiskBlockGenerator>> {
    const { path } = await this.getMetadata()
    console.log(join(dirname(this.#metadataPath), path))
    const disposable: unknown = await openVhd(this.#handler, join(dirname(this.#metadataPath), path))
    const { value: vhd, dispose } = disposable as Disposable<Vhd> // @todo : type openVhd correctly
    await vhd.readBlockAllocationTable()
    console.log({ vhd })
    const generator = new VhdFileGenerator(vhd)

    return {
      value: generator,
      dispose,
    }
  }
}
