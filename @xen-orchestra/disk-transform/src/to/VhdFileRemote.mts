import { VhdFile } from 'vhd-lib'
import { DiskBlockGenerator, PortableDifferencingDisk } from '../PortableDifferencingDisk.mjs'
import { Disposable } from 'promise-toolbox'
import { Vhd } from '../from/VhdRemote.mjs'

async function writeVhdToRemote(targetVhd: Vhd, disk: PortableDifferencingDisk): Promise<void> {
  return Disposable.use(disk.getBlockIterator(), async (blockIterator: DiskBlockGenerator): Promise<void> => {
    // @todo : create header/footer from size/label/parent
    const metada = await disk.getMetadata()
    const bitmap = Buffer.alloc(255, 512)
    for await (const block of blockIterator) {
      await targetVhd.writeEntireBlock({
        id: block.index,
        bitmap,
        data: block.data,
        buffer: Buffer.concat([bitmap, block.data]),
      })
    }
    await targetVhd.writeHeaderAndFooter()
    await targetVhd.writeBlockAllocationTable()
  })
}

export async function writeVhdFileToRemote(remote, path: string, disk: PortableDifferencingDisk) {
  const handler = remote._handler
  return Disposable.use(VhdFile.create(handler, path), async (vhd: Vhd) => {
    // @todo : precompute target bat to ensure we can write the block without updating the bat at each block
    return writeVhdToRemote(vhd, disk)
  })
}

// @todo: vhddirectory
