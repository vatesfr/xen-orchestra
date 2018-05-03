import asyncIteratorToStream from 'async-iterator-to-stream'
import { dirname, resolve } from 'path'

import Vhd from './vhd'
import { BLOCK_UNUSED, DISK_TYPE_DYNAMIC, SECTOR_SIZE } from './_constants'
import { fuFooter, fuHeader, checksumStruct } from './_structs'
import { test as mapTestBit } from './_bitmap'

const resolveRelativeFromFile = (file, path) =>
  resolve('/', dirname(file), path).slice(1)

export default asyncIteratorToStream(function * (handler, path) {
  const fds = []

  try {
    const vhds = []
    while (true) {
      const fd = yield handler.openFile(path, 'r')
      fds.push(fd)
      const vhd = new Vhd(handler, fd)
      vhds.push(vhd)
      yield vhd.readHeaderAndFooter()
      yield vhd.readBlockTable()

      if (vhd.footer.diskType === DISK_TYPE_DYNAMIC) {
        break
      }

      path = resolveRelativeFromFile(path, vhd.header.parentUnicodeName)
    }
    const nVhds = vhds.length

    // this the VHD we want to synthetize
    const vhd = vhds[0]

    // data of our synthetic VHD
    // TODO: empty parentUuid, parentTimestamp and parentLocatorEntry-s in header
    let header = {
      ...vhd.header,
      tableOffset: 512 + 1024,
      parentUnicodeName: '',
    }

    const bat = Buffer.allocUnsafe(
      Math.ceil(4 * header.maxTableEntries / SECTOR_SIZE) * SECTOR_SIZE
    )
    let footer = {
      ...vhd.footer,
      diskType: DISK_TYPE_DYNAMIC,
    }
    const sectorsPerBlockData = vhd.sectorsPerBlock
    const sectorsPerBlock = sectorsPerBlockData + vhd.bitmapSize / SECTOR_SIZE

    const nBlocks = Math.ceil(footer.currentSize / header.blockSize)

    const blocksOwner = new Array(nBlocks)
    for (
      let iBlock = 0,
        blockOffset = Math.ceil((512 + 1024 + bat.length) / SECTOR_SIZE);
      iBlock < nBlocks;
      ++iBlock
    ) {
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

    footer = fuFooter.pack(footer)
    checksumStruct(footer, fuFooter)
    yield footer

    header = fuHeader.pack(header)
    checksumStruct(header, fuHeader)
    yield header

    yield bat

    const bitmap = Buffer.alloc(vhd.bitmapSize, 0xff)
    for (let iBlock = 0; iBlock < nBlocks; ++iBlock) {
      const owner = blocksOwner[iBlock]
      if (owner === undefined) {
        continue
      }

      yield bitmap

      const blocksByVhd = new Map()
      const emitBlockSectors = function * (iVhd, i, n) {
        const vhd = vhds[iVhd]
        const isRootVhd = vhd.footer.diskType === DISK_TYPE_DYNAMIC
        if (!vhd.containsBlock(iBlock)) {
          if (isRootVhd) {
            yield Buffer.alloc((n - i) * SECTOR_SIZE)
          } else {
            yield * emitBlockSectors(iVhd + 1, i, n)
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
            yield * emitBlockSectors(iVhd + 1, start, i)
          }
        }
      }
      yield * emitBlockSectors(owner, 0, sectorsPerBlock)
    }

    yield footer
  } finally {
    for (let i = 0, n = fds.length; i < n; ++i) {
      handler.closeFile(fds[i]).catch(error => {
        console.warn('createReadStream, closeFd', i, error)
      })
    }
  }
})
