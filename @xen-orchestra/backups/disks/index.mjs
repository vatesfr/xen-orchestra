import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'

export { RemoteDisk } from './RemoteDisk.mjs'
export { openDiskChain } from './openDiskChain.mjs'
export { MergeRemoteDisk } from './MergeRemoteDisk.mjs'

/**
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 */

/**
 * @param {Object} params
 * @param {FileAccessor} params.handler
 * @param {string} params.path
 * @param {boolean} [params.force]
 * @returns {Promise<RemoteDisk>}
 */
export async function openDisk({ handler, path, force = false }) {
  const disk = new RemoteVhdDisk({ handler, path })
  await disk.init({ force })
  return disk
}

/**
 * @param {Object} params
 * @param {FileAccessor} params.handler
 * @param {string} params.path
 * @returns {RemoteDisk}
 */
export function instantiateDisk({ handler, path }) {
  return new RemoteVhdDisk({ handler, path })
}
