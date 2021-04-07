import { readChunk } from '@vates/read-chunk'

import { FOOTER_SIZE } from './_constants'
import { fuFooter } from './_structs'

export default async function peekFooterFromStream(stream) {
  const footerBuffer = await readChunk(stream, FOOTER_SIZE)
  const footer = fuFooter.unpack(footerBuffer)
  stream.unshift(footerBuffer)
  return footer
}
