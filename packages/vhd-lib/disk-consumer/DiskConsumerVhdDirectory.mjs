// @ts-check

/**
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 * @typedef {import('@xen-orchestra/disk-transform').Disk} Disk
 */

import { BaseVhd, FULL_BLOCK_BITMAP } from './BaseVhd.mjs'
import { basename, dirname } from 'node:path'
import { asyncEach } from '@vates/async-each'
import { VhdDirectory, VhdAbstract } from 'vhd-lib'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { DEFAULT_BLOCK_SIZE } from '../_constants.js'
import assert from 'node:assert'
import { createLogger } from '@xen-orchestra/log'

// [CHAIN-DEBUG] temporary: diagnose why the footer uuid isn't persisted on immutable remotes.
// If NONE of these lines appear in the logs, the deployed vhd-lib is stale (pre-fix copy).
const { warn } = createLogger('xo:vhd-lib:disk-consumer')

/**
 * @typedef {Object} VhdRemoteTarget
 * @property {FileAccessor} handler
 * @property {string} path
 * @property {string} compression
 * @property {number} concurrency
 * @property {string} flags
 * @property {Buffer?} uuid
 * @property {Buffer?} parentUuid
 * @property {string?} parentPath
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
   * @param {AbortSignal} [signal]
   * @returns {Promise<number>}
   */
  async write(signal) {
    const { handler, path, compression, flags, validator, concurrency, uuid, parentUuid, parentPath } = this.#target
    // [CHAIN-DEBUG] probe 1: proves the fixed vhd-lib is actually running, and whether uuid arrived.
    // Absent from logs => deployed vhd-lib is the pre-fix copy (half-deploy).
    warn('[CHAIN-DEBUG] disk-consumer.write: received target', {
      path,
      hasUuid: uuid !== undefined,
      uuid: uuid?.toString('hex'),
      parentUuid: parentUuid?.toString('hex'),
      parentPath,
    })
    const SUFFIX = '.alias.vhd'
    assert.ok(path.endsWith(SUFFIX), `filename must be an alias , got ${path}`)
    const base = basename(path).slice(0, -SUFFIX.length)
    const dataPath = `${dirname(path)}/data/${base}.vhd`
    const uid = 'to stream ' + Math.random()
    let generator
    try {
      signal?.throwIfAborted()
      generator = this.source.diskBlocks(uid)
      await handler.mktree(dataPath)
      const vhd = new VhdDirectory(handler, dataPath, { flags, compression })
      vhd.footer = unpackFooter(this.computeVhdFooter())
      if (uuid) {
        vhd.footer.uuid = uuid
      }
      vhd.header = unpackHeader(this.computeVhdHeader())
      if (parentUuid) {
        vhd.header.parentUuid = parentUuid
      }
      if (parentPath) {
        vhd.header.parentUnicodeName = parentPath
      }
      // [CHAIN-DEBUG] probe 2: the in-memory footer/header right before the single write.
      warn('[CHAIN-DEBUG] disk-consumer.write: in-memory footer/header before write', {
        dataPath,
        footerUuid: vhd.footer.uuid?.toString('hex'),
        footerDiskType: vhd.footer.diskType,
        headerParentUuid: vhd.header.parentUuid?.toString('hex'),
        headerParentName: vhd.header.parentUnicodeName,
      })
      /**
       * @type {import('@xen-orchestra/disk-transform').DiskBlock | null}
       */
      let truncatedBlock = null
      const EXPECTED_FULL_BUFFER_SIZE = DEFAULT_BLOCK_SIZE + FULL_BLOCK_BITMAP.length
      await asyncEach(
        generator,
        async ({ index, data }) => {
          signal?.throwIfAborted()
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
      // [CHAIN-DEBUG] probe 3 (decisive): re-read the footer/header straight back from the remote —
      // the exact bytes isMergeableParent will read on the next backup. If persistedFooterUuid differs
      // from probe 2's footerUuid, the write did NOT persist the uuid on this remote (object-lock write bug).
      try {
        const check = new VhdDirectory(handler, dataPath, { flags: 'r' })
        await check.readHeaderAndFooter()
        warn('[CHAIN-DEBUG] disk-consumer.write: persisted footer/header re-read after write', {
          dataPath,
          persistedFooterUuid: check.footer.uuid?.toString('hex'),
          persistedParentUuid: check.header.parentUuid?.toString('hex'),
          persistedParentName: check.header.parentUnicodeName,
        })
      } catch (error) {
        warn('[CHAIN-DEBUG] disk-consumer.write: persisted footer/header re-read FAILED', { dataPath, error })
      }
      // this will return VHD metadata size + block size, even for disk bigger than bigger than 2TB
      return vhd.streamSize()
    } catch (err) {
      await this.source.close().catch(() => {}) // close this disk in error
      await handler.rmtree(dataPath).catch(() => {}) // data
      await handler.unlink(path).catch(() => {}) // alias
      throw err
    }
  }
}
