// @ts-check

/**
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 * @typedef {import('@xen-orchestra/disk-transform').Disk} Disk
 */

import { BaseVhd, FULL_BLOCK_BITMAP } from './BaseVhd.mjs'
import { dirname } from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import { asyncEach } from '@vates/async-each'
import { VhdDirectory, VhdAbstract } from 'vhd-lib'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { DEFAULT_BLOCK_SIZE } from '../_constants.js'

/**
 * @typedef {Object} VhdRemoteTarget
 * @property {FileAccessor} handler
 * @property {string} path
 * @property {string} compression
 * @property {number} concurrency
 * @property {string} flags
 * @property {(path: string) => Promise<void>} validator
 */

/**
 * @extends {BaseVhd}
 */
export class DiskConsumerVhdDirectory extends BaseVhd {
  /** @type {VhdRemoteTarget} */
  #target

  /**
   * @param {Disk} source
   * @param {VhdRemoteTarget} target
   */
  constructor(source, target) {
    super(source)
    this.#target = target
  }

  /**
   * @returns {Promise<void>}
   */
  async write() {
    const { handler, path, compression, flags, validator, concurrency } = this.#target
    const dataPath = `${dirname(path)}/data/${uuidv4()}.vhd`
    const uid = 'to stream ' + Math.random()
    let generator
    try {
      generator = this.source.diskBlocks(uid)
      await handler.mktree(dataPath)
      const vhd = new VhdDirectory(handler, dataPath, { flags, compression })
      vhd.footer = unpackFooter(this.computeVhdFooter())
      vhd.header = unpackHeader(this.computeVhdHeader())
      /**
       * @type {import('@xen-orchestra/disk-transform').DiskBlock | null}
       */
      let truncatedBlock = null
      const EXPECTED_FULL_BUFFER_SIZE = DEFAULT_BLOCK_SIZE + FULL_BLOCK_BITMAP.length
      await asyncEach(
        generator,
        async ({ index, data }) => {
          if (truncatedBlock !== null) {
            throw new Error(
              `Expecting a ${DEFAULT_BLOCK_SIZE} bytes block, got a ${truncatedBlock.data.length}, for index ${truncatedBlock.index}`
            )
          }
          if (data.length < DEFAULT_BLOCK_SIZE) {
            truncatedBlock = { data, index }
          }
          await vhd.writeEntireBlock({
            id: index,
            buffer: Buffer.concat([FULL_BLOCK_BITMAP, data], EXPECTED_FULL_BUFFER_SIZE),
          })
        },
        { concurrency }
      )
      await Promise.all([vhd.writeFooter(), vhd.writeHeader(), vhd.writeBlockAllocationTable()])
      await validator(dataPath)
      await VhdAbstract.createAlias(handler, path, dataPath)
    } catch (err) {
      await this.source.close().catch(() => {}) // close this disk in error
      await handler.rmtree(dataPath).catch(() => {}) // data
      await handler.unlink(path).catch(() => {}) // alias
      throw err
    }
  }
}
