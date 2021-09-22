import assert from 'assert'
import { readChunk } from '@vates/read-chunk'
import { SECTOR_SIZE, BLOCK_UNUSED } from './_constants'
import { fuHeader } from './_structs'
import { set } from './_bitmap'

export const getChunkIterator = (stream, opts) => {
  return {
    [Symbol.asyncIterator]: async function* () {
      const bufFooter = await readChunk(stream, SECTOR_SIZE)
      yield { type: 'footer', buffer: bufFooter, position: 0 }

      const bufHeader = await readChunk(stream, 2 * SECTOR_SIZE)
      const header = fuHeader.unpack(bufHeader)

      yield { type: 'header', buffer: bufHeader, position: 512 }

      const blockBitmapSize = Math.ceil(header.blockSize / SECTOR_SIZE / 8 / SECTOR_SIZE) * SECTOR_SIZE
      const blockSize = header.blockSize
      const blockAndBitmapSize = blockBitmapSize + blockSize

      const batOffset = header.tableOffset
      const batSize = Math.max(1, Math.ceil((header.maxTableEntries * 4) / SECTOR_SIZE)) * SECTOR_SIZE

      /**
       * the norm allows the BAT to be after some blocks or parent locator
       * we do not handle this case for now since we need the BAT to order the blocks/parent locator
       *
       * also there can be some free space between header and the start of BAT
       */
      await readChunk(stream, batOffset - 1024 - 512)

      const bat = await readChunk(stream, batSize)
      yield { type: 'bat', buffer: bat, position: batOffset }

      /**
       * blocks and parent locators  can be intervined
       *
       * we build a sorted index since we read the stream sequentially and
       * we need to know what is the the next element to read and its size
       * (parent locator size can vary)
       */

      const index = []
      // each entry in the bat takes 4 bytes => 32 bits, it will only takes 1 bit in this
      const bytesBat = Buffer.alloc(header.maxTableEntries, 0)
      for (let blockCounter = 0; blockCounter < header.maxTableEntries; blockCounter++) {
        const batEntrySector = bat.readUInt32BE(blockCounter * 4)
        // unallocated block, no need to export it
        if (batEntrySector === BLOCK_UNUSED) {
          continue
        }
        set(bytesBat, blockCounter)
        const batEntryBytes = batEntrySector * SECTOR_SIZE
        // ensure the block is not before the bat
        assert.ok(batEntryBytes >= batOffset + batSize)

        index.push({
          type: 'block',
          offset: batEntryBytes,
          size: blockAndBitmapSize,
          index: blockCounter,
        })
      }
      // used for  chunked upload
      yield { type: 'bytesBat', buffer: bytesBat, position: batOffset }

      for (const parentLocatorIndex in header.parentLocatorEntry) {
        const parentLocatorEntry = header.parentLocatorEntry[parentLocatorIndex]
        // empty parent locator entry, does not exist in the content
        if (parentLocatorEntry.platformDataSpace === 0) {
          continue
        }
        assert.ok(parentLocatorEntry.platformDataOffset * SECTOR_SIZE >= batOffset + batSize)

        index.push({
          type: 'parentLocator',
          offset: parentLocatorEntry.platformDataOffset * SECTOR_SIZE,
          size: parentLocatorEntry.platformDataSpace * SECTOR_SIZE,
          index: parentLocatorIndex,
        })
      }

      index.sort((a, b) => a.offset - b.offset)

      let lastOffset = batOffset + batSize
      for (const chunk of index) {
        const { offset, size } = chunk

        // discard empty data from stream (data between lastchunk and this one)
        await readChunk(stream, lastOffset - offset)

        const buffer = await readChunk(stream, size)
        yield { ...chunk, buffer }

        lastOffset = offset + size
      }
    },
  }
}
