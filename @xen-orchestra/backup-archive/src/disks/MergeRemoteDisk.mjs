// @ts-check

/**
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 * @typedef {import('@xen-orchestra/fs').RemoteHandlerAbstract} RemoteHandlerAbstract
 */

import assert from 'assert'
import { createLogger } from '@xen-orchestra/log'

import { basename, dirname } from 'path'
import { asyncEach } from '@vates/async-each'
import { relativeFromFile, normalize, resolveFromFile } from '@xen-orchestra/fs/path'

// @ts-ignore
const { warn } = createLogger('remote-disk:merge')

/**
 * @typedef {Object} MergeState
 * @property {{ uuid?: string }} child
 * @property {{ uuid?: string }} parent
 * @property { string[]  | undefined} chain
 * @property {number} currentBlock
 * @property {number} mergedDataSize
 * @property {'mergeBlocks' | 'cleanup'} step
 * @property {number} diskSize
 * @typedef {(message: string, data?: Record<string, unknown>) => void} Logger
 */

export class MergeRemoteDisk {
  /**
   * @type {MergeState}
   */
  #state = {
    child: { uuid: '0' },
    parent: { uuid: '0' },
    chain: undefined,
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
   * @type {AbortSignal | undefined}
   */
  #signal

  /**
   * @type {number}
   */
  #lastStateWrittenAt

  /**
   * @type {RemoteHandlerAbstract}
   */
  #handler

  /**
   * @param {RemoteHandlerAbstract} handler
   * @param {Object} params
   * @param {Function} [params.onProgress]
   * @param {Logger | Function} [params.logInfo]
   * @param {boolean} [params.removeUnused]
   * @param {number} [params.mergeBlockConcurrency]
   * @param {number} [params.writeStateDelay]
   * @param {AbortSignal} [params.signal] stops the merge before it starts, or between two blocks when they are copied:
   *   its state is kept to be resumed. A merge that moves the blocks of the child (two VHD directories) is not stopped
   *   once started, since the child, which is the disk of a listed backup, cannot be read until the merge completes.
   */
  constructor(
    handler,
    {
      onProgress = () => {},
      logInfo = () => {},
      removeUnused = false,
      mergeBlockConcurrency = 2,
      writeStateDelay = 10e3,
      signal,
    }
  ) {
    this.#handler = handler
    this.#logInfo = logInfo
    this.#onProgress = onProgress
    this.#removeUnused = removeUnused
    this.#mergeBlockConcurrency = mergeBlockConcurrency
    this.#writeStateDelay = writeStateDelay
    this.#signal = signal

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

      // work-around to bugs introduced in 97d94b795 and 4e50858
      //
      // currentBlock could be `null` due to the JSON.stringify of a `NaN` value
      // could also be -1 due to being set as Math.min(...merging) - 1 if merging contains 0
      if (this.#state?.currentBlock === null || this.#state?.currentBlock < 0) this.#state.currentBlock = 0
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
          // nothing has changed yet. A merge of VHD directories resumed here has already moved blocks out of the child
          // (a crash): stopping it leaves the child as it was
          this.#signal?.throwIfAborted()
          await this.#step_mergeBlocks(parentDisk, childDisk)
        case 'cleanup':
          // never stopped here. Coming from `mergeBlocks`, the parent already carries the metadata, and the uuid, of
          // the child while the state still says `mergeBlocks`: the next clean would not resume such a merge but
          // remove the parent. Then this step removes the merged disks and renames the result, and stopping in
          // between would lose the chain.
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
    await parentDisk.resize(getMaxBlockCount)

    if (this.#isResuming) {
      const alreadyMergedBlocks = []
      for (let blockId = 0; blockId < this.#state.currentBlock; blockId++) {
        if (childDisk.hasBlock(blockId)) {
          alreadyMergedBlocks.push(blockId)
        }
      }

      parentDisk.setAllocatedBlocks(alreadyMergedBlocks)
    } else {
      this.#state.child = { uuid: childDisk.getUuid() ?? undefined }
      this.#state.parent = { uuid: parentDisk.getUuid() ?? undefined }
      this.#state.chain = [parentDisk.getPath(), ...childDisk.getPaths()].map(path =>
        relativeFromFile(this.#statePath, path)
      )

      // Finds first allocated block for the 2 following loops
      while (this.#state.currentBlock < getMaxBlockCount && !childDisk.hasBlock(this.#state.currentBlock)) {
        ++this.#state.currentBlock
      }
      await this.#writeState()
    }

    // once a block has been moved out of the child, the child cannot be read until the merge has completed: such a
    // merge is not stopped
    const isStoppable = !(await parentDisk.mergeMovesBlocks(childDisk))

    await this.#mergeBlocks(parentDisk, childDisk, isStoppable)
    // last point where the merge stops, before the metadata of the parent is written: the state, written by
    // #mergeBlocks(), holds the progress and the next merge resumes from it
    if (isStoppable) {
      this.#signal?.throwIfAborted()
    }
    await parentDisk.flushMetadata(childDisk)
    await parentDisk.mergeMetadata(childDisk)
    this.#state.diskSize = parentDisk.getSizeOnDisk()
  }

  /**
   * @param {RemoteDisk} parentDisk
   * @param {RemoteDisk} childDisk
   * @param {boolean} isStoppable whether the signal stops the merge between two blocks
   */
  async #mergeBlocks(parentDisk, childDisk, isStoppable) {
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
        // `asyncEach`'s own `signal` would reject before the blocks in flight have settled, and the state must be
        // written after them
        if (isStoppable && this.#signal?.aborted) {
          return
        }
        merging.add(blockId)

        const blockSize = await parentDisk.mergeBlock(childDisk, blockId, this.#isResuming)
        this.#state.mergedDataSize += blockSize

        this.#state.currentBlock = Math.max(0, Math.min(...merging) - 1)
        merging.delete(blockId)

        this.#onProgress({ total: nBlocks, done: counter + 1 })
        counter++
        await this.#writeStateThrottled()
      },
      { concurrency: this.#mergeBlockConcurrency }
    )

    await this.#writeState()

    // less than `nBlocks` when the merge has been stopped
    this.#onProgress({ total: nBlocks, done: counter })
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

  /**
   * Scans vdiDir files for interrupted merge state files and resolves their chains
   *
   * @param {RemoteHandlerAbstract} handler
   * @param {string} vdiDir
   * @param {string[]} files - all file paths in vdiDir (prependDir: true)
   * @param {Map<string, string>} uuidToPath - diskUuid: normalized disk path
   * @param {Map<string, string>} childOf - parentPath: child path (from disk headers)
   * @returns {Promise<Map<string, { stateFilePath: string, chain?: string[], step?: 'mergeBlocks' | 'cleanup' }>>}
   */
  static async findInterruptedMerges(handler, vdiDir, files, uuidToPath, childOf) {
    const STATE_FILE_RE = /^\.(.+)\.merge\.json$/
    const result = new Map()

    for (const filePath of files) {
      const match = STATE_FILE_RE.exec(basename(filePath))
      if (match === null) continue

      const parentPath = normalize(vdiDir + '/' + match[1])
      let chain
      let step
      try {
        const state = JSON.parse(await handler.readFile(filePath))
        // disks are only removed during the cleanup step, so the caller needs the step to tell
        // an expected gap in the chain from a lineage that lost data
        step = state?.step ?? 'mergeBlocks'
        if (Array.isArray(state?.chain)) {
          chain = state.chain.map((/** @type {string} */ relPath) => normalize(resolveFromFile(filePath, relPath)))
        } else {
          // old state file without chain: fall back to UUID lookup then header-based map
          const childUuid = state?.child?.uuid
          const childPath = childUuid !== undefined ? uuidToPath.get(childUuid) : childOf.get(parentPath)
          if (childPath !== undefined) chain = [parentPath, childPath]
        }
      } catch (error) {
        warn("Merge state unreadable, can't restart merging.", error)
      }

      result.set(parentPath, { stateFilePath: filePath, chain, step })
    }

    return result
  }
}
