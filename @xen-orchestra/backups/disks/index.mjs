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
 *
 * @param {Object} params
 * @param {FileAccessor} params.handler
 * @param {string} params.path
 * @returns {Promise<Disposable<RemoteDisk>>}
 */
export async function openDisposableDisk({ handler, path }) {
  const disk = new RemoteVhdDisk({ handler, path })
  await disk.init()
  return {
    value: disk,
    dispose: () => disk.close(),
  }
}

const DISK_EXTENSIONS = ['.vhd']

/**
 * Returns true if the path points to a supported disk format.
 *
 * @param {FileAccessor} _handler - Remote file handler (reserved for future use)
 * @param {string} path - Path to check
 * @returns {boolean}
 */
export function isDisk(_handler, path) {
  return DISK_EXTENSIONS.some(ext => path.endsWith(ext))
}
