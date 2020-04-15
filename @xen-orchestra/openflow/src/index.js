import assert from 'assert'
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
  version: ofVersion,
  protocol: { [ofVersion.openFlow11]: of11.protocol },

  // ---------------------------------------------------------------------------

  fromJson: object => {
    const version = object.header.version
    assert(Object.keys(OPENFLOW).includes(String(version)))

    return OPENFLOW[version].fromJson(object)
  },

  toJson: (buffer, offset = 0) => {
    const version = buffer.readUInt8(offset + scheme.offsets.version)
    assert(Object.keys(OPENFLOW).includes(String(version)))

    return OPENFLOW[version].toJson(buffer, offset)
  },
}
