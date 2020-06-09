import assert from 'assert'

import of from '../openflow-11'

// =============================================================================

const OFFSETS = of.offsets.header

// =============================================================================

export default {
  pack: (object, buffer = undefined, offset = 0) => {
    buffer = buffer !== undefined ? buffer : Buffer.alloc(of.sizes.header)
    const { version, type, length, xid } = object

    assert(version === of.version)
    assert(Object.values(of.type).includes(type))

    buffer.writeUInt8(version, offset + OFFSETS.version)
    buffer.writeUInt8(type, offset + OFFSETS.type)
    buffer.writeUInt16BE(length, offset + OFFSETS.length)
    buffer.writeUInt32BE(xid, offset + OFFSETS.xid)

    return buffer
  },

  unpack: (buffer, offset = 0) => {
    const version = buffer.readUInt8(offset + OFFSETS.version)
    assert(version === of.version)

    const type = buffer.readUInt8(offset + OFFSETS.type)
    assert(Object.values(of.type).includes(type))

    const length = buffer.readUInt16BE(offset + OFFSETS.length)
    const xid = buffer.readUInt32BE(offset + OFFSETS.xid)

    return { version, type, length, xid }
  },
}
