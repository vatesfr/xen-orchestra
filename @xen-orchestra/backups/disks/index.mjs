import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'
import { RemoteVhdDiskChain } from './RemoteVhdDiskChain.mjs'

export { RemoteDisk } from './RemoteDisk.mjs'
export { openDiskChain } from './openDiskChain.mjs'
export { MergeRemoteDisk } from './MergeRemoteDisk.mjs'

/**
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 * @typedef {import('./MergeRemoteDisk.mjs').MergeState} MergeState
 */

/**
 * @param {Object} params
 * @param {FileAccessor} params.handler
 * @param {string} params.path
 * @param {boolean} [params.force]
 * @param {boolean} [params.ignoreBlockIndexes]
 * @returns {Promise<RemoteDisk>}
 */
export async function openDisk({ handler, path, force = false, ignoreBlockIndexes = false }) {
  const disk = new RemoteVhdDisk({ handler, path })
  if (ignoreBlockIndexes) {
    // Best-effort init: return the disk even if init fails so that callers
    // can still use operations that work without a fully-opened VHD (e.g. unlink, checkAlias).
    await disk.init({ force, ignoreBlockIndexes }).catch(() => {})
  } else {
    await disk.init({ force })
  }
  return disk
}

/**
 * Opens one or more disk paths as a single RemoteDisk (or RemoteVhdDiskChain for multiple paths).
 * Use this when merging a chain: pass the child paths as an array; the chain is opened in order
 * from oldest to newest (same order expected by RemoteVhdDiskChain).
 *
 * @param {Object} params
 * @param {FileAccessor} params.handler
 * @param {string[]} params.paths
 * @param {boolean} [params.force]
 * @returns {Promise<RemoteDisk>}
 */
export async function openDiskChainFromPaths({ handler, paths, force = false }) {
  if (paths.length === 1) {
    return openDisk({ handler, path: paths[0], force })
  }
  const disks = paths.map(path => new RemoteVhdDisk({ handler, path }))
  const chain = new RemoteVhdDiskChain({ disks })
  await chain.init({ force })
  return chain
}
