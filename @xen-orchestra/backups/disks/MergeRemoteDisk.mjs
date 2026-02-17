// @ts-check

/**
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 */

import assert from 'assert'
import { createLogger } from '@xen-orchestra/log'

import { basename, dirname } from 'path'
import { asyncEach } from '@vates/async-each'

// @ts-ignore
const { warn } = createLogger('remote-disk:merge')

/**
 * @typedef {Object} MergeState
 * @property {{ uuid: string }} child
 * @property {{ uuid: string }} parent
 * @property {number} currentBlock
 * @property {number} mergedDataSize
 * @property {'mergeBlocks' | 'cleanup'} step
 * @property {number} diskSize
 */

export class MergeRemoteDisk {
  /**
   * @type {MergeState}
   */
  #state = {
    child: { uuid: '0' },
    parent: { uuid: '0' },
    currentBlock: 0,
    mergedDataSize: 0,
    step: 'mergeBlocks',
    diskSize: 0,
  }

  /**
   * @type {string}
   */
  #statePath = ''

  /**
   * @type {boolean}
   */
  #isResuming

  /**
   * @type {Logger | Function}
   */
  #logInfo

  /**
   * @type {number}
   */
  #mergeBlockConcurrency

  /**
   * @type {Function}
   */
  #onProgress

  /**
   * @type {boolean}
   */
  #removeUnused

  /**
   * @type {number}
   */
  #writeStateDelay

  /**
   * @type {number}
   */
  #lastStateWrittenAt

  /**
   * @type {FileAccessor}
   */
  #handler

  /**
   * @param {FileAccessor} handler
   * @param {Object} params
   * @param {Function} params.onProgress
   * @param {Logger | Function} params.logInfo
   * @param {boolean} params.removeUnused
   * @param {number} params.mergeBlockConcurrency
   * @param {number} params.writeStateDelay
   */
  constructor(
    handler,
    {
      onProgress = () => {},
      logInfo = () => {},
      removeUnused = false,
      mergeBlockConcurrency = 2,
      writeStateDelay = 10e3,
    }
  ) {
    this.#handler = handler
    this.#logInfo = logInfo
    this.#onProgress = onProgress
    this.#removeUnused = removeUnused
    this.#mergeBlockConcurrency = mergeBlockConcurrency
    this.#writeStateDelay = writeStateDelay

    this.#isResuming = false
    this.#lastStateWrittenAt = 0
  }

  /**
   * @param {RemoteDisk} parentDisk
   * @returns {Promise<boolean>} isResuming
   */
  async isResuming(parentDisk) {
    try {
      await this.#handler.readFile(
        dirname(parentDisk.getPath()) + '/.' + basename(parentDisk.getPath()) + '.merge.json'
      )
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * @param {RemoteDisk} parentDisk
   * @param {RemoteDisk} childDisk
   */
  async merge(parentDisk, childDisk) {
    this.#statePath = dirname(parentDisk.getPath()) + '/.' + basename(parentDisk.getPath()) + '.merge.json'

    try {
      const mergeStateContent = await this.#handler.readFile(this.#statePath)
      this.#state = JSON.parse(mergeStateContent)

      // work-around a bug introduce in 97d94b795
      //
      // currentBlock could be `null` due to the JSON.stringify of a `NaN` value
      if (this.#state?.currentBlock === null) this.#state.currentBlock = 0
      this.#isResuming = true
    } catch (error) {
      // @ts-ignore
      if (error.code !== 'ENOENT') {
        warn('problem while checking the merge state', { error })
      }
    }

    try {
      /* eslint-disable no-fallthrough */
      switch (this.#state?.step ?? 'mergeBlocks') {
        case 'mergeBlocks':
          await this.#step_mergeBlocks(parentDisk, childDisk)
        case 'cleanup':
          await this.#step_cleanup(parentDisk, childDisk)
          return this.#cleanup(parentDisk, childDisk, true)
        default:
          warn(`Step ${this.#state?.step} is unknown`, { state: this.#state })
      }
      /* eslint-enable no-fallthrough */
    } catch (error) {
      await this.#cleanup(parentDisk, childDisk, false)
      throw error
    }
  }

  async #writeState() {
    try {
      await this.#handler.writeFile(this.#statePath, JSON.stringify(this.#state), { flags: 'w' })
    } catch (err) {
      warn('failed to write merge state', { error: err })
    }
  }

  async #writeStateThrottled() {
    const now = Date.now()
    if (now - this.#lastStateWrittenAt > this.#writeStateDelay) {
      this.#lastStateWrittenAt = now
      await this.#writeState()
    }
  }

  /**
   * @param {RemoteDisk} parentDisk
   * @param {RemoteDisk} childDisk
   */
  async #step_mergeBlocks(parentDisk, childDisk) {
    const getMaxBlockCount = childDisk.getMaxBlockCount()

    if (this.#isResuming) {
      const alreadyMergedBlocks = []
      for (let blockId = 0; blockId < this.#state.currentBlock; blockId++) {
        if (childDisk.hasBlock(blockId)) {
          alreadyMergedBlocks.push(blockId)
        }
      }

      parentDisk.setAllocatedBlocks(alreadyMergedBlocks)
    } else {
      this.#state.child = { uuid: childDisk.getUuid() ?? 0 }
      this.#state.parent = { uuid: parentDisk.getUuid() ?? 0 }

      // Finds first allocated block for the 2 following loops
      while (this.#state.currentBlock < getMaxBlockCount && !childDisk.hasBlock(this.#state.currentBlock)) {
        ++this.#state.currentBlock
      }
      await this.#writeState()
    }

    await this.#mergeBlocks(parentDisk, childDisk)
    await parentDisk.flushMetadata(childDisk)
    await parentDisk.mergeMetadata(childDisk)
  }

  /**
   * @param {RemoteDisk} parentDisk
   * @param {RemoteDisk} childDisk
   */
  async #mergeBlocks(parentDisk, childDisk) {
    this.#mergeBlockConcurrency =
      (await parentDisk.canMergeConcurently()) && (await childDisk.canMergeConcurently())
        ? this.#mergeBlockConcurrency
        : 1

    const toMerge = []
    for (let block = this.#state.currentBlock; block < childDisk.getMaxBlockCount(); block++) {
      if (childDisk.hasBlock(block)) {
        toMerge.push(block)
      }
    }

    const nBlocks = toMerge.length
    this.#onProgress({ total: nBlocks, done: 0 })

    const merging = new Set()
    let counter = 0
    await asyncEach(
      toMerge,
      async blockId => {
        merging.add(blockId)

        const blockSize = await parentDisk.mergeBlock(childDisk, blockId, this.#isResuming)
        this.#state.mergedDataSize += blockSize

        this.#state.currentBlock = Math.min(...merging) - 1
        merging.delete(blockId)

        this.#onProgress({ total: nBlocks, done: counter + 1 })
        counter++
        await this.#writeStateThrottled()
      },
      { concurrency: this.#mergeBlockConcurrency }
    )

    await this.#writeState()

    this.#state.diskSize = childDisk.getSizeOnDisk()

    this.#onProgress({ total: nBlocks, done: nBlocks })
  }

  /**
   * @param {RemoteDisk} parentDisk
   * @param {RemoteDisk} childDisk
   */
  async #step_cleanup(parentDisk, childDisk) {
    assert.notEqual(this.#state, undefined)
    this.#state.step = 'cleanup'
    await this.#writeState()

    const mergeTargetPath = childDisk.getPath()

    // delete intermediate children if needed
    if (this.#removeUnused) {
      await childDisk.unlink()
    }

    try {
      await parentDisk.rename(mergeTargetPath)
    } catch (error) {
      // @ts-ignore
      if (error.code === 'ENOENT' && this.#isResuming) {
        // @ts-ignore
        this.#logInfo(`the parent disk was already renamed`, {
          parent: parentDisk.getPath(),
          mergeTarget: mergeTargetPath,
        })
      } else {
        throw error
      }
    }
  }

  /**
   * @param {RemoteDisk} parentDisk
   * @param {RemoteDisk} childDisk
   * @param {boolean} cleanStateFile
   *
   * @returns {Promise<{mergedDataSize: number, finalDiskSize: number}>} result
   */
  async #cleanup(parentDisk, childDisk, cleanStateFile) {
    const finalDiskSize = this.#state?.diskSize ?? 0
    const mergedDataSize = this.#state?.mergedDataSize ?? 0
    await parentDisk.close().catch(warn)
    await childDisk.close().catch(warn)

    if (cleanStateFile) {
      await this.#handler.unlink(this.#statePath).catch(warn)
    }

    return { mergedDataSize, finalDiskSize }
  }
}
