import assert from 'assert'
import actions from './actions'
// import goToTable from './goToTable'
import of from '../openflow-11'
// import writeMetadata from './writeMetadata'

// =============================================================================

const INSTRUCTION = {
  /* TODO:
  [of.instructionType.goToTable]: goToTable.fromJson,
  [of.instructionType.writeMetadata]: writeMetadata.fromJson,
  */
  [of.instructionType.writeActions]: actions,
  [of.instructionType.applyActions]: actions,
  [of.instructionType.clearActions]: actions,
}

// -----------------------------------------------------------------------------

const OFFSETS = of.offsets.instruction

// =============================================================================

export default {
  fromJson: (object, buffer = undefined, offset = 0) => {
    const { type } = object
    assert(Object.keys(INSTRUCTION).includes(String(type)))

    return INSTRUCTION[type].fromJson(object, buffer, offset)
  },

  toJson: (buffer = undefined, offset = 0) => {
    const type = buffer.readUInt16BE(offset + OFFSETS.type)
    assert(Object.keys(INSTRUCTION).includes(String(type)))

    return INSTRUCTION[type].toJson(buffer, offset)
  },
}
