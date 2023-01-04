'use strict'

// TODO: remove once completely merged in vhd.js

const assert = require('assert')
const noop = require('./_noop')
const UUID = require('uuid')
const handlerPath = require('@xen-orchestra/fs/path')
const { createLogger } = require('@xen-orchestra/log')
const { limitConcurrency } = require('limit-concurrency-decorator')

const { openVhd } = require('./openVhd')
const { basename, dirname } = require('path')
const { DISK_TYPES } = require('./_constants')
const { Disposable } = require('promise-toolbox')
const { asyncEach } = require('@vates/async-each')
const { VhdAbstract } = require('./Vhd/VhdAbstract')
const { VhdDirectory } = require('./Vhd/VhdDirectory')
const { VhdSynthetic } = require('./Vhd/VhdSynthetic')
const { asyncMap } = require('@xen-orchestra/async-map')
const { isVhdAlias, resolveVhdAlias } = require('./aliases')

const { warn } = createLogger('vhd-lib:merge')

// The chain we want to merge  is [ ancestor, child_1, ..., child_n]
//
// 1. Create a VhdSynthetic from all children if more than 1 child
// 2. Merge the resulting VHD into the ancestor
//    2.a if at least one is a file: copy file part from child to parent
//    2.b if they are all VhdDirectory: move blocks from children to the ancestor
// 3. Update the size, UUID and timestamp of the ancestor with those of child_n
// 3. Delete all (now) unused VHDs
// 4. Rename the ancestor to to child_n
//
//                       VhdSynthetic
//                             |
//              /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
//  [ ancestor, child_1, ...,child_n-1,  child_n ]
//         |    \____________________/      ^
//         |              |                 |
//         |         unused VHDs            |
//         |                                |
//         \_____________rename_____________/

class Merger {
  #chain
  #childrenPaths
  #handler
  #isResuming = false
  #lastStateWrittenAt = 0
  #logInfo
  #mergeBlockConcurrency
  #onProgress
  #parentPath
  #removeUnused
  #state
  #statePath

  constructor(handler, chain, { onProgress, logInfo, removeUnused, mergeBlockConcurrency }) {
    this.#chain = chain
    this.#handler = handler
    this.#parentPath = chain[0]
    this.#childrenPaths = chain.slice(1)
    this.#logInfo = logInfo
    this.#onProgress = onProgress
    this.#removeUnused = removeUnused
    this.#mergeBlockConcurrency = mergeBlockConcurrency

    this.#statePath = dirname(this.#parentPath) + '/.' + basename(this.#parentPath) + '.merge.json'
  }

  async #writeState() {
    await this.#handler.writeFile(this.#statePath, JSON.stringify(this.#state), { flags: 'w' }).catch(warn)
  }

  async #writeStateThrottled() {
    const delay = 10e3
    const now = Date.now()
    if (now - this.#lastStateWrittenAt > delay) {
      this.#lastStateWrittenAt = now
      await this.#writeState()
    }
  }

  async merge() {
    try {
      const mergeStateContent = await this.#handler.readFile(this.#statePath)
      this.#state = JSON.parse(mergeStateContent)

      // work-around a bug introduce in 97d94b795
      //
      // currentBlock could be `null` due to the JSON.stringify of a `NaN` value
      if (this.#state.currentBlock === null) {
        this.#state.currentBlock = 0
      }
      this.#isResuming = true
    } catch (error) {
      if (error.code !== 'ENOENT') {
        warn('problem while checking the merge state', { error })
      }
    }
    /* eslint-disable no-fallthrough */
    switch (this.#state?.step ?? 'mergeBlocks') {
      case 'mergeBlocks':
        await this.#step_mergeBlocks()
      case 'cleanupVhds':
        await this.#step_cleanVhds()
        return this.#cleanup()
      default:
        warn(`Step ${this.#state.step} is unknown`, { state: this.#state })
    }
    /* eslint-enable no-fallthrough */
  }

  async *#openVhds() {
    // during merging, the end footer of the parent can be overwritten by new blocks
    // we should use it as a way to check vhd health
    const parentVhd = yield openVhd(this.#handler, this.#parentPath, {
      flags: 'r+',
      checkSecondFooter: this.#state === undefined,
    })
    let childVhd
    const parentIsVhdDirectory = parentVhd instanceof VhdDirectory
    let childIsVhdDirectory
    if (this.#childrenPaths.length !== 1) {
      childVhd = yield VhdSynthetic.open(this.#handler, this.#childrenPaths)
      childIsVhdDirectory = childVhd.checkVhdsClass(VhdDirectory)
    } else {
      childVhd = yield openVhd(this.#handler, this.#childrenPaths[0])
      childIsVhdDirectory = childVhd instanceof VhdDirectory
    }

    // merging vhdFile must not be concurrently with the potential block reordering after a change
    this.#mergeBlockConcurrency = parentIsVhdDirectory && childIsVhdDirectory ? this.#mergeBlockConcurrency : 1

    if (parentIsVhdDirectory && !isVhdAlias(this.#parentPath)) {
      const error = new Error("can't merge vhd directories without using alias")
      error.code = 'NOT_SUPPORTED'
      throw error
    }

    if (this.#state === undefined) {
      // merge should be along a vhd chain
      assert.strictEqual(UUID.stringify(childVhd.header.parentUuid), UUID.stringify(parentVhd.footer.uuid))
      const parentDiskType = parentVhd.footer.diskType
      assert(parentDiskType === DISK_TYPES.DIFFERENCING || parentDiskType === DISK_TYPES.DYNAMIC)
      assert.strictEqual(childVhd.footer.diskType, DISK_TYPES.DIFFERENCING)
      assert.strictEqual(childVhd.header.blockSize, parentVhd.header.blockSize)
    } else {
      // vhd should not have changed to resume
      assert.strictEqual(parentVhd.header.checksum, this.#state.parent.header)
      assert.strictEqual(childVhd.header.checksum, this.#state.child.header)
    }

    // Read allocation table of child/parent.
    await Promise.all([parentVhd.readBlockAllocationTable(), childVhd.readBlockAllocationTable()])

    return { childVhd, parentVhd }
  }

  async #step_mergeBlocks() {
    const self = this
    await Disposable.use(async function* () {
      const { childVhd, parentVhd } = yield* self.#openVhds()
      const { maxTableEntries } = childVhd.header

      if (self.#state === undefined) {
        await parentVhd.ensureBatSize(childVhd.header.maxTableEntries)

        self.#state = {
          child: { header: childVhd.header.checksum },
          parent: { header: parentVhd.header.checksum },
          currentBlock: 0,
          mergedDataSize: 0,
          step: 'mergeBlocks',
          chain: self.#chain.map(vhdPath => handlerPath.relativeFromFile(self.#statePath, vhdPath)),
        }

        // finds first allocated block for the 2 following loops
        while (self.#state.currentBlock < maxTableEntries && !childVhd.containsBlock(self.#state.currentBlock)) {
          ++self.#state.currentBlock
        }
        await self.#writeState()
      }
      await self.#mergeBlocks(parentVhd, childVhd)
      await self.#updateHeaders(parentVhd, childVhd)
    })
  }

  async #mergeBlocks(parentVhd, childVhd) {
    const { maxTableEntries } = childVhd.header
    const toMerge = []
    for (let block = this.#state.currentBlock; block < maxTableEntries; block++) {
      if (childVhd.containsBlock(block)) {
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
        this.#state.mergedDataSize += await parentVhd.mergeBlock(childVhd, blockId, this.#isResuming)

        this.#state.currentBlock = Math.min(...merging)
        merging.delete(blockId)

        this.#onProgress({
          total: nBlocks,
          done: counter + 1,
        })
        counter++
        this.#writeStateThrottled()
      },
      {
        concurrency: this.#mergeBlockConcurrency,
      }
    )
    // ensure data size is correct
    await this.#writeState()
    this.#onProgress({ total: nBlocks, done: nBlocks })
  }

  async #updateHeaders(parentVhd, childVhd) {
    // some blocks could have been created or moved in parent : write bat
    await parentVhd.writeBlockAllocationTable()

    const cFooter = childVhd.footer
    const pFooter = parentVhd.footer

    pFooter.currentSize = cFooter.currentSize
    pFooter.diskGeometry = { ...cFooter.diskGeometry }
    pFooter.originalSize = cFooter.originalSize
    pFooter.timestamp = cFooter.timestamp
    pFooter.uuid = cFooter.uuid

    // necessary to update values and to recreate the footer after block
    // creation
    await parentVhd.writeFooter()
  }

  // make the rename / delete part of the merge process
  // will fail if parent and children are in different remote
  async #step_cleanVhds() {
    assert.notEqual(this.#state, undefined)
    this.#state.step = 'cleanupVhds'
    await this.#writeState()

    const chain = this.#chain
    const handler = this.#handler

    const parent = chain[0]
    const children = chain.slice(1, -1)
    const mergeTargetChild = chain[chain.length - 1]

    // in the case is an alias, renaming parent to mergeTargetChild will keep the real data
    // of mergeTargetChild in the data folder
    // mergeTargetChild is already in an incomplete state, its blocks have been transferred to parent
    let oldTarget
    if (isVhdAlias(mergeTargetChild)) {
      oldTarget = await resolveVhdAlias(handler, mergeTargetChild)
    }

    try {
      await handler.rename(parent, mergeTargetChild)
      if (oldTarget !== undefined) {
        await VhdAbstract.unlink(handler, oldTarget).catch(warn)
      }
    } catch (error) {
      // maybe the renaming was already successfull during merge
      if (error.code === 'ENOENT' && this.#isResuming) {
        Disposable.use(openVhd(handler, mergeTargetChild), vhd => {
          // we are sure that mergeTargetChild is the right one
          assert.strictEqual(vhd.header.checksum, this.#state.parent.header)
        })
        this.#logInfo(`the VHD parent was already renamed`, { parent, mergeTargetChild })
      } else {
        throw error
      }
    }

    await asyncMap(children, child => {
      this.#logInfo(`the VHD child is already merged`, { child })
      if (this.#removeUnused) {
        this.#logInfo(`deleting merged VHD child`, { child })
        return VhdAbstract.unlink(handler, child)
      }
    })
  }

  async #cleanup() {
    const mergedSize = this.#state?.mergedDataSize ?? 0
    await this.#handler.unlink(this.#statePath).catch(warn)
    return mergedSize
  }
}

module.exports.mergeVhdChain = limitConcurrency(2)(async function mergeVhdChain(
  handler,
  chain,
  { onProgress = noop, logInfo = noop, removeUnused = false, mergeBlockConcurrency = 2 } = {}
) {
  const merger = new Merger(handler, chain, { onProgress, logInfo, removeUnused, mergeBlockConcurrency })
  try {
    return merger.merge()
  } catch (error) {
    try {
      error.chain = chain
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      throw error
    }
  }
})
