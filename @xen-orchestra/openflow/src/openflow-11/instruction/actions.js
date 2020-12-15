import assert from 'assert'

import get from '../../util/get-from-map'

import ofAction from '../action/action'
import of from '../openflow-11'

// =============================================================================

const SIZES = {
  [of.actionType.output]: of.sizes.actionOutput,
  [of.actionType.group]: of.sizes.actionGroup,
  [of.actionType.setVlanId]: of.sizes.actionVlanId,
  [of.actionType.setVlanPcp]: of.sizes.actionVlanPcp,
  [of.actionType.setDlSrc]: of.sizes.actionDlAddr,
  [of.actionType.setDlDst]: of.sizes.actionDlAddr,
  [of.actionType.setNwSrc]: of.sizes.actionNwAddr,
  [of.actionType.setNwDst]: of.sizes.actionNwAddr,
  [of.actionType.setNwTos]: of.sizes.actionNwTos,
  [of.actionType.setNwEcn]: of.sizes.actionNwEcn,
  [of.actionType.setTpSrc]: of.sizes.actionTpPort,
  [of.actionType.setTpDst]: of.sizes.actionTpPort,
  [of.actionType.copyTtlOut]: of.sizes.actionHeader,
  [of.actionType.copyTtlIn]: of.sizes.actionHeader,
  [of.actionType.setMplsLabel]: of.sizes.actionMplsLabel,
  [of.actionType.setMplsTc]: of.sizes.actionMplsTc,
  [of.actionType.setMplsTtl]: of.sizes.actionMplsTtl,
  [of.actionType.decMplsTtl]: of.sizes.actionMplsTtl,
  [of.actionType.pushVlan]: of.sizes.actionPush,
  [of.actionType.popVlan]: of.sizes.actionHeader,
  [of.actionType.pushMpls]: of.sizes.actionPush,
  [of.actionType.popMpls]: of.sizes.actionPopMpls,
  [of.actionType.setQueue]: of.sizes.actionSetQueue,
  [of.actionType.setNwTtl]: of.sizes.actionNwTtl,
  [of.actionType.decNwTtl]: of.sizes.actionNwTtl,
}

// -----------------------------------------------------------------------------

const TYPES = [of.instructionType.clearActions, of.instructionType.writeActions, of.instructionType.applyActions]
const OFFSETS = of.offsets.instructionActions

const PAD_LENGTH = 4

// =============================================================================

export default {
  pack: (object, buffer = undefined, offset = 0) => {
    const { type } = object
    assert(TYPES.includes(type))
    object.len = of.sizes.instructionActions
    const { actions = [] } = object
    actions.forEach(action => {
      assert(Object.values(of.actionType).includes(action.type))
      // TODO: manage experimenter
      object.len += get(SIZES, action.type, `Invalid action type: ${action.type}`)
    })

    buffer = buffer !== undefined ? buffer : Buffer.alloc(object.len)

    buffer.writeUInt16BE(type, offset + OFFSETS.type)
    buffer.writeUInt16BE(object.len, offset + OFFSETS.len)
    buffer.fill(0, offset + OFFSETS.pad, offset + OFFSETS.pad + PAD_LENGTH)

    let actionOffset = offset + OFFSETS.actions
    actions.forEach(action => {
      ofAction.pack(action, buffer, actionOffset)
      actionOffset += SIZES[action.type]
    })
  },

  unpack: (buffer = undefined, offset = 0) => {
    const type = buffer.readUInt16BE(offset + OFFSETS.type)
    assert(TYPES.includes(type))

    const object = { type }
    object.len = buffer.readUInt16BE(offset + OFFSETS.len)

    if (type === of.instructionType.clearActions) {
      // No actions for this type
      return object
    }

    object.actions = []
    let actionOffset = offset + OFFSETS.actions
    while (actionOffset < object.len) {
      const action = ofAction.unpack(buffer, actionOffset)
      actionOffset += action.len
      object.actions.push(action)
    }

    return object
  },
}
