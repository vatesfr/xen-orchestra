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
 * @param {object} param
 * @param {Disk} param.disk
 * @returns {Promise<Readable>}
 */
export async function toVhdStream({ disk }) {
  const consumer = new DiskConsumerVhdStream(disk)
  return consumer.toStream()
}

/**
 *
 * @param {object} param
 * @param {Disk} param.disk
 * @param {VhdRemoteTarget} param.target
 */
export async function writeToVhdDirectory({ disk, target }) {
  const consumer = new DiskConsumerVhdDirectory(disk, target)
  await consumer.write()
}
