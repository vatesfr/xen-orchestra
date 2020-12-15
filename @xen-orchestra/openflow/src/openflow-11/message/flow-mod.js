import assert from 'assert'

import get from '../../util/get-from-map'
import ofInstruction from '../instruction/instruction'
import uIntHelper from '../../util/uint-helper'

import ofHeader from './header'
import of from '../openflow-11'
import ofMatch from '../struct/match/match'

// =============================================================================

const INSTRUCTION_SIZE = {
  [of.instructionType.goToTable]: of.sizes.instructionWriteMetadata,
  [of.instructionType.writeMetadata]: of.sizes.instructionGotoTable,
  [of.instructionType.clearActions]: of.sizes.instructionActions,
  [of.instructionType.writeActions]: of.sizes.instructionActions,
  [of.instructionType.applyActions]: of.sizes.instructionActions,
}

const ACTION_SIZE = {
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

const OFFSETS = of.offsets.flowMod

const COOKIE_LENGTH = 8
const PAD_LENGTH = 2

// =============================================================================

export default {
  pack: (object, buffer = undefined, offset = 0) => {
    const {
      header,
      cookie,
      cookie_mask,
      table_id = 0,
      command,
      idle_timeout = 0,
      hard_timeout = 0,
      priority = of.defaultPriority,
      buffer_id = 0xffffffff,
      out_port = of.port.any,
      out_group = of.group.any,
      flags = 0,
      match,
      instructions = [],
    } = object
    // fill header length
    header.length = of.sizes.flowMod
    instructions.forEach(instruction => {
      header.length += get(INSTRUCTION_SIZE, instruction.type, `Invalid instruction type: ${instruction.type}`)
      const { actions = [] } = instruction
      actions.forEach(action => {
        header.length += get(ACTION_SIZE, action.type, `Invalid instruction type: ${action.type}`)
      })
    })

    buffer = buffer !== undefined ? buffer : Buffer.alloc(header.length)

    ofHeader.pack(header, buffer, offset + OFFSETS.header)

    if (cookie !== undefined) {
      if (cookie_mask !== undefined) {
        cookie_mask.copy(buffer, offset + OFFSETS.cookieMask)
      } else {
        buffer.fill(0x00, offset + OFFSETS.cookie_mask, offset + OFFSETS.cookieMask + COOKIE_LENGTH)
      }
      cookie.copy(buffer, offset + OFFSETS.cookie)
    } else {
      buffer.fill(0x00, offset + OFFSETS.cookie, offset + OFFSETS.cookie + COOKIE_LENGTH)
      buffer.fill(0xff, offset + OFFSETS.cookieMask, offset + OFFSETS.cookieMask + COOKIE_LENGTH)
    }

    buffer.writeUInt8(table_id, offset + OFFSETS.tableId)
    assert(Object.values(of.flowModCommand).includes(command))
    buffer.writeUInt8(command, offset + OFFSETS.command)
    buffer.writeUInt16BE(idle_timeout, offset + OFFSETS.idleTimeout)
    buffer.writeUInt16BE(hard_timeout, offset + OFFSETS.hardTimeout)
    buffer.writeUInt16BE(priority, offset + OFFSETS.priority)
    buffer.writeUInt32BE(buffer_id, offset + OFFSETS.bufferId)
    buffer.writeUInt32BE(out_port, offset + OFFSETS.outPort)
    buffer.writeUInt32BE(out_group, offset + OFFSETS.outGroup)
    buffer.writeUInt16BE(flags, offset + OFFSETS.flags)
    buffer.fill(0, offset + OFFSETS.pad, offset + OFFSETS.pad + PAD_LENGTH)

    ofMatch.pack(match, buffer, offset + OFFSETS.match)

    let instructionOffset = offset + OFFSETS.instructions
    instructions.forEach(instruction => {
      ofInstruction.pack(instruction, buffer, instructionOffset)
      instructionOffset += instruction.len
    })

    return buffer
  },

  unpack: (buffer, offset = 0) => {
    const header = ofHeader.unpack(buffer, offset + OFFSETS.header)
    assert(header.type === of.type.flowMod)

    const object = { header }

    object.cookie = Buffer.alloc(COOKIE_LENGTH)
    buffer.copy(object.cookie, 0, offset + OFFSETS.cookie, offset + OFFSETS.cookie + COOKIE_LENGTH)
    if (
      !uIntHelper.isUInt64None([
        buffer.readUInt32BE(offset + OFFSETS.cookieMask),
        buffer.readUInt32BE(offset + OFFSETS.cookieMask + COOKIE_LENGTH / 2),
      ])
    ) {
      object.cookie_mask = Buffer.alloc(COOKIE_LENGTH)
      buffer.copy(object.cookie_mask, 0, offset + OFFSETS.cookieMask, offset + OFFSETS.cookieMask + COOKIE_LENGTH)
    }

    object.table_id = buffer.readUInt8(offset + OFFSETS.tableId)
    object.command = buffer.readUInt8(offset + OFFSETS.command)
    assert(Object.values(of.flowModCommand).includes(object.command))

    object.idle_timeout = buffer.readUInt16BE(offset + OFFSETS.idleTimeout)
    object.hard_timeout = buffer.readUInt16BE(offset + OFFSETS.hardTimeout)
    object.priority = buffer.readUInt16BE(offset + OFFSETS.priority)
    object.buffer_id = buffer.readUInt32BE(offset + OFFSETS.bufferId)
    object.out_port = buffer.readUInt32BE(offset + OFFSETS.outPort)
    object.out_group = buffer.readUInt32BE(offset + OFFSETS.outGroup)
    object.flags = buffer.readUInt16BE(offset + OFFSETS.flags)

    object.match = ofMatch.unpack(buffer, offset + OFFSETS.match)

    object.instructions = []
    let instructionOffset = offset + OFFSETS.instructions
    while (instructionOffset < header.length) {
      const instruction = ofInstruction.unpack(buffer, instructionOffset)
      object.instructions.push(instruction)
      instructionOffset += instruction.len
    }

    return object
  },
}
