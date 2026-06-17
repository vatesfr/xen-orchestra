// @ts-check

import { DiskConsumerVhdStream } from './DiskConsumerVhdStream.mjs'
import { DiskConsumerVhdDirectory } from './DiskConsumerVhdDirectory.mjs'
import { DiskConsumerRawStream } from './DiskConsumerRawStream.mjs'

/**
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 * @typedef {import('@xen-orchestra/disk-transform').Disk} Disk
 * @typedef {import('node:stream').Readable} Readable
 * @typedef {import('@xen-orchestra/fs').RemoteHandlerAbstract} RemoteHandlerAbstract
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

/**
 * @param {Disk} disk
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Readable>}
 */
export async function toRawStream(disk, { signal } = {}) {
  const consumer = new DiskConsumerRawStream(disk)
  return consumer.toStream(signal)
}

/**
 * Writes disk blocks to `path` using sparse pre-allocation and concurrent pwrite.
 * Significantly faster than toRawStream() for sparse disks: only present blocks
 * cross the wire; gaps remain as sparse holes.
 *
 * @param {Disk} disk
 * @param {{ handler: RemoteHandlerAbstract, path: string, concurrency?: number }} target
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<number>} allocated file size in bytes
 */
export async function writeRaw(disk, { handler, path, concurrency = 4 }, { signal } = {}) {
  const consumer = new DiskConsumerRawStream(disk)
  return consumer.writeConcurrent({ handler, path, concurrency }, signal)
}

export { DiskConsumerRawStream } from './DiskConsumerRawStream.mjs'
