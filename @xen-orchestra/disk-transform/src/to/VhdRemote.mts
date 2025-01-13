import { VhdFile } from 'vhd-lib'
import { DiskBlockGenerator, PortableDifferencingDisk } from '../PortableDifferencingDisk.mts'
import { Disposable } from 'promise-toolbox'
import { type Vhd } from '../from/VhdRemote.mts'
import { type FileAccessor } from '../file-accessor/FileAccessor.mts'
import { createFooter, createHeader } from 'vhd-lib/_createFooterHeader.js'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { DISK_TYPES, FOOTER_SIZE } from 'vhd-lib/_constants.js'
import _computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import { asyncEach } from '@vates/async-each'

async function writeVhdToRemote(
  targetVhd: Vhd,
  disk: PortableDifferencingDisk,
  { writeBlockConcurrency = 0 } = {}
): Promise<void> {
  return Disposable.use(disk.getBlockIterator(), async (blockIterator: DiskBlockGenerator): Promise<void> => {
    // @todo : handle differencing disk parent

    const metada = await disk.getMetadata()
    console.log('metadata', { metada })
    targetVhd.footer = unpackFooter(
      // length can be smaller than disk capacity due to alignment to head/cylinder/sector
      createFooter(
        metada.virtualSize,
        Math.floor(Date.now() / 1000),
        _computeGeometryForSize(metada.virtualSize),
        FOOTER_SIZE,
        DISK_TYPES.DYNAMIC
      )
    )
    console.log('got footer ', targetVhd.footer, Math.ceil((metada.virtualSize / 2) * 1024 * 1024))
    targetVhd.header = unpackHeader(createHeader(Math.ceil(metada.virtualSize / (2 * 1024 * 1024))))
    const bitmap = Buffer.alloc(255, 512)

    await asyncEach(
      blockIterator,
      async block => {
        console.log('start', block.index)
        await targetVhd.writeEntireBlock({
          id: block.index,
          bitmap,
          data: block.data,
          buffer: Buffer.concat([bitmap, block.data]),
        })
        console.log('end', block.index)
        process.stdout.write('.')
      },
      {
        concurrency: writeBlockConcurrency,
      }
    )
    await targetVhd.writeFooter()
    await targetVhd.writeHeader()
    await targetVhd.writeBlockAllocationTable()
  })
}

export async function writeVhdFileToRemote(
  handler: FileAccessor,
  path: string,
  disk: PortableDifferencingDisk,
  { writeBlockConcurrency = 0, vhdClass = VhdFile } = {}
) {
  console.log('will write ', { disk, path })

  await Disposable.use(vhdClass.create(handler, path), async (vhd: Vhd) => {
    // @todo : precompute target bat to ensure we can write the block without updating the bat at each block
    return writeVhdToRemote(vhd, disk, { writeBlockConcurrency: 1 })
  })
  console.log('written')
}

// @todo: vhddirectory
