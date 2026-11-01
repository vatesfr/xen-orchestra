import get from './util/get-from-map'
import ofVersion from './version'
// TODO: More openflow versions
import of11 from './openflow-11/index'
import scheme from './default-header-scheme'
import { HELLO_TYPE, negotiateVersion, unpackHello } from './hello'

// =============================================================================

const OPENFLOW = {
  [ofVersion.openFlow11]: of11,
}

// =============================================================================

export default {
  versions: ofVersion,
  protocols: { [ofVersion.openFlow11]: of11.protocol },

  // ---------------------------------------------------------------------------

  pack: object => {
    const version = object.header.version
    return get(OPENFLOW, version, `Unsupported OpenFlow version: ${version}`).pack(object)
  },

  // the version to use with the peer that sent this HELLO (see ./hello.js),
  // among the versions this package supports; undefined: none in common
  negotiate: hello => negotiateVersion(hello, Object.values(ofVersion)),

  unpack: (buffer, offset = 0) => {
    // a HELLO is read whatever its version: version negotiation needs it
    if (buffer.readUInt8(offset + scheme.offsets.type) === HELLO_TYPE) {
      return unpackHello(buffer, offset)
    }

    const version = buffer.readUInt8(offset + scheme.offsets.version)
    return get(OPENFLOW, version, `Unsupported OpenFlow version: ${version}`).unpack(buffer, offset)
  },
}
