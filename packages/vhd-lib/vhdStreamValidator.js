'use strict'

const diff = require('@vates/diff')
const StreamReader = require('@vates/stream-reader')

const { FOOTER_SIZE, HEADER_SIZE } = require('./_constants.js')
const { unpackFooter, unpackHeader } = require('./Vhd/_utils.js')

// Async generator that can be in a pipeline to check the header and footers of a VHD stream.
//
// ```js
// await pipeline(createVhdStream(), vhdStreamValidator, createOutputStream())
// ```
module.exports = async function* vhdStreamValidator(source) {
  let offset = 0
  try {
    const reader = new StreamReader(source)

    const footer1 = await reader.readStrict(FOOTER_SIZE)
    yield footer1

    // unpack and validate footer
    unpackFooter(footer1)

    offset += footer1.length

    const header = await reader.readStrict(HEADER_SIZE)
    yield header

    // unpack and validate header
    unpackHeader(header)

    offset += header.length

    let last
    while (true) {
      const chunk = await reader.read(FOOTER_SIZE)

      if (chunk === null) {
        // the end has been reached, `last` contains the footer
        break
      }

      yield chunk

      offset += chunk.length

      if (chunk.length < FOOTER_SIZE) {
        // the end has been reached, the footer is part in `last` and part in `chunk`
        last = Buffer.concat([last.slice(-(FOOTER_SIZE - chunk.length)), chunk])
        break
      }

      last = chunk
    }

    // offset is the position at which the footer was read, not the position after
    offset -= last.length

    // do not use `assert.strictDeepEqual` as it does not provide a compact (for buffers) or complete (for strings) result
    //
    // - save only expected data and diff
    // - save expected buffer as hex string for compactness and readability
    // - save diff as an array of differences represented as hex strings
    if (!last.equals(footer1)) {
      const error = new Error('footer1 !== footer2')
      error.diff = []
      diff(footer1, last, (i, buf) => {
        error.diff.push(i, buf.toString('hex'))
      })
      error.expected = footer1.toString('hex')

      throw error
    }
  } catch (error) {
    error.offset = offset
    throw error
  }
}
