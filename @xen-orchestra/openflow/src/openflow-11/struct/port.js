import of from '../openflow-11'
import addressParser from '../../util/addrress-parser'

// =============================================================================

const OFFSETS = of.offsets.port
const PAD_LENGTH = 4
const PAD2_LENGTH = 2

// =============================================================================

export default {
  pack: (object, buffer = undefined, offset = 0) => {
    buffer = buffer !== undefined ? buffer : Buffer.alloc(of.sizes.port)
    const {
      port_no: portNo,
      hw_addr: hwAddr,
      name,
      config,
      state,
      curr,
      advertised,
      supported,
      peer,
      curr_speed: currSpeed,
      max_speed: maxSpeed,
    } = object

    buffer.writeUInt32BE(portNo, offset + OFFSETS.portNo)
    buffer.fill(0, offset + OFFSETS.pad, offset + OFFSETS.pad + PAD_LENGTH)
    addressParser.stringToEth(hwAddr, buffer, offset + OFFSETS.hwAddr)
    buffer.fill(0, offset + OFFSETS.pad, offset + OFFSETS.pad + PAD2_LENGTH)
    buffer.write(name, offset + OFFSETS.name, of.maxPortNameLen)
    if (name.length < of.maxPortNameLen) {
      buffer.fill(0, offset + OFFSETS.name + name.length, offset + OFFSETS.name + of.maxPortNameLen)
    }

    buffer.writeUInt32BE(config, offset + OFFSETS.config)
    buffer.writeUInt32BE(state, offset + OFFSETS.state)
    buffer.writeUInt32BE(curr, offset + OFFSETS.curr)
    buffer.writeUInt32BE(advertised, offset + OFFSETS.advertised)
    buffer.writeUInt32BE(supported, offset + OFFSETS.supported)
    buffer.writeUInt32BE(peer, offset + OFFSETS.peer)
    buffer.writeUInt32BE(currSpeed, offset + OFFSETS.currSpeed)
    buffer.writeUInt32BE(maxSpeed, offset + OFFSETS.maxSpeed)
    return buffer
  },

  unpack: (buffer, offset = 0) => {
    const body = {}

    body.port_no = buffer.readUInt32BE(offset + OFFSETS.portNo)
    body.hw_addr = addressParser.ethToString(buffer, offset + OFFSETS.hwAddr)

    const name = buffer.toString('utf8', offset + OFFSETS.name, offset + OFFSETS.name + of.maxPortNameLen)
    body.name = name.substr(0, name.indexOf('\0')) // Remove useless 0 if name.length < of.maxPortNameLen

    body.config = buffer.readUInt32BE(offset + OFFSETS.config)
    body.state = buffer.readUInt32BE(offset + OFFSETS.state)

    body.curr = buffer.readUInt32BE(offset + OFFSETS.curr)
    body.advertised = buffer.readUInt32BE(offset + OFFSETS.advertised)
    body.supported = buffer.readUInt32BE(offset + OFFSETS.supported)
    body.peer = buffer.readUInt32BE(offset + OFFSETS.peer)

    body.curr_speed = buffer.readUInt32BE(offset + OFFSETS.currSpeed)
    body.max_speed = buffer.readUInt32BE(offset + OFFSETS.maxSpeed)

    return body
  },
}
