// TODO: remove once completely merged in vhd.js

import assert from 'assert'
import concurrency from 'limit-concurrency-decorator'
import { dirname, relative } from 'path'

import type RemoteHandler from '@xen-orchestra/fs'

import {
  VHD_SECTOR_SIZE,
  VHD_PLATFORM_CODE_NONE,
  HARD_DISK_TYPE_DIFFERENCING,
  PLATFORM_W2KU,
  Vhd,
} from './vhd'

export { createReadStream, Vhd } from './vhd'

// Merge vhd child into vhd parent.
//
// Child must be a delta backup !
// Parent must be a full backup !
//
// TODO: update the identifier of the parent VHD.
export default concurrency(2)(async function vhdMerge (
  parentHandler,
  parentPath,
  childHandler,
  childPath
) {
  const parentFd = await parentHandler.openFile(parentPath, 'r+')
  try {
    const parentVhd = new Vhd(parentHandler, parentFd)
    const childFd = await childHandler.openFile(childPath, 'r')
    try {
      const childVhd = new Vhd(childHandler, childFd)

      // Reading footer and header.
      await Promise.all([
        parentVhd.readHeaderAndFooter(),
        childVhd.readHeaderAndFooter(),
      ])

      assert(childVhd.header.blockSize === parentVhd.header.blockSize)

      // Child must be a delta.
      if (childVhd.footer.diskType !== HARD_DISK_TYPE_DIFFERENCING) {
        throw new Error('Unable to merge, child is not a delta backup.')
      }

      // Allocation table map is not yet implemented.
      if (
        parentVhd.hasBlockAllocationTableMap() ||
        childVhd.hasBlockAllocationTableMap()
      ) {
        throw new Error('Unsupported allocation table map.')
      }

      // Read allocation table of child/parent.
      await Promise.all([parentVhd.readBlockTable(), childVhd.readBlockTable()])

      await parentVhd.ensureBatSize(childVhd.header.maxTableEntries)

      let mergedDataSize = 0
      for (
        let blockId = 0;
        blockId < childVhd.header.maxTableEntries;
        blockId++
      ) {
        if (childVhd.containsBlock(blockId)) {
          mergedDataSize += await parentVhd.coalesceBlock(childVhd, blockId)
        }
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

// returns true if the child was actually modified
export async function chainVhd (
  parentHandler,
  parentPath,
  childHandler,
  childPath,
  force = false
) {
  const parentVhd = new Vhd(parentHandler, parentPath)
  const childVhd = new Vhd(childHandler, childPath)

  await childVhd.readHeaderAndFooter()
  const { header, footer } = childVhd

  if (footer.diskType !== HARD_DISK_TYPE_DIFFERENCING) {
    if (!force) {
      throw new Error('cannot chain disk of type ' + footer.diskType)
    }
    footer.diskType = HARD_DISK_TYPE_DIFFERENCING
  }

  await Promise.all([
    childVhd.readBlockTable(),
    parentVhd.readHeaderAndFooter(),
  ])

  const parentName = relative(dirname(childPath), parentPath)

  header.parentUuid = parentVhd.footer.uuid
  header.parentUnicodeName = parentName

  header.parentLocatorEntry[0].platformCode = PLATFORM_W2KU
  const encodedFilename = Buffer.from(parentName, 'utf16le')
  const dataSpaceSectors = Math.ceil(encodedFilename.length / VHD_SECTOR_SIZE)
  const position = await childVhd.ensureSpaceForParentLocators(dataSpaceSectors)
  await childVhd._write(encodedFilename, position)
  header.parentLocatorEntry[0].platformDataSpace =
    dataSpaceSectors * VHD_SECTOR_SIZE
  header.parentLocatorEntry[0].platformDataLength = encodedFilename.length
  header.parentLocatorEntry[0].platformDataOffset = position
  for (let i = 1; i < 8; i++) {
    header.parentLocatorEntry[i].platformCode = VHD_PLATFORM_CODE_NONE
    header.parentLocatorEntry[i].platformDataSpace = 0
    header.parentLocatorEntry[i].platformDataLength = 0
    header.parentLocatorEntry[i].platformDataOffset = 0
  }
  await childVhd.writeHeader()
  await childVhd.writeFooter()
  return true
}

export async function readVhdMetadata (handler: RemoteHandler, path: string) {
  const vhd = new Vhd(handler, path)
  await vhd.readHeaderAndFooter()
  return {
    footer: vhd.footer,
    header: vhd.header,
  }
}
