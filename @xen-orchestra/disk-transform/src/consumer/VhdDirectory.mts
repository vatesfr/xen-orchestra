import type { DiskBlock, Disk } from '../Disk.mjs'
import { BaseVhd, FULL_BLOCK_BITMAP } from './BaseVhd.mjs'
import { dirname } from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import { asyncEach } from '@vates/async-each'
import { VhdDirectory, VhdAbstract } from 'vhd-lib'
import type { FileAccessor } from '../FileAccessor.mjs'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'

type VhdRemoteTarget = {
  handler: FileAccessor
  path: string
  compression: string
  concurrency: number
  flags: string
  validator: (path: string) => Promise<void>
}
export class VhdDirectoryRemote extends BaseVhd {
  #target: VhdRemoteTarget
  constructor(source: Disk, target: VhdRemoteTarget) {
    super(source)
    this.#target = target
  }
  async write() {
    console.log('WILL WRITE VHDD ')
    const { handler, path, compression, flags, validator, concurrency } = this.#target
    const dataPath = `${dirname(path)}/data/${uuidv4()}.vhd`
    try {
      await handler.mktree(dataPath)
      const vhd = new VhdDirectory(handler, dataPath, { flags, compression })
      vhd.footer = unpackFooter(this.computeVhdFooter())
      vhd.header = unpackHeader(this.computeVhdHeader())
      await asyncEach(
        this.source.diskBlocks(),
        async ({ index, data }) => {
          await vhd.writeEntireBlock({ id: index, buffer: Buffer.concat([FULL_BLOCK_BITMAP, data]) })
        },
        { concurrency }
      )
      console.log('BLOCK WRITTEN ')
      await Promise.all([vhd.writeFooter(), vhd.writeHeader(), vhd.writeBlockAllocationTable()])
      console.log('HEADER WRITTEN ')
      await validator(dataPath)
      console.log('VALIDATOR DONE ')
      await VhdAbstract.createAlias(handler, path, dataPath)
      console.log('ALIAS CREATED')
    } catch (err) {
      console.log('error in write', err)
      await handler.unlink(dataPath).catch(() => {})
      throw err
    }
  }
}
