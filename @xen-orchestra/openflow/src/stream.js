import of from './index'
import scheme from './default-header-scheme'

// =============================================================================

export default class Stream {
  constructor() {
    this.length = 1024
    this.buffer = Buffer.alloc(this.length)
    this.size = 0
  }

  // ---------------------------------------------------------------------------

  process(data, offset = 0) {
    const dataSize = data.length - offset
    if (dataSize < scheme.size) {
      // Received packet is too small
      data.copy(this.buffer, 0, offset)
      this.size = dataSize
      return []
    }

    const msgSize = data.readUInt16BE(offset + scheme.offsets.length)
    const msgDataSize = msgSize - this.size
    if (dataSize < msgDataSize) {
      if (this.length < msgSize) {
        // Internal buffer too small!
        this._resize(msgSize)
      }

      // Not finish receiving
      data.copy(this.buffer, 0, offset)
      this.size += dataSize
      return []
    }

    data.copy(this.buffer, this.size, offset, offset + msgSize - this.size)

    this.size = 0
    const result = of.toJson(data, offset)
    if (data.length - offset === msgDataSize) {
      return [result]
    }

    return [result].concat(this.process(data, offset + msgSize))
  }

  // ===========================================================================

  _resize(size) {
    let newLength = this.length
    do {
      newLength *= 2
    } while (newLength < size)

    const newBuffer = Buffer.alloc(newLength)
    this.buffer.copy(newBuffer, 0, 0, this.size)
    this.buffer = newBuffer
  }
}
