// @ts-check
/**
 *
 * @typedef {import('@xen-orchestra/fs').RemoteHandlerAbstract} RemoteHandlerAbstract
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 */
import { defer } from 'golike-defer'
import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'
import { RemoteVhdDiskChain } from './RemoteVhdDiskChain.mjs'
import { HashedDiskDeduplicated } from './hashed/HashedDiskDeduplicated.mjs'
import { HashedDiskChain } from './hashed/HashedDiskChain.mjs'
import { instantiateDisk } from './instantiateDisk.mjs'

/**
 * The chain class of the disks' format: a chain never mixes formats
 * @param {string} path
 * @param {RemoteDisk[]} disks
 * @returns {RemoteDisk}
 */
function newChain(path, disks) {
  if (disks.every(disk => disk instanceof HashedDiskDeduplicated)) {
    return new HashedDiskChain({ disks })
  }
  if (disks.every(disk => disk instanceof RemoteVhdDisk)) {
    return new RemoteVhdDiskChain({ disks })
  }
  throw new Error(`mixed disk formats in chain ${path}`)
}

/**
 * @param {any} $defer
 * @param {Object} params
 * @param {RemoteHandlerAbstract} params.handler
 * @param {string} params.path
 * @param {string | undefined} params.until
 * @param {boolean} [params.force]
 * @param {boolean} [params.ignoreBlockIndexes] - skip reading the block allocation table of each disk (cheaper, but blocks can't be read)
 * @returns {Promise<RemoteDisk>}
 */
async function _openDiskChain($defer, { handler, path, until, force = false, ignoreBlockIndexes = false }) {
  /**
   * @type {RemoteDisk}
   */
  let disk
  /**
   * @type {Array<RemoteDisk>}
   */
  const disks = []
  $defer.onFailure(() => Promise.all(disks.map(disk => disk.close())))
  disk = instantiateDisk(handler, path)

  await disk.init({ force, ignoreBlockIndexes })
  disks.push(disk)
  let foundRootDisk = until === undefined
  while (disk.isDifferencing()) {
    if (disk.getParentPath() === until) {
      foundRootDisk = true
      break
    }
    // Instantiate + init the parent directly (instead of openParent()) so the
    // block allocation table read can be skipped when ignoreBlockIndexes is set.
    disk = disk.instantiateParent()
    await disk.init({ force, ignoreBlockIndexes })
    disks.unshift(disk)
  }
  if (!foundRootDisk) {
    throw new Error(`trying to open chain from ${path} to ${until}, root disk not found`)
  }
  return newChain(path, disks)
}

/**
 * @type {(params: { handler: RemoteHandlerAbstract, path: string, until?: string, force?: boolean, ignoreBlockIndexes?: boolean }) => Promise<RemoteDisk>}
 */
export const openDiskChain = defer(_openDiskChain)
