import Disposable from 'promise-toolbox/Disposable'
import { getSyncedHandler, type RemoteHandler } from '@xen-orchestra/fs'
import { openDisposableDisk, openDiskChain, RemoteDisk, DiskDisposable } from '@xen-orchestra/backup-archive/disks'
import { formatBytes } from '../utils.mjs'

type DiskInfoLine = {
  path: string
  uid: string
  parentUid: string | null
  virtualSize: number
  blockSize: number
  // Only computed with --size; requires reading the block allocation table.
  sizeOnDisk?: number
}

function readDiskInfo(disk: RemoteDisk, path: string, showSize: boolean): DiskInfoLine {
  const isDifferencing = disk.isDifferencing()
  return {
    path,
    uid: disk.getUuid(),
    parentUid: isDifferencing ? disk.getParentUuid() : null,
    virtualSize: disk.getVirtualSize(),
    blockSize: disk.getBlockSize(),
    sizeOnDisk: showSize ? disk.getSizeOnDisk() : undefined,
  }
}

function printDiskInfo(info: DiskInfoLine): void {
  console.log(`Disk info: ${info.path}`)
  console.log(`  UID:          ${info.uid}`)
  console.log(`  Parent UID:   ${info.parentUid ?? '(none)'}`)
  console.log(`  Virtual size: ${formatBytes(info.virtualSize)} (${info.virtualSize} bytes)`)
  console.log(`  Block size:   ${formatBytes(info.blockSize)} (${info.blockSize} bytes)`)
  if (info.sizeOnDisk !== undefined) {
    console.log(`  Size on disk: ${formatBytes(info.sizeOnDisk)} (${info.sizeOnDisk} bytes)`)
  }
}

// Opens the full chain (root → leaf) as a disposable, reusing the same chain
// walker as the `transform` command.
async function openDisposableChain(
  handler: RemoteHandler,
  path: string,
  ignoreBlockIndexes: boolean
): Promise<DiskDisposable> {
  const chain = await openDiskChain({ handler, path, ignoreBlockIndexes })
  return { value: chain, dispose: () => chain.close() }
}

export async function infoCommand(handlerUrl: string, diskPath: string, extraArgs: string[]): Promise<void> {
  const showChain = extraArgs.includes('--chain')
  const showSize = extraArgs.includes('--size')
  // Reading the block allocation table is costly, so only do it when the size on
  // disk is requested; every other field comes from the footer/header.
  const ignoreBlockIndexes = !showSize

  await Disposable.use(getSyncedHandler({ url: handlerUrl }), async handler => {
    if (!showChain) {
      const info = await Disposable.use(
        openDisposableDisk({ handler, path: diskPath, ignoreBlockIndexes }),
        (disk: RemoteDisk) => readDiskInfo(disk, diskPath, showSize)
      )
      printDiskInfo(info)
      return
    }

    // Resolve the full lineage (root → leaf), then print each disk's info.
    const paths = await Disposable.use(openDisposableChain(handler, diskPath, ignoreBlockIndexes), chain =>
      chain.getPaths()
    )

    console.log(`Disk chain: ${diskPath} (${paths.length} disk${paths.length === 1 ? '' : 's'}, root → leaf)\n`)

    for (const [index, path] of paths.entries()) {
      const info = await Disposable.use(openDisposableDisk({ handler, path, ignoreBlockIndexes }), (disk: RemoteDisk) =>
        readDiskInfo(disk, path, showSize)
      )
      printDiskInfo(info)
      if (index < paths.length - 1) {
        console.log()
      }
    }
  })
}
