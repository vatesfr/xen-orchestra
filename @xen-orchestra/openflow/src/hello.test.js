import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import openflow from './index.js'

// OVS 2.17 on a bridge with no protocols set (1.0 to 1.5): a HELLO of version
// 6 without version bitmap, captured from xenbr1.mgmt
const HELLO_OVS_V6 = Buffer.from('06000008000010c5', 'hex')

// OVS 2.17 on a bridge whose protocols are OpenFlow10, OpenFlow11 and
// OpenFlow14 (XAPI, VDF and XO's SDN controller): a HELLO of version 5 with a
// version bitmap (bits 1, 2 and 5), captured from xenbr1.mgmt; that OVS
// answered XO's version 2 HELLO and FEATURES_REQUEST with a version 2
// FEATURES_REPLY
const HELLO_OVS_V5 = Buffer.from('050000100000235300010008' + '00000026', 'hex')

// the same bridge without OpenFlow11
const HELLO_OVS_V5_NO_11 = Buffer.from('050000100000002b' + '0001000800000022', 'hex')

describe('HELLO and version negotiation', () => {
  it('reads a HELLO of a version this package does not support', () => {
    assert.deepEqual(openflow.unpack(HELLO_OVS_V6), {
      header: { version: 6, type: 0, length: 8, xid: 0x10c5 },
    })
    assert.deepEqual(openflow.unpack(HELLO_OVS_V5), {
      header: { version: 5, type: 0, length: 16, xid: 0x2353 },
      versions: [1, 2, 5],
    })
  })

  it('negotiates down to OpenFlow 1.1 when the peer supports it', () => {
    assert.equal(openflow.negotiate(openflow.unpack(HELLO_OVS_V6)), openflow.versions.openFlow11)
    assert.equal(openflow.negotiate(openflow.unpack(HELLO_OVS_V5)), openflow.versions.openFlow11)
  })

  it('finds no common version when the bitmap leaves 1.1 out, or the peer is older', () => {
    assert.equal(openflow.negotiate(openflow.unpack(HELLO_OVS_V5_NO_11)), undefined)
    assert.equal(openflow.negotiate(openflow.unpack(Buffer.from('0100000800000001', 'hex'))), undefined)
  })

  it('still refuses other messages of an unsupported version', () => {
    // an OFPT_ECHO_REQUEST of version 5
    assert.throws(() => openflow.unpack(Buffer.from('0502000800000001', 'hex')), /Unsupported OpenFlow version: 5/)
  })
})

describe('flow-mod cookie', () => {
  const ofProtocol = openflow.protocols[openflow.versions.openFlow11]
  const flowMod = fields =>
    openflow.pack({
      header: { version: openflow.versions.openFlow11, type: ofProtocol.type.flowMod, xid: 7 },
      command: ofProtocol.flowModCommand.delete,
      match: { type: ofProtocol.matchType.standard },
      ...fields,
    })

  it('packs a cookie without a mask (it threw: the mask was written at an undefined offset)', () => {
    const buffer = flowMod({ cookie: Buffer.from('5800000000000001', 'hex') })
    assert.equal(buffer.readUInt8(0), openflow.versions.openFlow11)
    assert.equal(buffer.readUInt8(1), ofProtocol.type.flowMod)
    assert.equal(buffer.subarray(8, 16).toString('hex'), '5800000000000001')
    assert.equal(buffer.subarray(16, 24).toString('hex'), '0000000000000000')
  })

  it('a cookie and its mask: a delete of that cookie only', () => {
    const buffer = flowMod({
      cookie: Buffer.from('5800000000000001', 'hex'),
      cookie_mask: Buffer.from('ffffffffffffffff', 'hex'),
    })
    assert.equal(buffer.subarray(16, 24).toString('hex'), 'ffffffffffffffff')
  })
})
