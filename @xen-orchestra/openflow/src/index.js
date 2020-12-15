import get from './util/get-from-map'
import ofVersion from './version'
// TODO: More openflow versions
import of11 from './openflow-11/index'
import scheme from './default-header-scheme'

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

  unpack: (buffer, offset = 0) => {
    const version = buffer.readUInt8(offset + scheme.offsets.version)
    return get(OPENFLOW, version, `Unsupported OpenFlow version: ${version}`).unpack(buffer, offset)
  },
}
