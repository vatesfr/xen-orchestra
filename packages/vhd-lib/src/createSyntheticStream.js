import asyncIteratorToStream from 'async-iterator-to-stream'
import { createLogger } from '@xen-orchestra/log'

import resolveRelativeFromFile from './_resolveRelativeFromFile'

import { VhdFile } from '.'
import { BLOCK_UNUSED, DISK_TYPE_DYNAMIC, FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE } from './_constants'
import { fuFooter, fuHeader, checksumStruct } from './_structs'
import { test as mapTestBit } from './_bitmap'

const { warn } = createLogger('vhd-lib:createSyntheticStream')

export default async function createSyntheticStream(handler, paths) {
  const fds = []
  const cleanup = () => {
    for (let i = 0, n = fds.length; i < n; ++i) {
      handler.closeFile(fds[i]).catch(error => {
        warn('error while closing file', {
          error,
          fd: fds[i],
        })
      })
    }
  }
  try {
    const vhds = []
    const open = async path => {
      const fd = await handler.openFile(path, 'r')
      fds.push(fd)
      const vhd = new VhdFile(handler, fd)
      vhds.push(vhd)
      await vhd.readHeaderAndFooter()
      await vhd.readBlockAllocationTable()

      return vhd
    }
    if (typeof paths === 'string') {
      let path = paths
      let vhd
      while ((vhd = await open(path)).footer.diskType !== DISK_TYPE_DYNAMIC) {
        path = resolveRelativeFromFile(path, vhd.header.parentUnicodeName)
      }
    } else {
      for (const path of paths) {
        await open(path)
      }
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

    const iterator = function* () {
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
          const emitBlockSectors = function* (iVhd, i, n) {
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
              block = yield vhd.readBlock(iBlock)
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
