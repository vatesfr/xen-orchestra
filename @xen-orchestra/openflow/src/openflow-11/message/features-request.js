import assert from 'assert'
import ofHeader from './header'
import of from '../openflow-11'

// =============================================================================

export default {
  fromJson: object => {
    const { header } = object
    assert(header.type === of.type.featuresRequest)
    header.length = of.sizes.featuresRequest

    return ofHeader.fromJson(header)
  },

  toJson: (buffer, offset = 0) => {
    const header = ofHeader.toJson(buffer, offset)
    assert(header.type === of.type.featuresRequest)
    assert(header.length === of.sizes.featuresRequest)

    return { header }
  },
}
