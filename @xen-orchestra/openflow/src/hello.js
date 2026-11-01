import scheme from './default-header-scheme'

// =============================================================================

// OFPT_HELLO is type 0 in every OpenFlow version
export const HELLO_TYPE = 0

// OFPHET_VERSIONBITMAP (OpenFlow 1.3.1+): the versions the sender supports
const HELLO_ELEMENT_VERSION_BITMAP = 1
const HELLO_ELEMENT_HEADER_SIZE = 4

// A HELLO of any version: its header, and the versions its version bitmap
// lists, when it has one. A peer that supports a newer version than ours
// sends a HELLO of that version: it must be read, not refused, for the
// version negotiation of the OpenFlow spec (1.1 § A.5.1, 1.3.1 § 6.3.1).
export function unpackHello(buffer, offset = 0) {
  const version = buffer.readUInt8(offset + scheme.offsets.version)
  const length = buffer.readUInt16BE(offset + scheme.offsets.length)
  const xid = buffer.readUInt32BE(offset + scheme.offsets.xid)

  const versions = []
  const end = offset + Math.min(length, buffer.length - offset)
  let position = offset + scheme.size
  while (position + HELLO_ELEMENT_HEADER_SIZE <= end) {
    const type = buffer.readUInt16BE(position)
    const elementLength = buffer.readUInt16BE(position + 2)
    if (elementLength < HELLO_ELEMENT_HEADER_SIZE || position + elementLength > end) {
      break
    }
    if (type === HELLO_ELEMENT_VERSION_BITMAP) {
      for (let word = 0; HELLO_ELEMENT_HEADER_SIZE + 4 * (word + 1) <= elementLength; word++) {
        const bits = buffer.readUInt32BE(position + HELLO_ELEMENT_HEADER_SIZE + 4 * word)
        for (let bit = 0; bit < 32; bit++) {
          if ((bits >>> bit) & 1) {
            versions.push(32 * word + bit)
          }
        }
      }
    }
    // elements are padded to a multiple of 8 bytes
    position += Math.ceil(elementLength / 8) * 8
  }

  const hello = { header: { version, type: HELLO_TYPE, length, xid } }
  if (versions.length > 0) {
    hello.versions = versions
  }
  return hello
}

// The version to use with a peer whose HELLO this is, when we send a HELLO of
// the highest version we support without a version bitmap: the lower of both
// versions, if the peer supports it (its bitmap, when it sent one, says so)
// and we do. undefined: no common version, the connection must be closed.
export function negotiateVersion(hello, supported) {
  const version = Math.min(hello.header.version, Math.max(...supported))
  if (!supported.includes(version)) {
    return
  }
  if (hello.versions !== undefined && !hello.versions.includes(version)) {
    return
  }
  return version
}
