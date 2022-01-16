import assert from 'assert'
import { parseVhdStream } from 'vhd-lib/parseVhdStream.js'

async function next(iterator, type, skipableType) {
  let item
  do {
    const cursor = await iterator.next()
    assert.strictEqual(cursor.done, false, 'iterator is done')

    item = cursor.value
  } while (item.type === skipableType)
  assert.strictEqual(item.type, type)
  return item
}

async function* onlyBlocks(iterable, blockSize) {
  for await (const item of iterable) {
    if (item.type === 'block') {
      // transform to blocks expected by generateVmdkData
      // rename the property and remove the block bitmap
      const { id, data } = item
      yield { lba: id * blockSize, block: data }
    }
  }
}

export async function parseVhdToBlocks(vhdStream) {
  const iterator = parseVhdStream(vhdStream)

  const { footer } = await next(iterator, 'footer')
  const { header } = await next(iterator, 'header')

  // ignore all parent locators that could be before the BAT
  const { blockCount } = await next(iterator, 'bat', 'parentLocator')

  return {
    blockSize: header.blockSize,
    blockCount,
    diskSize: footer.currentSize,
    geometry: footer.diskGeometry,
    blocks: onlyBlocks(iterator, header.blockSize),
  }
}
