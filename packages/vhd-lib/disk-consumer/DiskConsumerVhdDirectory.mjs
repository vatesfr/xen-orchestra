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
    const uid = "to stream "+Math.random()
    const generator = this.source.diskBlocks(uid)
    try {
      await handler.mktree(dataPath)
      const vhd = new VhdDirectory(handler, dataPath, { flags, compression })
      vhd.footer = unpackFooter(this.computeVhdFooter())
      vhd.header = unpackHeader(this.computeVhdHeader())
      await asyncEach(
        generator,
        async ({ index, data }) => {
          await vhd.writeEntireBlock({ id: index, buffer: Buffer.concat([FULL_BLOCK_BITMAP, data]) })
        },
        { concurrency }
      )
      await Promise.all([vhd.writeFooter(), vhd.writeHeader(), vhd.writeBlockAllocationTable()])
      await validator(dataPath)
      await VhdAbstract.createAlias(handler, path, dataPath)
    } catch (err) {
      await handler.rmtree(dataPath).catch(() => {}) // data
      await handler.unlink(path).catch(() => {}) // alias
      throw err
    }
  }
}
