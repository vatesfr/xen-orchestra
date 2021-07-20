import assert from 'assert'
import util from 'util'

// =============================================================================

export default {
  isEthMaskNone: (buffer, offset) =>
    buffer.readUInt32BE(offset) === 0x00000000 && buffer.readUInt16BE(offset + 4) === 0x0000,

  isEthMaskAll: (buffer, offset) =>
    buffer.readUInt32BE(offset) === 0xffffffff && buffer.readUInt16BE(offset + 4) === 0xffff,

  isIp4MaskNone: (buffer, offset) => buffer.readUInt32BE(offset) === 0x00000000,

  isIp4MaskAll: (buffer, offset) => buffer.readUInt32BE(offset) === 0xffffffff,

  ethToString: (buffer, offset) =>
    buffer.toString('hex', offset, offset + 1) +
    ':' +
    buffer.toString('hex', offset + 1, offset + 2) +
    ':' +
    buffer.toString('hex', offset + 2, offset + 3) +
    ':' +
    buffer.toString('hex', offset + 3, offset + 4) +
    ':' +
    buffer.toString('hex', offset + 4, offset + 5) +
    ':' +
    buffer.toString('hex', offset + 5, offset + 6),

  stringToEth: (string, buffer, offset) => {
    const eth =
      /^([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2})$/.exec(
        string
      )
    assert(eth !== null)
    buffer.writeUInt8(parseInt(eth[1], 16), offset)
    buffer.writeUInt8(parseInt(eth[2], 16), offset + 1)
    buffer.writeUInt8(parseInt(eth[3], 16), offset + 2)
    buffer.writeUInt8(parseInt(eth[4], 16), offset + 3)
    buffer.writeUInt8(parseInt(eth[5], 16), offset + 4)
    buffer.writeUInt8(parseInt(eth[6], 16), offset + 5)
  },

  ip4ToString: (buffer, offset) =>
    util.format(
      '%d.%d.%d.%d',
      buffer.readUInt8(offset),
      buffer.readUInt8(offset + 1),
      buffer.readUInt8(offset + 2),
      buffer.readUInt8(offset + 3)
    ),

  stringToip4: (string, buffer, offset) => {
    const ip =
      /^([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])$/.exec(
        string
      )
    assert(ip !== null)
    buffer.writeUInt8(parseInt(ip[1], 10), offset)
    buffer.writeUInt8(parseInt(ip[2], 10), offset + 1)
    buffer.writeUInt8(parseInt(ip[3], 10), offset + 2)
    buffer.writeUInt8(parseInt(ip[4], 10), offset + 3)
  },
}
