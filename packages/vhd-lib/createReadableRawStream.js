const asyncIteratorToStream = require('async-iterator-to-stream')

const computeGeometryForSize = require('./_computeGeometryForSize')
const { createFooter } = require('./_createFooterHeader')

module.exports = asyncIteratorToStream(async function* (size, blockParser) {
  const geometry = computeGeometryForSize(size)
  const actualSize = geometry.actualSize
  const footer = createFooter(actualSize, Math.floor(Date.now() / 1000), geometry)
  let position = 0

  function* filePadding(paddingLength) {
    if (paddingLength > 0) {
      const chunkSize = 1024 * 1024 // 1Mo
      for (let paddingPosition = 0; paddingPosition + chunkSize < paddingLength; paddingPosition += chunkSize) {
        yield Buffer.alloc(chunkSize)
      }
      yield Buffer.alloc(paddingLength % chunkSize)
    }
  }

  let next
  while ((next = await blockParser.next()) !== null) {
    const paddingLength = next.logicalAddressBytes - position
    if (paddingLength < 0) {
      throw new Error('Received out of order blocks')
    }
    yield* filePadding(paddingLength)
    yield next.data
    position = next.logicalAddressBytes + next.data.length
  }
  yield* filePadding(actualSize - position)
  yield footer
})
