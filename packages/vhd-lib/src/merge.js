// TODO: remove once completely merged in vhd.js

import assert from 'assert'
import noop from './_noop'
import { createLogger } from '@xen-orchestra/log'
import { limitConcurrency } from 'limit-concurrency-decorator'

import { openVhd } from '.'
import { basename, dirname } from 'path'
import { DISK_TYPES } from './_constants'
import { Disposable } from 'promise-toolbox'

const { warn } = createLogger('vhd-lib:merge')

// Merge vhd child into vhd parent.
//
// TODO: rename the VHD file during the merge
export default limitConcurrency(2)(async function merge(
  parentHandler,
  parentPath,
  childHandler,
  childPath,
  { onProgress = noop } = {}
) {
  const mergeStatePath = dirname(parentPath) + '/' + '.' + basename(parentPath) + '.merge.json'

  return await Disposable.use(async function* () {
    let mergeState = await parentHandler.readFile(mergeStatePath).catch(error => {
      if (error.code !== 'ENOENT') {
        throw error
      }
      // no merge state in case of missing file
    })
    // during merging, the end footer of the parent can be overwritten by new blocks
    // we should use it as a way to check vhd health
    const parentVhd = yield openVhd(parentHandler, parentPath, {
      flags: 'r+',
      checkSecondFooter: mergeState === undefined,
    })
    const childVhd = yield openVhd(childHandler, childPath)
    if (mergeState !== undefined) {
      mergeState = JSON.parse(mergeState)

      // ensure the correct merge will be continued
      assert.strictEqual(parentVhd.header.checksum, mergeState.parent.header)
      assert.strictEqual(childVhd.header.checksum, mergeState.child.header)
    } else {
      assert.strictEqual(childVhd.header.blockSize, parentVhd.header.blockSize)

      const parentDiskType = parentVhd.footer.diskType
      assert(parentDiskType === DISK_TYPES.DIFFERENCING || parentDiskType === DISK_TYPES.DYNAMIC)
      assert.strictEqual(childVhd.footer.diskType, DISK_TYPES.DIFFERENCING)
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
    let nBlocks = 0
    for (let block = mergeState.currentBlock; block < maxTableEntries; block++) {
      if (childVhd.containsBlock(block)) {
        nBlocks += 1
      }
    }

    onProgress({ total: nBlocks, done: 0 })

    // merges blocks
    for (let i = 0; i < nBlocks; ++i, ++mergeState.currentBlock) {
      while (!childVhd.containsBlock(mergeState.currentBlock)) {
        ++mergeState.currentBlock
      }

      await parentHandler.writeFile(mergeStatePath, JSON.stringify(mergeState), { flags: 'w' }).catch(warn)

      mergeState.mergedDataSize += await parentVhd.coalesceBlock(childVhd, mergeState.currentBlock)
      onProgress({
        total: nBlocks,
        done: i + 1,
      })
    }

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
