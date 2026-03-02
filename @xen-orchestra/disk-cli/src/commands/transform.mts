import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import type { RandomAccessDisk } from '@xen-orchestra/disk-transform'
import Disposable from 'promise-toolbox/Disposable'
import { getSyncedHandler, type RemoteHandler } from '@xen-orchestra/fs'
import { openDisk } from '@xen-orchestra/backups/disks/openDisk.mjs'
import { openDiskChain } from '@xen-orchestra/backups/disks/openDiskChain.mjs'
import { toVhdStream } from 'vhd-lib/disk-consumer/index.mjs'
import { toQcow2Stream } from '@xen-orchestra/qcow2'

type OutputFormat = 'raw' | 'vhd' | 'qcow2'
const OUTPUT_FORMATS: OutputFormat[] = ['raw', 'vhd', 'qcow2']

export async function* rawGenerator(disk: RandomAccessDisk): AsyncGenerator<Buffer> {
  const blockSize = disk.getBlockSize()
  const virtualSize = disk.getVirtualSize()
  // DiskChain has no getMaxBlockCount(); derive it from virtualSize
  const maxBlockCount = Math.ceil(virtualSize / blockSize)
  const lastBlockSize = virtualSize % blockSize || blockSize

  for (let i = 0; i < maxBlockCount; i++) {
    const size = i === maxBlockCount - 1 ? lastBlockSize : blockSize
    if (disk.hasBlock(i)) {
      const { data } = await disk.readBlock(i)
      yield size < data.length ? data.subarray(0, size) : data
    } else {
      yield Buffer.alloc(size, 0)
    }
  }
}

// Returns a disposable for either a single disk or the full chain,
// depending on whether the leaf disk is differencing.
async function openDiskOrChain(handler: RemoteHandler, diskPath: string) {
  const { value: leafDisk, dispose: disposeLeaf } = await openDisk(handler, diskPath)
  await leafDisk.init()

  if (leafDisk.isDifferencing()) {
    await disposeLeaf()
    const chain = await openDiskChain({ handler, path: diskPath })
    return { value: chain, dispose: () => chain.close() }
  }

  return { value: leafDisk, dispose: disposeLeaf }
}

export async function transformCommand(handlerUrl: string, diskPath: string, extraArgs: string[]): Promise<void> {
  const format = extraArgs[0] as OutputFormat
  if (!format || !OUTPUT_FORMATS.includes(format)) {
    console.error(`Error: output format must be one of: ${OUTPUT_FORMATS.join(', ')}`)
    process.exit(1)
  }

  await Disposable.use(getSyncedHandler({ url: handlerUrl }), async handler => {
    await Disposable.use(openDiskOrChain(handler, diskPath), async disk => {
      let stream: Readable

      if (format === 'raw') {
        stream = Readable.from(rawGenerator(disk), { objectMode: false })
      } else if (format === 'vhd') {
        stream = await toVhdStream(disk)
      } else {
        stream = toQcow2Stream(disk)
      }

      await pipeline(stream, process.stdout, { end: false })
    })
  })
}
