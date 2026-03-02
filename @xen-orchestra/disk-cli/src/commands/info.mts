import Disposable from 'promise-toolbox/Disposable'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { openDisk } from '@xen-orchestra/backups/disks/openDisk.mjs'
import { formatBytes } from '../utils.mjs'

export async function infoCommand(handlerUrl: string, diskPath: string, _extraArgs: string[]): Promise<void> {
  await Disposable.use(getSyncedHandler({ url: handlerUrl }), async handler => {
    await Disposable.use(openDisk(handler, diskPath), async disk => {
      const isDifferencing = disk.isDifferencing()
      const virtualSize = disk.getVirtualSize()
      const blockSize = disk.getBlockSize()
      const uid = disk.getUuid()
      const parentUid = isDifferencing ? disk.getParentUuid() : null

      console.log(`Disk info: ${diskPath}`)
      console.log(`  UID:          ${uid}`)
      console.log(`  Parent UID:   ${parentUid ?? '(none)'}`)
      console.log(`  Virtual size: ${formatBytes(virtualSize)} (${virtualSize} bytes)`)
      console.log(`  Block size:   ${formatBytes(blockSize)} (${blockSize} bytes)`)
    })
  })
}
