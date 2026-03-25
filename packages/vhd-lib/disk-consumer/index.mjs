// @ts-check
/**
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 * @typedef {import('@xen-orchestra/disk-transform').Disk} Disk
 * @typedef {import('node:stream').Readable} Readable
 *
 * @typedef {Object} VhdRemoteTarget
 * @property {FileAccessor} handler
 * @property {string} path
 * @property {string} compression
 * @property {number} concurrency
 * @property {string} flags
 * @property {(path: string) => Promise<void>} validator
 *
 */

import { DiskConsumerVhdStream } from './DiskConsumerVhdStream.mjs'
import { DiskConsumerVhdDirectory } from './DiskConsumerVhdDirectory.mjs'

/**
 *
 * @param {Disk} disk
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Readable>}
 */
export async function toVhdStream(disk, { signal } = {}) {
  const consumer = new DiskConsumerVhdStream(disk)
  return consumer.toStream(signal)
}

/**
 *
 * @param {object} param
 * @param {Disk} param.disk
 * @param {VhdRemoteTarget} param.target
 * @param {AbortSignal} [param.signal]
 */
export async function writeToVhdDirectory({ disk, target, signal }) {
  const consumer = new DiskConsumerVhdDirectory(disk, target)
  return await consumer.write(signal)
}
