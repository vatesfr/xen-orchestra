import get from '../../util/get-from-map'

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
  pack: (object, buffer = undefined, offset = 0) => {
    const { type } = object
    return get(ACTION, type, `Invalid action type: ${type}`).pack(object, buffer, offset)
  },

  unpack: (buffer, offset = 0) => {
    const type = buffer.readUInt16BE(offset + of.offsets.actionHeader.type)
    return get(ACTION, type, `Invalid action type: ${type}`).unpack(buffer, offset)
  },
}
