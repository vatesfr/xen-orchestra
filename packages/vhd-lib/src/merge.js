// TODO: remove once completely merged in vhd.js

import assert from 'assert'
import concurrency from 'limit-concurrency-decorator'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import noop from './_noop'
import { createLogger } from '@xen-orchestra/log'

import Vhd from './vhd'
import { basename, dirname } from 'path'
import { DISK_TYPE_DIFFERENCING, DISK_TYPE_DYNAMIC } from './_constants'

const { warn } = createLogger('vhd-lib:merge')

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
  const mergeStatePath = dirname(parentPath) + '/' + '.' + basename(parentPath) + '.merge.json'

  const parentFd = await parentHandler.openFile(parentPath, 'r+')
  try {
    const parentVhd = new Vhd(parentHandler, parentFd)
    const childFd = await childHandler.openFile(childPath, 'r')
    try {
      const childVhd = new Vhd(childHandler, childFd)

      let mergeState = await parentHandler.readFile(mergeStatePath).catch(error => {
        if (error.code !== 'ENOENT') {
          throw error
        }
        // no merge state in case of missing file
      })

      // Reading footer and header.
      await Promise.all([
        parentVhd.readHeaderAndFooter(
          // dont check VHD is complete if recovering a merge
          mergeState === undefined
        ),

        childVhd.readHeaderAndFooter(),
      ])

      if (mergeState !== undefined) {
        mergeState = JSON.parse(mergeState)

        // ensure the correct merge will be continued
        assert.strictEqual(parentVhd.header.checksum, mergeState.parent.header)
        assert.strictEqual(childVhd.header.checksum, mergeState.child.header)
      } else {
        assert.strictEqual(childVhd.header.blockSize, parentVhd.header.blockSize)

        const parentDiskType = parentVhd.footer.diskType
        assert(parentDiskType === DISK_TYPE_DIFFERENCING || parentDiskType === DISK_TYPE_DYNAMIC)
        assert.strictEqual(childVhd.footer.diskType, DISK_TYPE_DIFFERENCING)
      }

      // Read allocation table of child/parent.
      await Promise.all([parentVhd.readBlockAllocationTable(), childVhd.readBlockAllocationTable()])

      const { maxTableEntries } = childVhd.header

      let firstBlock
      if (mergeState === undefined) {
        await parentVhd.ensureBatSize(childVhd.header.maxTableEntries)

        // finds first allocated block for the 2 following loops
        firstBlock = 0
        while (firstBlock < maxTableEntries && !childVhd.containsBlock(firstBlock)) {
          ++firstBlock
        }

        mergeState = {
          child: { header: childVhd.header.checksum },
          parent: { header: parentVhd.header.checksum },
          currentBlock: 0,
        }
      } else {
        firstBlock = mergeState.currentBlock
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

        mergeState.currentBlock = block
        await parentHandler.writeFile(mergeStatePath, JSON.stringify(mergeState), { flags: 'w' }).catch(warn)

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
    ignoreErrors.call(parentHandler.unlink(mergeStatePath))
    await parentHandler.closeFile(parentFd)
  }
})
