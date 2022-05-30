'use strict'

const { readChunk } = require('@vates/read-chunk')

const { FOOTER_SIZE } = require('./_constants')
const { unpackFooter } = require('./Vhd/_utils.js')

module.exports = async function peekFooterFromStream(stream) {
  const buffer = await readChunk(stream, FOOTER_SIZE)
  stream.unshift(buffer)
  return unpackFooter(buffer)
}
