import assert from 'assert'

import ofHeader from './header'
import of from '../openflow-11'

// =============================================================================

export default {
  pack: object => {
    const { header } = object
    assert(header.type === of.type.featuresRequest)
    header.length = of.sizes.featuresRequest

    return ofHeader.pack(header)
  },

  unpack: (buffer, offset = 0) => {
    const header = ofHeader.unpack(buffer, offset)
    assert(header.type === of.type.featuresRequest)
    assert(header.length === of.sizes.featuresRequest)

    return { header }
  },
}
