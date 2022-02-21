const { readChunk } = require('@vates/read-chunk')

const { FOOTER_SIZE } = require('./_constants')
const { fuFooter } = require('./_structs')

module.exports = async function peekFooterFromStream(stream) {
  const footerBuffer = await readChunk(stream, FOOTER_SIZE)
  const footer = fuFooter.unpack(footerBuffer)
  stream.unshift(footerBuffer)
  return footer
}
