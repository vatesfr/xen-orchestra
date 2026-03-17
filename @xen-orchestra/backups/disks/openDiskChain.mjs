// @ts-check
/**
 *
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 */
import { DiskChain } from '@xen-orchestra/disk-transform'
import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'

import { defer } from 'golike-defer'
/**
 * @param {any} $defer
 * @param {Object} params
 * @param {FileAccessor} params.handler
 * @param {string} params.path
 * @param {string | undefined} params.until
 * @param {boolean} [params.force]
 */
async function _openDiskChain($defer, { handler, path, until, force = false }) {
  let disk
  /**
   * @type {Array<RemoteDisk>}
   */
  const disks = []
  $defer.onFailure(() => Promise.all(disks.map(disk => disk.close())))
  disk = new RemoteVhdDisk({ handler, path })

  await disk.init({ force })
  disks.push(disk)
  while (disk.isDifferencing()) {
    disk = await disk.openParent()
    if (disk.getPath() === until) {
      break
    }
    disks.unshift(disk)
  }
  // the root disk
  return new DiskChain({ disks })
}

/**
 * @type {(params: { handler: FileAccessor, path: string, until?: string, force?: boolean }) => Promise<DiskChain>}
 */
export const openDiskChain = defer(_openDiskChain)
