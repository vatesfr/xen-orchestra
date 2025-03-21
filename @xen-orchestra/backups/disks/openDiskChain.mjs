// @ts-check
/**
 *
 * @typedef {import('../../disk-transform/src/FileAccessor.mjs').FileAccessor} FileAccessor
 */
import { DiskChain } from '@xen-orchestra/disk-transform'
import { RemoteVhd } from './RemoteVhd.mjs'

import { defer } from 'golike-defer'
/**
 * @param {Object} params
 * @param {FileAccessor} params.handler
 * @param {string} params.path
 * @param {string | undefined} params.until
 */
async function _openDiskChain($defer, { handler, path, until }) {
  let disk
  const disks = []
  $defer.onFailure(() => Promise.all(disks.map(disk => disk.close())))
  disk = new RemoteVhd({ handler, path })

  await disk.init()
  disks.push(disk)
  while (disk.isDifferencing()) {
    disk = await disk.openParent()
    if (disk.path === until) {
      break
    }
    disks.unshift(disk)
  }
  // the root disk
  return new DiskChain({ disks })
}

export const openDiskChain = defer(_openDiskChain)
