// TODO: remove once completely merged in vhd.js

import assert from 'assert'
import concurrency from 'limit-concurrency-decorator'
import noop from './_noop'

import Vhd from './vhd'
import { DISK_TYPE_DIFFERENCING, DISK_TYPE_DYNAMIC } from './_constants'

// Merge vhd child into vhd parent.
//
// TODO: rename the VHD file during the merge
export default concurrency(2)(async function merge(
  parentHandler,
  parentPath,
  childHandler,
  childPath,
  { onProgress = noop } = {}
) {
  const parentFd = await parentHandler.openFile(parentPath, 'r+')
  try {
    const parentVhd = new Vhd(parentHandler, parentFd)
    const childFd = await childHandler.openFile(childPath, 'r')
    try {
      const childVhd = new Vhd(childHandler, childFd)

      // Reading footer and header.
      await Promise.all([parentVhd.readHeaderAndFooter(), childVhd.readHeaderAndFooter()])

      assert(childVhd.header.blockSize === parentVhd.header.blockSize)

      const parentDiskType = parentVhd.footer.diskType
      assert(parentDiskType === DISK_TYPE_DIFFERENCING || parentDiskType === DISK_TYPE_DYNAMIC)
      assert.strictEqual(childVhd.footer.diskType, DISK_TYPE_DIFFERENCING)

      // Read allocation table of child/parent.
      await Promise.all([parentVhd.readBlockAllocationTable(), childVhd.readBlockAllocationTable()])

      const { maxTableEntries } = childVhd.header

      await parentVhd.ensureBatSize(childVhd.header.maxTableEntries)

      // finds first allocated block for the 2 following loops
      let firstBlock = 0
      while (firstBlock < maxTableEntries && !childVhd.containsBlock(firstBlock)) {
        ++firstBlock
      }

      // counts number of allocated blocks
      let nBlocks = 0
      for (let block = firstBlock; block < maxTableEntries; block++) {
        if (childVhd.containsBlock(block)) {
          nBlocks += 1
        }
      }

      onProgress({ total: nBlocks, done: 0 })

      // merges blocks
      let mergedDataSize = 0
      for (let i = 0, block = firstBlock; i < nBlocks; ++i, ++block) {
        while (!childVhd.containsBlock(block)) {
          ++block
        }

        mergedDataSize += await parentVhd.coalesceBlock(childVhd, block)
        onProgress({
          total: nBlocks,
          done: i + 1,
        })
      }

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

      return mergedDataSize
    } finally {
      await childHandler.closeFile(childFd)
    }
  } finally {
    await parentHandler.closeFile(parentFd)
  }
})
