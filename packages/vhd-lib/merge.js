'use strict'

// TODO: remove once completely merged in vhd.js

const assert = require('assert')
const noop = require('./_noop')
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

// the chain we want to merge  is [ ancestor, child1, ..., childn]
// this chain can have grand children or grand parent
//
// 1. Create a VhdSynthetic from all children if more than 1 child are merged
// 2. Merge the resulting vhd into the ancestor
//    2.a if at least one is a file : copy file part from child to parent
//    2.b if they are all vhd directory : move blocks from children to the ancestor
// 3. update the size, uuid and timestamp of the ancestor with those of child n
// 3. Delete all (now) unused VHDs
// 4. Rename the ancestor to to child n
//
//                  VhdSynthetic
//                       |
//              /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
//  [ ancestor, child1, ...,child n-1,  child n ]
//         |    \___________________/     ^
//         |             |                |
//         |       unused VHDs            |
//         |                              |
//         \___________rename_____________/

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

function cleanupVhds(handler, parent, children, { logInfo = noop, remove = false } = {}) {
  if (!Array.isArray(children)) {
    children = [children]
  }
  const mergeTargetChild = children.shift()

  return Promise.all([
    VhdAbstract.rename(handler, parent, mergeTargetChild),
    asyncMap(children, child => {
      logInfo(`the VHD child is already merged`, { child })
      if (remove) {
        logInfo(`deleting merged VHD child`, { child })
        return VhdAbstract.unlink(handler, child)
      }
    }),
  ])
}
module.exports.cleanupVhds = cleanupVhds

// Merge one or multiple vhd child into vhd parent.
// childPath can be array to create a synthetic VHD from multiple VHDs
// childPath  is from the grand children to the children
//
// TODO: rename the VHD file during the merge
module.exports.mergeVhd = limitConcurrency(2)(async function merge(
  parentHandler,
  parentPath,
  childHandler,
  childPath,
  { onProgress = noop, logInfo = noop, remove } = {}
) {
  const mergeStatePath = dirname(parentPath) + '/' + '.' + basename(parentPath) + '.merge.json'

  return await Disposable.use(async function* () {
    let mergeState
    try {
      const mergeStateContent = await parentHandler.readFile(mergeStatePath)
      mergeState = JSON.parse(mergeStateContent)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        warn('problem while checking the merge state', { error })
      }
    }

    // during merging, the end footer of the parent can be overwritten by new blocks
    // we should use it as a way to check vhd health
    const parentVhd = yield openVhd(parentHandler, parentPath, {
      flags: 'r+',
      checkSecondFooter: mergeState === undefined,
    })
    let childVhd
    if (Array.isArray(childPath)) {
      childVhd = yield VhdSynthetic.open(childHandler, childPath)
    } else {
      childVhd = yield openVhd(childHandler, childPath)
    }

    const concurrency = childVhd instanceof VhdDirectory ? 16 : 1

    if (mergeState === undefined) {
      // merge should be along a vhd chain
      assert.strictEqual(childVhd.header.parentUuid.equals(parentVhd.footer.uuid), true)
      const parentDiskType = parentVhd.footer.diskType
      assert(parentDiskType === DISK_TYPES.DIFFERENCING || parentDiskType === DISK_TYPES.DYNAMIC)
      assert.strictEqual(childVhd.footer.diskType, DISK_TYPES.DIFFERENCING)
      assert.strictEqual(childVhd.header.blockSize, parentVhd.header.blockSize)
    } else {
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

    const mergeStateWriter = makeThrottledWriter(parentHandler, mergeStatePath, 10e3)

    await asyncEach(
      toMerge,
      async blockId => {
        merging.add(blockId)
        mergeState.mergedDataSize += await parentVhd.coalesceBlock(childVhd, blockId)
        merging.delete(blockId)

        onProgress({
          total: nBlocks,
          done: counter + 1,
        })
        counter++
        mergeState.currentBlock = Math.min(...merging)
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

    // should be a disposable
    parentHandler.unlink(mergeStatePath).catch(warn)

    await cleanupVhds(parentHandler, parentPath, childPath, { logInfo, remove })

    return mergeState.mergedDataSize
  })
})
