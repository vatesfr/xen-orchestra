import assert from 'assert'
import addressParser from '../../../util/address-parser'
import uIntHelper from '../../../util/uint-helper'
import of from '../../openflow-11'

// =============================================================================

const OFFSETS = of.offsets.match
const WILDCARDS = of.flowWildcards

const IP4_ADDR_LEN = 4
const METADATA_LENGTH = 8
const PAD_LENGTH = 1
const PAD2_LENGTH = 3

// =============================================================================

export default {
  pack: (object, buffer = undefined, offset = 0) => {
    assert(object.type === of.matchType.standard)
    object.length = of.sizes.match
    buffer = buffer !== undefined ? buffer : Buffer.alloc(object.length)

    buffer.writeUInt16BE(object.type, offset + OFFSETS.type)
    buffer.writeUInt16BE(object.length, offset + OFFSETS.length)

    let wildcards = 0
    let inPort = 0
    if (object.in_port !== undefined) {
      inPort = object.in_port
    } else {
      wildcards |= WILDCARDS.inPort
    }
    buffer.writeUInt32BE(inPort, offset + OFFSETS.inPort)

    if (object.dl_src !== undefined) {
      if (object.dl_src_mask !== undefined) {
        addressParser.stringToEth(object.dl_src_mask, buffer, offset + OFFSETS.dlSrcMask)
      } else {
        buffer.fill(0x00, offset + OFFSETS.dlSrcMask, offset + OFFSETS.dlSrcMask + of.ethAddrLen)
      }
      addressParser.stringToEth(object.dl_src, buffer, offset + OFFSETS.dlSrc)
    } else {
      buffer.fill(0x00, offset + OFFSETS.dlSrc, offset + OFFSETS.dlSrc + of.ethAddrLen)
      buffer.fill(0xff, offset + OFFSETS.dlSrcMask, offset + OFFSETS.dlSrcMask + of.ethAddrLen)
    }

    if (object.dl_dst !== undefined) {
      if (object.dl_dst_mask !== undefined) {
        addressParser.stringToEth(object.dl_dst_mask, buffer, offset + OFFSETS.dlDstMask)
      } else {
        buffer.fill(0x00, offset + OFFSETS.dlDstMask, offset + OFFSETS.dlDstMask + of.ethAddrLen)
      }
      addressParser.stringToEth(object.dl_dst, buffer, offset + OFFSETS.dlDst)
    } else {
      buffer.fill(0x00, offset + OFFSETS.dlDst, offset + OFFSETS.dlDst + of.ethAddrLen)
      buffer.fill(0xff, offset + OFFSETS.dlDstMask, offset + OFFSETS.dlDstMask + of.ethAddrLen)
    }

    let dlVlan = 0
    if (object.dl_vlan !== undefined) {
      dlVlan = object.dl_vlan
    } else {
      wildcards |= WILDCARDS.dlVlan
    }
    buffer.writeUInt16BE(dlVlan, offset + OFFSETS.dlVlan)

    let dlVlanPcp = 0
    if (object.dl_vlan_pcp !== undefined) {
      dlVlanPcp = object.dl_vlan_pcp
    } else {
      wildcards |= WILDCARDS.dlVlanPcp
    }
    buffer.writeUInt8(dlVlanPcp, offset + OFFSETS.dlVlanPcp)

    buffer.fill(0, offset + OFFSETS.pad1, offset + OFFSETS.pad1 + PAD_LENGTH)

    let dlType = 0
    if (object.dl_type !== undefined) {
      dlType = object.dl_type
    } else {
      wildcards |= WILDCARDS.dlType
    }
    buffer.writeUInt16BE(dlType, offset + OFFSETS.dlType)

    let nwTos = 0
    if (object.nw_tos !== undefined) {
      nwTos = object.nw_tos
    } else {
      wildcards |= WILDCARDS.nwTos
    }
    buffer.writeUInt8(nwTos, offset + OFFSETS.nwTos)

    let nwProto = 0
    if (object.nw_proto !== undefined) {
      nwProto = object.nw_proto
    } else {
      wildcards |= WILDCARDS.nwProto
    }
    buffer.writeUInt8(nwProto, offset + OFFSETS.nwProto)

    if (object.nw_src !== undefined) {
      if (object.nw_src_mask !== undefined) {
        addressParser.stringToip4(object.nw_src_mask, buffer, offset + OFFSETS.nwSrcMask)
      } else {
        buffer.fill(0x00, offset + OFFSETS.nwSrcMask, offset + OFFSETS.nwSrcMask + IP4_ADDR_LEN)
      }
      addressParser.stringToip4(object.nw_src, buffer, offset + OFFSETS.nwSrc)
    } else {
      buffer.fill(0x00, offset + OFFSETS.nwSrc, offset + OFFSETS.nwSrc + IP4_ADDR_LEN)
      buffer.fill(0xff, offset + OFFSETS.nwSrcMask, offset + OFFSETS.nwSrcMask + IP4_ADDR_LEN)
    }

    if (object.nw_dst !== undefined) {
      if (object.nw_dst_mask !== undefined) {
        addressParser.stringToip4(object.nw_dst_mask, buffer, offset + OFFSETS.nwDstMask)
      } else {
        buffer.fill(0x00, offset + OFFSETS.nwDstMask, offset + OFFSETS.nwDstMask + IP4_ADDR_LEN)
      }
      addressParser.stringToip4(object.nw_dst, buffer, offset + OFFSETS.nwDst)
    } else {
      buffer.fill(0x00, offset + OFFSETS.nwDst, offset + OFFSETS.nwDst + IP4_ADDR_LEN)
      buffer.fill(0xff, offset + OFFSETS.nwDstMask, offset + OFFSETS.nwDstMask + IP4_ADDR_LEN)
    }

    let tpSrc = 0
    if (object.tp_src !== undefined) {
      tpSrc = object.tp_src
    } else {
      wildcards |= WILDCARDS.tpSrc
    }
    buffer.writeUInt16BE(tpSrc, offset + OFFSETS.tpSrc)

    let tpDst = 0
    if (object.tp_dst !== undefined) {
      tpDst = object.tp_dst
    } else {
      wildcards |= WILDCARDS.tpDst
    }
    buffer.writeUInt16BE(tpDst, offset + OFFSETS.tpDst)

    let mplsLabel = 0
    if (object.mpls_label !== undefined) {
      mplsLabel = object.mpls_label
    } else {
      wildcards |= WILDCARDS.mplsLabel
    }
    buffer.writeUInt32BE(mplsLabel, offset + OFFSETS.mplsLabel)

    let mplsTc = 0
    if (object.mpls_tc !== undefined) {
      mplsTc = object.mpls_tc
    } else {
      wildcards |= WILDCARDS.mplsTc
    }
    buffer.writeUInt8(mplsTc, offset + OFFSETS.mplsTc)

    buffer.fill(0, offset + OFFSETS.pad2, offset + OFFSETS.pad2 + PAD2_LENGTH)

    if (object.metadata !== undefined) {
      if (object.metadata_mask !== undefined) {
        buffer.copy(
          object.metadata_mask,
          0,
          offset + OFFSETS.metadataMask,
          offset + OFFSETS.metadataMask + METADATA_LENGTH
        )
      } else {
        buffer.fill(0x00, offset + OFFSETS.metadataMask, offset + OFFSETS.metadataMask + METADATA_LENGTH)
      }
      buffer.copy(object.metadata, 0, offset + OFFSETS.metadata, offset + OFFSETS.metadata + METADATA_LENGTH)
    } else {
      buffer.fill(0x00, offset + OFFSETS.metadata, offset + OFFSETS.metadata + METADATA_LENGTH)
      buffer.fill(0xff, offset + OFFSETS.metadataMask, offset + OFFSETS.metadataMask + METADATA_LENGTH)
    }

    buffer.writeUInt32BE(wildcards, offset + OFFSETS.wildcards)

    return buffer
  },

  unpack: (buffer, offset = 0) => {
    const object = {}
    object.type = buffer.readUInt16BE(offset + OFFSETS.type)
    assert(object.type === of.matchType.standard)

    object.length = buffer.readUInt16BE(offset + OFFSETS.length)
    assert(object.length === of.sizes.match)

    // Wildcards indicate which value to use for the match.
    // if `wildcards & of.wildcards.<value>` === 0 then `value` is not wildcarded and must be used.
    const wildcards = (object.wildcards = buffer.readUInt32BE(offset + OFFSETS.wildcards))
    if ((wildcards & WILDCARDS.inPort) === 0) {
      object.in_port = buffer.readUInt32BE(offset + OFFSETS.inPort)
    }

    if (!addressParser.isEthMaskAll(buffer, offset + OFFSETS.dlSrcMask)) {
      if (!addressParser.isEthMaskNone(buffer, offset + OFFSETS.dlSrcMask)) {
        object.dl_src_mask = addressParser.ethToString(buffer, offset + OFFSETS.dlSrcMask)
      }
      object.dl_src = addressParser.ethToString(buffer, offset + OFFSETS.dlSrc)
    }
    if (!addressParser.isEthMaskAll(buffer, offset + OFFSETS.dlDstMask)) {
      if (!addressParser.isEthMaskNone(buffer, offset + OFFSETS.dlDstMask)) {
        object.dl_dst_mask = addressParser.ethToString(buffer, offset + OFFSETS.dlDstMask)
      }
      object.dl_dst = addressParser.ethToString(buffer, offset + OFFSETS.dlDst)
    }

    if ((wildcards & WILDCARDS.dlVlan) === 0) {
      object.dl_vlan = buffer.readUInt16BE(offset + OFFSETS.dlVlan)
    }
    if ((wildcards & WILDCARDS.dlVlanPcp) === 0) {
      object.dl_vlan_pcp = buffer.readUInt16BE(offset + OFFSETS.dlVlanPcp)
    }
    if ((wildcards & WILDCARDS.dlType) === 0) {
      object.dl_type = buffer.readUInt16BE(offset + OFFSETS.dlType)
    }

    if ((wildcards & WILDCARDS.nwTos) === 0) {
      object.nw_tos = buffer.readUInt8(offset + OFFSETS.nwTos)
    }
    if ((wildcards & WILDCARDS.nwProto) === 0) {
      object.nw_proto = buffer.readUInt8(offset + OFFSETS.nwProto)
    }

    if (!addressParser.isIp4MaskAll(buffer, offset + OFFSETS.nwSrcMask)) {
      if (!addressParser.isIp4MaskNone(buffer, offset + OFFSETS.nwSrcMask)) {
        object.nw_src_mask = addressParser.ip4ToString(buffer, offset + OFFSETS.nwSrcMask)
      }
      object.nw_src = addressParser.ip4ToString(buffer, offset + OFFSETS.nwSrc)
    }
    if (!addressParser.isIp4MaskAll(buffer, offset + OFFSETS.nwDstMask)) {
      if (!addressParser.isIp4MaskNone(buffer, offset + OFFSETS.nwDstMask)) {
        object.nw_dst_mask = addressParser.ip4ToString(buffer, offset + OFFSETS.nwDstMask)
      }
      object.nw_dst = addressParser.ip4ToString(buffer, offset + OFFSETS.nwDst)
    }

    if ((wildcards & WILDCARDS.tpSrc) === 0) {
      object.tp_src = buffer.readUInt16BE(offset + OFFSETS.tpSrc)
    }
    if ((wildcards & WILDCARDS.tpDst) === 0) {
      object.tp_dst = buffer.readUInt16BE(offset + OFFSETS.tpDst)
    }

    if ((wildcards & WILDCARDS.mplsLabel) === 0) {
      object.mpls_label = buffer.readUInt32BE(offset + OFFSETS.mplsLabel)
    }
    if ((wildcards & WILDCARDS.mplsTc) === 0) {
      object.mpls_tc = buffer.readUInt32BE(offset + OFFSETS.mplsTc)
    }

    const metadataMask = [
      buffer.readUInt32BE(offset + OFFSETS.metadataMask),
      buffer.readUInt32BE(offset + OFFSETS.metadataMask + METADATA_LENGTH / 2),
    ]
    if (!uIntHelper.isUInt64All(metadataMask)) {
      if (!uIntHelper.isUInt64None(metadataMask)) {
        object.metadata_mask = Buffer.alloc(METADATA_LENGTH)
        buffer.copy(
          object.metadata_mask,
          0,
          offset + OFFSETS.metadataMask,
          offset + OFFSETS.metadataMask + METADATA_LENGTH
        )
      }
      object.metadata = Buffer.alloc(METADATA_LENGTH)
      buffer.copy(object.metadata, 0, offset + OFFSETS.metadata, offset + OFFSETS.metadata + METADATA_LENGTH)
    }

    return object
  },
}
