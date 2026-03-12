// @ts-check

/**
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 * @typedef {import('@xen-orchestra/disk-transform/src/FileAccessor.mts').FileAccessor} FileAccessor
 */

import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'

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

/**
 * Opens a disk from a backup repository.
 *
 * Returns a disposable-compatible object: { value, dispose }
 *   - value: the opened RemoteVhdDisk
 *   - dispose: async function that closes the disk
 *
 * @param {FileAccessor} handler - Remote file handler (from @xen-orchestra/fs)
 * @param {string} path - Path to the disk in the backup repository
 * @param {Object} [options]
 * @param {string} [options.flags='r'] - Access flags (reserved for future use)
 * @returns {Promise<{value: RemoteDisk, dispose: () => Promise<void>}>}
 */
export async function openDisk(handler, path, { flags: _flags = 'r' } = {}) {
  const disk = new RemoteVhdDisk({ handler, path })
  await disk.init()
  return {
    value: disk,
    dispose: () => disk.close(),
  }
}
