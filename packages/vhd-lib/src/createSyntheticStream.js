import asyncIteratorToStream from 'async-iterator-to-stream'

import resolveRelativeFromFile from './_resolveRelativeFromFile'

import Vhd from './vhd'
import {
  BLOCK_UNUSED,
  DISK_TYPE_DYNAMIC,
  FOOTER_SIZE,
  HEADER_SIZE,
  SECTOR_SIZE,
} from './_constants'
import { fuFooter, fuHeader, checksumStruct } from './_structs'
import { test as mapTestBit } from './_bitmap'

export default async function createSyntheticStream(handler, path) {
  const fds = []
  const cleanup = () => {
    for (let i = 0, n = fds.length; i < n; ++i) {
      handler.closeFile(fds[i]).catch(error => {
        console.warn('createReadStream, closeFd', i, error)
      })
    }
  }
  try {
    const vhds = []
    while (true) {
      const fd = await handler.openFile(path, 'r')
      fds.push(fd)
      const vhd = new Vhd(handler, fd)
      vhds.push(vhd)
      await vhd.readHeaderAndFooter()
      await vhd.readBlockAllocationTable()

      if (vhd.footer.diskType === DISK_TYPE_DYNAMIC) {
        break
      }

      path = resolveRelativeFromFile(path, vhd.header.parentUnicodeName)
    }
    const nVhds = vhds.length

    // this the VHD we want to synthetize
    const vhd = vhds[0]

    // this is the root VHD
    const rootVhd = vhds[nVhds - 1]

    // data of our synthetic VHD
    // TODO: set parentLocatorEntry-s in header
    let header = {
      ...vhd.header,
      tableOffset: FOOTER_SIZE + HEADER_SIZE,
      parentTimestamp: rootVhd.header.parentTimestamp,
      parentUnicodeName: rootVhd.header.parentUnicodeName,
      parentUuid: rootVhd.header.parentUuid,
    }

    const bat = Buffer.allocUnsafe(vhd.batSize)
    let footer = {
      ...vhd.footer,
      dataOffset: FOOTER_SIZE,
      diskType: rootVhd.footer.diskType,
    }
    const sectorsPerBlockData = vhd.sectorsPerBlock
    const sectorsPerBlock = sectorsPerBlockData + vhd.bitmapSize / SECTOR_SIZE

    const nBlocks = Math.ceil(footer.currentSize / header.blockSize)

    const blocksOwner = new Array(nBlocks)
    let blockOffset = Math.ceil((header.tableOffset + bat.length) / SECTOR_SIZE)
    for (let iBlock = 0; iBlock < nBlocks; ++iBlock) {
      let blockSector = BLOCK_UNUSED
      for (let i = 0; i < nVhds; ++i) {
        if (vhds[i].containsBlock(iBlock)) {
          blocksOwner[iBlock] = i
          blockSector = blockOffset
          blockOffset += sectorsPerBlock
          break
        }
      }
      bat.writeUInt32BE(blockSector, iBlock * 4)
    }
    const fileSize = blockOffset * SECTOR_SIZE + FOOTER_SIZE

    const iterator = function*() {
      try {
        footer = fuFooter.pack(footer)
        checksumStruct(footer, fuFooter)
        yield footer

        header = fuHeader.pack(header)
        checksumStruct(header, fuHeader)
        yield header

        yield bat

        // TODO: for generic usage the bitmap needs to be properly computed for each block
        const bitmap = Buffer.alloc(vhd.bitmapSize, 0xff)
        for (let iBlock = 0; iBlock < nBlocks; ++iBlock) {
          const owner = blocksOwner[iBlock]
          if (owner === undefined) {
            continue
          }

          yield bitmap

          const blocksByVhd = new Map()
          const emitBlockSectors = function*(iVhd, i, n) {
            const vhd = vhds[iVhd]
            const isRootVhd = vhd === rootVhd
            if (!vhd.containsBlock(iBlock)) {
              if (isRootVhd) {
                yield Buffer.alloc((n - i) * SECTOR_SIZE)
              } else {
                yield* emitBlockSectors(iVhd + 1, i, n)
              }
              return
            }
            let block = blocksByVhd.get(vhd)
            if (block === undefined) {
              block = yield vhd._readBlock(iBlock)
              blocksByVhd.set(vhd, block)
            }
            const { bitmap, data } = block
            if (isRootVhd) {
              yield data.slice(i * SECTOR_SIZE, n * SECTOR_SIZE)
              return
            }
            while (i < n) {
              const hasData = mapTestBit(bitmap, i)
              const start = i
              do {
                ++i
              } while (i < n && mapTestBit(bitmap, i) === hasData)
              if (hasData) {
                yield data.slice(start * SECTOR_SIZE, i * SECTOR_SIZE)
              } else {
                yield* emitBlockSectors(iVhd + 1, start, i)
              }
            }
          }
          yield* emitBlockSectors(owner, 0, sectorsPerBlockData)
        }
        yield footer
      } finally {
        cleanup()
      }
    }

    const stream = asyncIteratorToStream(iterator())
    stream.length = fileSize
    return stream
  } catch (e) {
    cleanup()
    throw e
  }
}
