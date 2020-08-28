import assert from 'assert'

import ofHeader from './header'
import of from '../openflow-11'

// =============================================================================

const OFFSETS = of.offsets.switchConfig
const TYPES = [of.type.getConfigReply, of.type.setConfig]

// =============================================================================

export default {
  pack: object => {
    const { header, flags, miss_send_len } = object
    assert(TYPES.includes(header.type))
    header.length = of.sizes.switchConfig

    const buffer = Buffer.alloc(header.length)
    ofHeader.pack(header, buffer, OFFSETS.header)

    buffer.writeUInt16BE(flags, OFFSETS.flags)
    buffer.writeUInt16BE(miss_send_len, OFFSETS.missSendLen)

    return buffer
  },

  unpack: (buffer, offset = 0) => {
    const header = ofHeader.unpack(buffer, offset + OFFSETS.header)
    assert(TYPES.includes(header.type))
    assert(header.length === of.sizes.switchConfig)

    const flags = buffer.readUInt16BE(offset + OFFSETS.flags)
    const miss_send_len = buffer.readUInt16BE(offset + OFFSETS.missSendLen)

    return { header, flags, miss_send_len }
  },
}
