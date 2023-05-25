'use strict'
const { readChunkStrict } = require('@vates/read-chunk')
const { FOOTER_SIZE, DISK_TYPES } = require('./_constants')
const { unpackFooter } = require('./Vhd/_utils')

module.exports = async function isVhdDifferencingDisk(stream) {
  const bufFooter = await readChunkStrict(stream, FOOTER_SIZE)
  stream.unshift(bufFooter)
  const footer = unpackFooter(bufFooter)
  return footer.diskType === DISK_TYPES.DIFFERENCING
}
