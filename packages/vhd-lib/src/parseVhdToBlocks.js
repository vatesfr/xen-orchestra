import assert from 'assert'

import { computeFullBlockSize } from './Vhd/_utils'
import { parseVhdStream } from './_parseVhdStream'

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

async function* onlyBlocks(iterable) {
  for await (const item of iterable) {
    if (item.type === 'block') {
      yield item
    }
  }
}

export async function parseVhdToBlocks(vhdStream) {
  const iterator = parseVhdStream(vhdStream)

  const footer = await next(iterator, 'footer')
  const header = await next(iterator, 'header')

  // ignore all parent locators that could be before the BAT
  const { blockCount } = await next(iterator, 'bat', 'parentLocator')

  return {
    // each block have data + a bitmap
    blockSizeBytes: computeFullBlockSize(header.blockSize),
    blockCount,
    capacityBytes: footer.currentSize,
    geometry: footer.diskGeometry,
    blocks: onlyBlocks(iterator),
  }
}
