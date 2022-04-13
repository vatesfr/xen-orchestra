'use strict'

// TODO: remove once completely merged in vhd.js

const assert = require('assert')
const UUID = require('uuid')
const noop = require('./_noop')
const { createLogger } = require('@xen-orchestra/log')
const { limitConcurrency } = require('limit-concurrency-decorator')

const { openVhd } = require('./openVhd')
const { basename, dirname } = require('path')
const { DISK_TYPES } = require('./_constants')
const { Disposable } = require('promise-toolbox')
const { asyncEach } = require('@vates/async-each')
const { VhdDirectory } = require('./Vhd/VhdDirectory')

const { warn } = createLogger('vhd-lib:merge')

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

// Merge vhd child into vhd parent.
//
// TODO: rename the VHD file during the merge
module.exports = limitConcurrency(2)(async function merge(
  parentHandler,
  parentPath,
  childHandler,
  childPath,
  { onProgress = noop } = {}
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
    const childVhd = yield openVhd(childHandler, childPath)

    const concurrency = childVhd instanceof VhdDirectory ? 16 : 1

    // merge should be along a vhd chain
    assert.strictEqual(UUID.stringify(childVhd.header.parentUuid), UUID.stringify(parentVhd.footer.uuid))
    const parentDiskType = parentVhd.footer.diskType
    assert(parentDiskType === DISK_TYPES.DIFFERENCING || parentDiskType === DISK_TYPES.DYNAMIC)
    assert.strictEqual(childVhd.footer.diskType, DISK_TYPES.DIFFERENCING)

    if (mergeState === undefined) {
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

    return mergeState.mergedDataSize
  })
})
