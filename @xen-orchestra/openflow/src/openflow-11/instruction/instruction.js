import get from '../../util/get-from-map'

import actions from './actions'
// import goToTable from './goToTable'
import of from '../openflow-11'
// import writeMetadata from './writeMetadata'

// =============================================================================

const INSTRUCTION = {
  /* TODO:
  [of.instructionType.goToTable]: goToTable,
  [of.instructionType.writeMetadata]: writeMetadata,
  */
  [of.instructionType.writeActions]: actions,
  [of.instructionType.applyActions]: actions,
  [of.instructionType.clearActions]: actions,
}

// -----------------------------------------------------------------------------

const OFFSETS = of.offsets.instruction

// =============================================================================

export default {
  pack: (object, buffer = undefined, offset = 0) => {
    const { type } = object
    return get(INSTRUCTION, type, `Invalid instruction type: ${type}`).pack(object, buffer, offset)
  },

  unpack: (buffer = undefined, offset = 0) => {
    const type = buffer.readUInt16BE(offset + OFFSETS.type)
    return get(INSTRUCTION, type, `Invalid instruction type: ${type}`).unpack(buffer, offset)
  },
}
