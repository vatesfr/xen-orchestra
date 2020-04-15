import assert from 'assert'
import ofOutput from './output'
import of from '../openflow-11'

// =============================================================================

const ACTION = {
  [of.actionType.output]: ofOutput,
  /* TODO:
  [of.actionType.group]: ,
  [of.actionType.setVlanId]: ,
  [of.actionType.setVlanPcp]: ,
  [of.actionType.setDlSrc]: ,
  [of.actionType.setDlDst]: ,
  [of.actionType.setNwSrc]: ,
  [of.actionType.setNwDst]: ,
  [of.actionType.setNwTos]: ,
  [of.actionType.setNwEcn]: ,
  [of.actionType.setTpSrc]: ,
  [of.actionType.setTpDst]: ,
  [of.actionType.copyTtlOut]: ,
  [of.actionType.copyTtlIn]: ,
  [of.actionType.setMplsLabel]: ,
  [of.actionType.setMplsTc]: ,
  [of.actionType.setMplsTtl]: ,
  [of.actionType.decMplsTtl]: ,
  [of.actionType.pushVlan]: ,
  [of.actionType.popVlan]: ,
  [of.actionType.pushMpls]: ,
  [of.actionType.popMpls]: ,
  [of.actionType.setQueue]: ,
  [of.actionType.setNwTtl]: ,
  [of.actionType.decNwTtl]: ,
  [of.actionType.experimenter]:
  */
}

// =============================================================================

export default {
  fromJson: (object, buffer = undefined, offset = 0) => {
    const { type } = object
    assert(Object.keys(ACTION).includes(String(type)))

    return ACTION[type].fromJson(object, buffer, offset)
  },

  toJson: (buffer, offset = 0) => {
    const type = buffer.readUInt16BE(offset + of.offsets.actionHeader.type)
    assert(Object.keys(ACTION).includes(String(type)))

    return ACTION[type].toJson(buffer, offset)
  },
}
