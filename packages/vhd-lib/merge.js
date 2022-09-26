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

// write the merge progress file at most  every `delay` seconds
function makeThrottledWriter(handler, path, delay) {
  let lastWrite = Date.now()
  return async json => {
    const now = Date.now()
    if (now - lastWrite > delay) {
      lastWrite = now
      await handler.writeFile(path, JSON.stringify(json), { flags: 'w' }).catch(warn)
    }
  }
}

// make the rename / delete part of the merge process
// will fail if parent and children are in different remote

async function cleanupVhds(handler, chain, { logInfo = noop, removeUnused = false } = {}) {
  const parent = chain[0]
  const children = chain.slice(1, -1)
  const mergeTargetChild = chain[chain.length - 1]

  await VhdAbstract.rename(handler, parent, mergeTargetChild)

  return asyncMap(children, child => {
    logInfo(`the VHD child is already merged`, { child })
    if (removeUnused) {
      logInfo(`deleting merged VHD child`, { child })
      return VhdAbstract.unlink(handler, child)
    }
  })
}

module.exports._cleanupVhds = cleanupVhds

// Merge a chain of VHDs into a single VHD
module.exports.mergeVhdChain = limitConcurrency(2)(async function mergeVhdChain(
  handler,
  chain,
  { onProgress = noop, logInfo = noop, removeUnused = false, mergeBlockConcurrency = 2 } = {}
) {
  assert(chain.length >= 2)

  const parentPath = chain[0]
  const childrenPaths = chain.slice(1)

  const mergeStatePath = dirname(parentPath) + '/.' + basename(parentPath) + '.merge.json'

  return await Disposable.use(async function* () {
    let mergeState
    let isResuming = false
    try {
      const mergeStateContent = await handler.readFile(mergeStatePath)
      mergeState = JSON.parse(mergeStateContent)

      // work-around a bug introduce in 97d94b795
      //
      // currentBlock could be `null` due to the JSON.stringify of a `NaN` value
      if (mergeState.currentBlock === null) {
        mergeState.currentBlock = 0
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        warn('problem while checking the merge state', { error })
      }
    }

    // during merging, the end footer of the parent can be overwritten by new blocks
    // we should use it as a way to check vhd health
    const parentVhd = yield openVhd(handler, parentPath, {
      flags: 'r+',
      checkSecondFooter: mergeState === undefined,
    })
    let childVhd
    const parentIsVhdDirectory = parentVhd instanceof VhdDirectory
    let childIsVhdDirectory
    if (childrenPaths.length !== 1) {
      childVhd = yield VhdSynthetic.open(handler, childrenPaths)
      childIsVhdDirectory = childVhd.checkVhdsClass(VhdDirectory)
    } else {
      childVhd = yield openVhd(handler, childrenPaths[0])
      childIsVhdDirectory = childVhd instanceof VhdDirectory
    }

    // merging vhdFile must not be concurrently with the potential block reordering after a change
    const concurrency = parentIsVhdDirectory && childIsVhdDirectory ? mergeBlockConcurrency : 1
    if (mergeState === undefined) {
      // merge should be along a vhd chain
      assert.strictEqual(UUID.stringify(childVhd.header.parentUuid), UUID.stringify(parentVhd.footer.uuid))
      const parentDiskType = parentVhd.footer.diskType
      assert(parentDiskType === DISK_TYPES.DIFFERENCING || parentDiskType === DISK_TYPES.DYNAMIC)
      assert.strictEqual(childVhd.footer.diskType, DISK_TYPES.DIFFERENCING)
      assert.strictEqual(childVhd.header.blockSize, parentVhd.header.blockSize)
    } else {
      isResuming = true
      // vhd should not have changed to resume
      assert.strictEqual(parentVhd.header.checksum, mergeState.parent.header)
      assert.strictEqual(childVhd.header.checksum, mergeState.child.header)
    }

    // Read allocation table of child/parent.
    await Promise.all([parentVhd.readBlockAllocationTable(), childVhd.readBlockAllocationTable()])

    const { maxTableEntries } = childVhd.header

    if (mergeState === undefined) {
      await parentVhd.ensureBatSize(childVhd.header.maxTableEntries)

      mergeState = {
        child: { header: childVhd.header.checksum },
        parent: { header: parentVhd.header.checksum },
        currentBlock: 0,
        mergedDataSize: 0,
        chain: chain.map(vhdPath => handlerPath.relativeFromFile(mergeStatePath, vhdPath)),
      }

      // finds first allocated block for the 2 following loops
      while (mergeState.currentBlock < maxTableEntries && !childVhd.containsBlock(mergeState.currentBlock)) {
        ++mergeState.currentBlock
      }
    }

    // counts number of allocated blocks
    const toMerge = []
    for (let block = mergeState.currentBlock; block < maxTableEntries; block++) {
      if (childVhd.containsBlock(block)) {
        toMerge.push(block)
      }
    }
    const nBlocks = toMerge.length
    onProgress({ total: nBlocks, done: 0 })

    const merging = new Set()
    let counter = 0

    const mergeStateWriter = makeThrottledWriter(handler, mergeStatePath, 10e3)
    await asyncEach(
      toMerge,
      async blockId => {
        merging.add(blockId)
        mergeState.mergedDataSize += await parentVhd.mergeBlock(childVhd, blockId, isResuming)

        mergeState.currentBlock = Math.min(...merging)
        merging.delete(blockId)

        onProgress({
          total: nBlocks,
          done: counter + 1,
        })
        counter++
        mergeStateWriter(mergeState)
      },
      {
        concurrency,
      }
    )
    onProgress({ total: nBlocks, done: nBlocks })
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

    await cleanupVhds(handler, chain, { logInfo, removeUnused })

    // should be a disposable
    handler.unlink(mergeStatePath).catch(warn)

    return mergeState.mergedDataSize
  }).catch(error => {
    try {
      error.chain = chain
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      throw error
    }
  })
})
