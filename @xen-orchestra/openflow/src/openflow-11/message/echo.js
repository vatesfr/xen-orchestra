import assert from 'assert'
import ofHeader from './header'
import of from '../openflow-11'

// =============================================================================

const OFFSETS = of.offsets.echo
const TYPES = [of.type.echoRequest, of.type.echoReply]

// =============================================================================

export default {
  pack: object => {
    const { header, data } = object
    assert(TYPES.includes(header.type))
    const dataSize = data !== undefined ? data.length : 0
    header.length = of.sizes.header + dataSize

    const buffer = Buffer.alloc(header.length)
    ofHeader.pack(header, buffer, OFFSETS.header)
    if (dataSize > 0) {
      data.copy(buffer, OFFSETS.data, 0, dataSize)
    }

    return buffer
  },

  unpack: (buffer, offset = 0) => {
    const header = ofHeader.unpack(buffer, offset + OFFSETS.header)
    assert(TYPES.includes(header.type))

    const object = { header }
    const dataSize = header.length - of.sizes.header
    if (dataSize > 0) {
      object.data = Buffer.alloc(dataSize)
      buffer.copy(object.data, 0, offset + OFFSETS.data, offset + OFFSETS.data + dataSize)
    }

    return object
  },
}
