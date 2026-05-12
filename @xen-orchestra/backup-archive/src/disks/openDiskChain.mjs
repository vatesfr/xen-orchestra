// @ts-check
/**
 *
 * @typedef {import('@xen-orchestra/fs').RemoteHandlerAbstract} RemoteHandlerAbstract
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 */
import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'
import { defer } from 'golike-defer'
import { RemoteVhdDiskChain } from './RemoteVhdDiskChain.mjs'

/**
 * @param {any} $defer
 * @param {Object} params
 * @param {RemoteHandlerAbstract} params.handler
 * @param {string} params.path
 * @param {string | undefined} params.until
 * @param {boolean} [params.force]
 * @returns {Promise<RemoteDisk>}
 */
async function _openDiskChain($defer, { handler, path, until, force = false }) {
  /**
   * @type {RemoteVhdDisk}
   */
  let disk
  /**
   * @type {Array<RemoteVhdDisk>}
   */
  const disks = []
  $defer.onFailure(() => Promise.all(disks.map(disk => disk.close())))
  disk = new RemoteVhdDisk({ handler, path })

  await disk.init({ force })
  disks.push(disk)
  let foundRootDisk = until === undefined
  while (disk.isDifferencing()) {
    disk = await disk.openParent()
    if (disk.getPath() === until) {
      foundRootDisk = true
      await disk.close()
      break
    }
    disks.unshift(disk)
  }
  if (!foundRootDisk) {
    throw new Error(`trying to open chain from ${path} to  ${until}, root disk not found`)
  }
  // the root disk
  return new RemoteVhdDiskChain({ handler, disks })
}

/**
 * @type {(params: { handler: RemoteHandlerAbstract, path: string, until?: string, force?: boolean }) => Promise<RemoteDisk>}
 */
export const openDiskChain = defer(_openDiskChain)
