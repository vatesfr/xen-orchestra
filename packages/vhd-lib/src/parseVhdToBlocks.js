import { readChunk } from '@vates/read-chunk'
import assert from 'assert'
import { FOOTER_SIZE, HEADER_SIZE, BLOCK_UNUSED, SECTOR_SIZE } from './_constants'
import { fuFooter, fuHeader } from './_structs'
import checkFooter from './checkFooter'
import checkHeader from './_checkHeader'

export default async function parseVhdToBlocks(inputStream) {
  let streamPosition = 0

  async function readStream(length) {
    const chunk = await readChunk(inputStream, length)
    assert.strictEqual(chunk.length, length)
    streamPosition += chunk.length
    return chunk
  }

  const footerBuffer = await readStream(FOOTER_SIZE)
  const footer = fuFooter.unpack(footerBuffer)
  checkFooter(footer)

  const header = fuHeader.unpack(await readStream(HEADER_SIZE))
  checkHeader(header, footer)
  assert.strictEqual(header.tableOffset <= 100 * 1024 * 1024, true, 'The BAT is more that 100MB in the file')
  await readStream(header.tableOffset - streamPosition)
  const blockSizeBytes = header.blockSize
  const bat = await readStream(header.maxTableEntries * 4)
  const offsetToLBA = []
  for (let i = 0; i < bat.byteLength; i += 4) {
    const offsetSectors = bat.readUInt32BE(i)
    if (offsetSectors !== BLOCK_UNUSED) {
      const lba = blockSizeBytes * (i / 4)
      offsetToLBA.push([offsetSectors, lba])
    }
  }
  offsetToLBA.sort((a, b) => a[0] - b[0])
  const earliestBlockInFile = offsetToLBA[0][0]*SECTOR_SIZE
  assert.strictEqual(streamPosition <= earliestBlockInFile, true, `The BAT (${streamPosition}) is after the first block of data (${earliestBlockInFile})`)

  const netBitmapSizeBytes = Math.ceil(blockSizeBytes / SECTOR_SIZE / 8)
  const paddedBitmapSizeBytes = Math.ceil(netBitmapSizeBytes / SECTOR_SIZE) * SECTOR_SIZE
  const expectedBitmap = Buffer.alloc(netBitmapSizeBytes, 255)

  async function * blockGenerator() {
    for (const i of offsetToLBA) {
      const offset = i[0] * SECTOR_SIZE
      const lba = i[1]
      const skipBytes = offset - streamPosition
      assert.strictEqual(skipBytes >= 0, true, 'Tried to move backwards in the input stream')
      await readStream(skipBytes)
      const bitmap = await readStream(paddedBitmapSizeBytes)
      assert.strictEqual(Buffer.compare(bitmap.slice(0, netBitmapSizeBytes), expectedBitmap), 0, 'bitmap was not full of ones at LBA ' + lba)
      const block = await readStream(blockSizeBytes)
      yield { lba: lba, block }
    }
  }

  return { blockSizeBytes, blockGenerator: blockGenerator(), capacityBytes: footer.currentSize }
}
