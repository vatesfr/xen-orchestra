import assert from 'node:assert'
import { PortableDisk, type DiskBlock } from '../PortableDisk.mjs'
import { connectNbdClientIfPossible } from './nbdutils.mjs'

type ErrorWithCode = Error & {
  code: string
}
export class XapiVhdCbtSource extends PortableDisk {
  #nbdClient: any
  #nbdConcurrency: number
  #ref: string
  #baseRef: string
  #parentId: string
  #xapi: any
  #cbt: Buffer
  constructor({ vdiRef, baseRef, xapi, nbdConcurrency }:{vdiRef:string, baseRef:string, xapi:any, nbdConcurrency:number}) {
    super()
    this.#ref = vdiRef
    this.#baseRef = baseRef
    assert.notEqual(baseRef, undefined, 'CBT source can only be used for delta, no baseref given')
    this.#xapi = xapi
    this.#nbdConcurrency = nbdConcurrency
  }

  async init() {
    const ref = this.#ref
    const xapi = this.#xapi
    const baseRef = this.#baseRef
    const nbdConcurrency = this.#nbdConcurrency

    const [cbt_enabled, size, uuid, vdiName] = await Promise.all([
      xapi.getField('VDI', ref, 'cbt_enabled').catch(() => {
        /* on XS < 7.3 cbt is not supported */
      }),
      xapi.getField('VDI', ref, 'virtual_size'),
      xapi.getField('VDI', ref, 'uuid'),
      xapi.getField('VDI', ref, 'name_label'),
    ])
    if (cbt_enabled === false) {
      const error = new Error(`CBT is disabled`) as ErrorWithCode
      error.code = 'CBT_DISABLED'
      throw error
    }

    this.#parentId = await xapi
      .getField('VDI', baseRef, 'sm_config')
      .then((sm_config: { 'vhd-parent': string }) => sm_config['vhd-parent'])
    //const baseParentType = await xapi.getField('VDI', baseRef, 'type')  // cbt_metadata
    this.virtualSize = size

    this.#nbdClient = await connectNbdClientIfPossible(xapi, ref, nbdConcurrency)

    this.#cbt = (await this.#xapi.VDI_listChangedBlock(this.#baseRef, this.#ref)) as Buffer
  }

  getBlockIndexes(): Array<number> {
    assert.strictEqual(this.blockSize, 2 * 1024 * 1024)

    // block are aligned, we could probably compare the bytes to 255
    // each CBT block is 64KB
    // each VHD block is 2MB
    // => 32 CBT blocks per VHD block
    // each CBT block used flag is stored in 1 bit
    // => 4 bytes per VHD block => UINT32
    // if any sublock is used => download the full block
    const nbBlocks = this.#cbt.length / 4
    const blocks = []
    for (let blockId = 0; blockId < nbBlocks; blockId++) {
      const position = blockId * 4
      if (this.#cbt.readUInt32BE(position) !== 0) {
        blocks.push(blockId)
      }
    }
    return blocks
  }
  async *buildDiskBlockGenerator(): AsyncGenerator<DiskBlock> {
    for (const index of this.getBlockIndexes()) {
      const data = await this.#nbdClient.readBlock(index, this.blockSize)
      yield { index, data }
    }
  }

  async close() {
    await this.#nbdClient.disconnect()
  }
  isDifferencing(): boolean {
    return true
  }
  openParent(): Promise<PortableDisk> {
    throw new Error('Method not implemented.')
  }
  hasBlock(index: number): boolean {
    // block are aligned, we could probably compare the bytes to 255
    // each CBT block is 64KB
    // each VHD block is 2MB
    // => 32 CBT blocks per VHD block
    // each CBT block used flag is stored in 1 bit
    // => 4 bytes per VHD block => UINT32
    // if any sublock is used => download the full block
    const position = index * 4
    return this.#cbt.readUInt32BE(position) !== 0
  }
}
