import { computeBlockBitmapSize, sectorsRoundUpNoZero } from './Vhd/_utils'
import { parseVhdStream } from './_parseVhdStream'
import { SECTOR_SIZE } from './_constants'

async function* filteredGenerator(iterator, filter) {
  for await (const item of iterator) {
    if (filter(item) === true) {
      yield item
    }
  }
}

export async function parseVhdToBlocks(inputStream) {
  const sourceIterator = parseVhdStream(inputStream)
  const sourceWithoutParentLocatorIterator = filteredGenerator(sourceIterator, ({ type }) => type !== 'parentLocator')

  const footer = sourceWithoutParentLocatorIterator.next().value
  const header = sourceWithoutParentLocatorIterator.next().value
  // without parent locator we have footer -header-bat-blocks-footer

  const { blockCount } = sourceWithoutParentLocatorIterator.next().value
  const blockGenerator = filteredGenerator(sourceIterator, ({ type }) => type === 'block')

  return {
    // each block have data + a bitmap
    blockSizeBytes: header.blockSize + sectorsRoundUpNoZero(computeBlockBitmapSize(header.blockSize)) * SECTOR_SIZE,
    blockCount,
    capacityBytes: footer.currentSize,
    geometry: footer.diskGeometry,
    blockGenerator,
  }
}
