import assert from 'assert'

import of from '../openflow-11'

// =============================================================================

const OFFSETS = of.offsets.actionOutput

const PAD_LENGTH = 6

// =============================================================================

export default {
  pack: (object, buffer = undefined, offset = 0) => {
    assert(object.type === of.actionType.output)
    object.len = of.sizes.actionOutput

    buffer = buffer !== undefined ? buffer : Buffer.alloc(object.len)

    buffer.writeUInt16BE(object.type, offset + OFFSETS.type)
    buffer.writeUInt16BE(object.len, offset + OFFSETS.len)

    buffer.writeUInt32BE(object.port, offset + OFFSETS.port)
    buffer.writeUInt16BE(object.max_len, offset + OFFSETS.maxLen)

    buffer.fill(0, offset + OFFSETS.pad, offset + OFFSETS.pad + PAD_LENGTH)

    return buffer
  },

  unpack: (buffer, offset = 0) => {
    const object = {}

    object.type = buffer.readUInt16BE(offset + OFFSETS.type)
    assert(object.type === of.actionType.output)

    object.len = buffer.readUInt16BE(offset + OFFSETS.len)
    assert(object.len === of.sizes.actionOutput)

    object.port = buffer.readUInt32BE(offset + OFFSETS.port)
    object.max_len = buffer.readUInt16BE(offset + OFFSETS.maxLen)

    return object
  },
}
