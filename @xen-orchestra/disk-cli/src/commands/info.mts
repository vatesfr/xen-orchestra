import Disposable from 'promise-toolbox/Disposable'
import { getSyncedHandler, type RemoteHandler } from '@xen-orchestra/fs'
import { openDisposableDisk, openDiskChain, RemoteDisk, DiskDisposable } from '@xen-orchestra/backup-archive/disks'
import { formatBytes } from '../utils.mjs'

function printDiskInfo(label: string, disk: RemoteDisk): void {
  const isDifferencing = disk.isDifferencing()
  const virtualSize = disk.getVirtualSize()
  const blockSize = disk.getBlockSize()
  const uid = disk.getUuid()
  const parentUid = isDifferencing ? disk.getParentUuid() : null

  console.log(`Disk info: ${label}`)
  console.log(`  UID:          ${uid}`)
  console.log(`  Parent UID:   ${parentUid ?? '(none)'}`)
  console.log(`  Virtual size: ${formatBytes(virtualSize)} (${virtualSize} bytes)`)
  console.log(`  Block size:   ${formatBytes(blockSize)} (${blockSize} bytes)`)
}

// Opens the full chain (root → leaf) as a disposable, reusing the same chain
// walker as the `transform` command.
async function openDisposableChain(handler: RemoteHandler, path: string): Promise<DiskDisposable> {
  const chain = await openDiskChain({ handler, path })
  return { value: chain, dispose: () => chain.close() }
}

export async function infoCommand(handlerUrl: string, diskPath: string, extraArgs: string[]): Promise<void> {
  const showChain = extraArgs.includes('--chain')

  await Disposable.use(getSyncedHandler({ url: handlerUrl }), async handler => {
    if (!showChain) {
      await Disposable.use(openDisposableDisk({ handler, path: diskPath }), (disk: RemoteDisk) => {
        printDiskInfo(diskPath, disk)
      })
      return
    }

    // Resolve the full lineage first; the chain is only used to enumerate the
    // paths, so it is closed before re-opening each disk to print its details.
    const paths = await Disposable.use(openDisposableChain(handler, diskPath), chain => chain.getPaths())

    console.log(`Disk chain: ${diskPath} (${paths.length} disk${paths.length === 1 ? '' : 's'}, root → leaf)\n`)

    for (const [index, path] of paths.entries()) {
      await Disposable.use(openDisposableDisk({ handler, path }), (disk: RemoteDisk) => {
        printDiskInfo(path, disk)
      })
      if (index < paths.length - 1) {
        console.log()
      }
    }
  })
}
