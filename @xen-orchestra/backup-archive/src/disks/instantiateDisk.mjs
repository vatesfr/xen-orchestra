// @ts-check
/**
 * @typedef {import('@xen-orchestra/fs').RemoteHandlerAbstract} RemoteHandlerAbstract
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 */
import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'
// eslint rule off for src/**/*.mjs already
import { HashedDiskDeduplicated } from './hashed/HashedDiskDeduplicated.mjs'

const DISK_EXTENSIONS = ['.vhd', '.hbd']

export function isDisk(path) {
  return DISK_EXTENSIONS.some(ext => path.endsWith(ext))
}

/**
 * The disk format is chosen by the file extension, never by the remote config
 * @param {RemoteHandlerAbstract} handler
 * @param {string} path
 * @returns {RemoteDisk}
 */
export function instantiateDisk(handler, path) {
  return path.endsWith('.hbd') ? new HashedDiskDeduplicated({ handler, path }) : new RemoteVhdDisk({ handler, path })
}
