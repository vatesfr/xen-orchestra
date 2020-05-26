import assert from 'assert'

import ofHeader from './header'
import of from '../openflow-11'

// =============================================================================

const OFFSETS = of.offsets.hello

// =============================================================================

export default {
  pack: object => {
    const { header } = object
    assert(header.type === of.type.hello)
    header.length = of.sizes.hello

    return ofHeader.pack(header)
  },

  unpack: (buffer, offset = 0) => {
    const header = ofHeader.unpack(buffer, offset + OFFSETS.header)
    assert(header.type === of.type.hello)

    return { header }
  },
}
