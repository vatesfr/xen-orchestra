import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'

export { RemoteDisk } from './RemoteDisk.mjs'
export { openDiskChain } from './openDiskChain.mjs'

/**
 * @typedef {import('../../disk-transform/src/FileAccessor.mjs').FileAccessor} FileAccessor
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 */

/**
 * @param {Object} params
 * @param {FileAccessor} params.handler
 * @param {string} params.path
 * @returns {Promise<RemoteDisk>}
 */
export async function openDisk({ handler, path }) {
  const disk = new RemoteVhdDisk({ handler, path })
  await disk.init()
  return disk
}
