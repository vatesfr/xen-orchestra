import assert from 'assert'

import ofHeader from './header'
import ofPort from '../struct/port'
import of from '../openflow-11'

// =============================================================================

const OFFSETS = of.offsets.switchFeatures
const PAD_LENGTH = 3

// =============================================================================

export default {
  pack: object => {
    const { header, datapath_id: did, n_buffers: nBufs, n_tables: nTables, capabilities, reserved, ports } = object
    assert(header.type === of.type.featuresReply)

    header.length = of.sizes.switchFeatures + ports.length * of.sizes.port

    const buffer = Buffer.alloc(header.length)
    ofHeader.pack(header, buffer, OFFSETS.header)

    buffer.writeBigUInt64BE(did, OFFSETS.datapathId)
    buffer.writeUInt32BE(nBufs, OFFSETS.nBuffers)
    buffer.writeUInt8(nTables, OFFSETS.nTables)
    buffer.fill(0, OFFSETS.pad, OFFSETS.pad + PAD_LENGTH)
    buffer.writeUInt32BE(capabilities, OFFSETS.capabilities)
    buffer.writeUInt32BE(reserved, OFFSETS.reserved)

    let portsOffset = 0
    ports.forEach(port => {
      ofPort.pack(port, buffer, OFFSETS.ports + portsOffset++ * of.sizes.port)
    })

    return buffer
  },

  unpack: (buffer, offset = 0) => {
    const header = ofHeader.unpack(buffer, offset + OFFSETS.header)
    assert(header.type === of.type.featuresReply)

    const object = { header }
    object.datapath_id = buffer.toString('hex', offset + OFFSETS.datapathId, offset + OFFSETS.datapathId + 8)
    object.n_buffers = buffer.readUInt32BE(offset + OFFSETS.nBuffers)
    object.n_tables = buffer.readUInt8(offset + OFFSETS.nTables)

    object.capabilities = buffer.readUInt32BE(offset + OFFSETS.capabilities)
    object.reserved = buffer.readUInt32BE(offset + OFFSETS.reserved)

    object.ports = []
    const nPorts = (header.length - of.sizes.switchFeatures) / of.sizes.port
    for (let i = 0; i < nPorts; ++i) {
      object.ports.push(ofPort.unpack(buffer, offset + OFFSETS.ports + i * of.sizes.port))
    }

    return object
  },
}
