// checks that a discarded disk produces a valid empty VHD in both modes and reports the bytes read
import { getHandler } from '@xen-orchestra/fs'
import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
import { rm } from 'node:fs/promises'
const { RemoteAdapter } = await import('../RemoteAdapter.mjs')
const BLOCK = 2 << 20
class Mem extends RandomAccessDisk {
  async init() {}
  async close() {}
  getVirtualSize() { return 64 * BLOCK }
  getBlockSize() { return BLOCK }
  getBlockIndexes() { return [0, 3, 7, 8] }
  hasBlock(i) { return [0, 3, 7, 8].includes(i) }
  isDifferencing() { return false }
  async readBlock(index) { return { index, data: Buffer.alloc(BLOCK, index) } }
}
for (const mode of ['block', 'file']) {
  const dir = '/data/bench/discard-' + mode
  await rm(dir, { recursive: true, force: true })
  const handler = getHandler({ url: 'file://' + dir, useVhdDirectory: mode === 'block' ? 'true' : undefined })
  await handler.sync()
  const adapter = new RemoteAdapter(handler, { dirMode: 0o700 })
  const path = mode === 'block' ? 'vm/disk.alias.vhd' : 'vm/disk.vhd'
  const size = await adapter.writeVhd(path, new Mem(), { validator: async () => {} })
  const { openVhd } = await import('vhd-lib')
  const { Disposable } = await import('promise-toolbox')
  await Disposable.use(openVhd(handler, path), async vhd => {
    await vhd.readBlockAllocationTable()
    let present = 0
    for (let i = 0; i < 64; i++) if (vhd.containsBlock(i)) present++
    console.log(JSON.stringify({ mode, useVhdDirectory: adapter.useVhdDirectory(), reportedSize: size, expected: 4 * BLOCK, blocksInVhd: present }))
  })
  await handler.forget()
}
