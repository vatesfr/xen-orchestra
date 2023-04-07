'use strict'

const diff = require('./_diff.js')
const StreamReader = require('./_StreamReader.js')
const { FOOTER_SIZE, HEADER_SIZE } = require('./_constants.js')
const { unpackFooter, unpackHeader } = require('./Vhd/_utils.js')

const toHex = buf => buf.toString('hex')

// Async generator that can be in a pipeline to check the header and footers of a VHD stream.
//
// ```js
// await pipeline(createVhdStream(), vhdStreamValidator, createOutputStream())
// ```
module.exports = async function* vhdStreamValidator(source) {
  let offset = 0
  try {
    const it = new StreamReader(source)

    const footer1 = await it.readStrict(FOOTER_SIZE)
    yield footer1

    // unpack and validate footer
    unpackFooter(footer1)

    offset += footer1.length

    const header = await it.readStrict(HEADER_SIZE)
    yield header

    // unpack and validate header
    unpackHeader(header)

    offset += header.length

    let last
    while (true) {
      const chunk = await it.read(FOOTER_SIZE)

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
    //  - save only expected data and diff
    // - save expected buffer as hex string for compacity and readability
    // - save diff as an array of differences represented as hex strings
    if (!last.equals(footer1)) {
      const error = new Error('footer1 !== footer2')
      error.diff = diff(footer1, last, toHex)
      error.expected = toHex(footer1)

      throw error
    }
  } catch (error) {
    error.offset = offset
    throw error
  }
}
