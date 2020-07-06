import assert from 'assert'

import of from './index'
import scheme from './default-header-scheme'
import { readChunk } from '@vates/read-chunk'

// =============================================================================

export default async function* parse(socket) {
  let buffer = Buffer.alloc(1024)
  let data

  // Read the header
  while ((data = await readChunk(socket, scheme.size)) !== null) {
    // Read OpenFlow message size from its header
    const msgSize = data.readUInt16BE(scheme.offsets.length)
    data.copy(buffer, 0, 0, scheme.size)

    if (buffer.length < msgSize) {
      buffer = resize(buffer, msgSize)
    }

    // Read the rest of the openflow message
    if (msgSize > scheme.size) {
      data = await readChunk(socket, msgSize - scheme.size)
      assert.notStrictEqual(data, null)
      data.copy(buffer, scheme.size, 0, msgSize - scheme.size)
    }

    yield of.unpack(buffer)
  }
}

// -----------------------------------------------------------------------------

function resize(buffer, size) {
  let newLength = buffer.length
  do {
    newLength *= 2
  } while (newLength < size)

  const newBuffer = Buffer.alloc(newLength)
  buffer.copy(newBuffer)
  return newBuffer
}
