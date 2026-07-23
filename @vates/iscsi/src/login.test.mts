import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  InitiatorOpcode,
  LOGIN_CSG_SHIFT,
  LOGIN_FLAG_CONTINUE,
  LOGIN_FLAG_TRANSIT,
  LOGIN_NSG_MASK,
  LoginStage,
  OPCODE_IMMEDIATE,
} from './constants.mjs'
import {
  buildSendTargetsResponse,
  formatPortal,
  LoginNegotiator,
  parseTextKeys,
  serializeTextKeys,
} from './login.mjs'
import { IncomingPdu } from './pdu.mjs'

function loginFlags(options: { transit?: boolean; cont?: boolean; csg: number; nsg: number }): number {
  return (
    (options.transit ? LOGIN_FLAG_TRANSIT : 0) |
    (options.cont ? LOGIN_FLAG_CONTINUE : 0) |
    (options.csg << LOGIN_CSG_SHIFT) |
    (options.nsg & LOGIN_NSG_MASK)
  )
}

function makeLoginPdu(flags: number, keys: Record<string, string>): IncomingPdu {
  const bhs = Buffer.alloc(48)
  bhs[0] = InitiatorOpcode.LOGIN_REQUEST | OPCODE_IMMEDIATE
  bhs[1] = flags
  const data = serializeTextKeys(Object.entries(keys))
  return new IncomingPdu(bhs, Buffer.alloc(0), data)
}

describe('text key serialization', () => {
  it('round-trips NUL-delimited key=value pairs', () => {
    const buffer = serializeTextKeys([
      ['A', '1'],
      ['HeaderDigest', 'None'],
    ])
    assert.equal(buffer.toString('binary'), 'A=1\0HeaderDigest=None\0')
    const keys = parseTextKeys(buffer)
    assert.equal(keys.get('A'), '1')
    assert.equal(keys.get('HeaderDigest'), 'None')
  })

  it('ignores empty fragments and malformed pairs', () => {
    const keys = parseTextKeys(Buffer.from('\0Key=Value\0bogus\0', 'binary'))
    assert.equal(keys.size, 1)
    assert.equal(keys.get('Key'), 'Value')
  })
})

describe('LoginNegotiator', () => {
  it('completes a single-PDU operational login and pins the negotiated values', () => {
    const negotiator = new LoginNegotiator()
    const pdu = makeLoginPdu(
      loginFlags({
        transit: true,
        csg: LoginStage.OPERATIONAL_NEGOTIATION,
        nsg: LoginStage.FULL_FEATURE_PHASE,
      }),
      {
        InitiatorName: 'iqn.1994-05.com.example:initiator',
        SessionType: 'Normal',
        HeaderDigest: 'None,CRC32C',
        DataDigest: 'None,CRC32C',
        InitialR2T: 'No',
        ImmediateData: 'Yes',
        MaxRecvDataSegmentLength: '262144',
        MaxBurstLength: '16776192',
      }
    )
    const { flagsByte, data } = negotiator.process(pdu)

    assert.equal(negotiator.complete, true)
    assert.ok((flagsByte & LOGIN_FLAG_TRANSIT) !== 0)
    assert.equal(flagsByte & LOGIN_NSG_MASK, LoginStage.FULL_FEATURE_PHASE)

    const keys = parseTextKeys(data)
    assert.equal(keys.get('TargetPortalGroupTag'), '1')
    assert.equal(keys.get('HeaderDigest'), 'None')
    assert.equal(keys.get('DataDigest'), 'None')
    // Pinned to the single write code path regardless of the initiator's offer.
    assert.equal(keys.get('InitialR2T'), 'Yes')
    assert.equal(keys.get('ImmediateData'), 'No')
    // MaxBurstLength negotiates down to our cap.
    assert.equal(keys.get('MaxBurstLength'), '262144')

    assert.equal(negotiator.sessionType, 'Normal')
    assert.equal(negotiator.initiatorName, 'iqn.1994-05.com.example:initiator')
    assert.equal(negotiator.params.initiatorMaxRecvDataSegmentLength, 262144)
    assert.equal(negotiator.params.maxBurstLength, 262144)
  })

  it('handles a two-stage security then operational login', () => {
    const negotiator = new LoginNegotiator()

    const security = negotiator.process(
      makeLoginPdu(
        loginFlags({
          transit: true,
          csg: LoginStage.SECURITY_NEGOTIATION,
          nsg: LoginStage.OPERATIONAL_NEGOTIATION,
        }),
        { InitiatorName: 'iqn.x:i', SessionType: 'Normal', AuthMethod: 'None' }
      )
    )
    assert.equal(negotiator.complete, false)
    assert.equal(parseTextKeys(security.data).get('AuthMethod'), 'None')

    const operational = negotiator.process(
      makeLoginPdu(
        loginFlags({
          transit: true,
          csg: LoginStage.OPERATIONAL_NEGOTIATION,
          nsg: LoginStage.FULL_FEATURE_PHASE,
        }),
        { HeaderDigest: 'None', DataDigest: 'None' }
      )
    )
    assert.equal(negotiator.complete, true)
    // The portal group tag is only emitted in the first response.
    assert.equal(parseTextKeys(operational.data).get('TargetPortalGroupTag'), undefined)
  })

  it('omits the portal group tag for a discovery session', () => {
    const negotiator = new LoginNegotiator()
    const { data } = negotiator.process(
      makeLoginPdu(
        loginFlags({
          transit: true,
          csg: LoginStage.OPERATIONAL_NEGOTIATION,
          nsg: LoginStage.FULL_FEATURE_PHASE,
        }),
        { SessionType: 'Discovery' }
      )
    )
    assert.equal(negotiator.sessionType, 'Discovery')
    assert.equal(parseTextKeys(data).get('TargetPortalGroupTag'), undefined)
  })

  it('does not transit while the initiator is still sending keys (C bit)', () => {
    const negotiator = new LoginNegotiator()
    const { flagsByte } = negotiator.process(
      makeLoginPdu(
        loginFlags({
          transit: true,
          cont: true,
          csg: LoginStage.OPERATIONAL_NEGOTIATION,
          nsg: LoginStage.FULL_FEATURE_PHASE,
        }),
        { HeaderDigest: 'None' }
      )
    )
    assert.equal(negotiator.complete, false)
    assert.equal(flagsByte & LOGIN_FLAG_TRANSIT, 0)
  })
})

describe('formatPortal', () => {
  it('keeps plain IPv4 addresses', () => {
    assert.equal(formatPortal('10.0.0.1', 3260), '10.0.0.1:3260,1')
  })

  it('unwraps IPv4-mapped IPv6 (dual-stack socket artifact)', () => {
    assert.equal(formatPortal('::ffff:192.168.1.8', 3260), '192.168.1.8:3260,1')
  })

  it('brackets real IPv6 literals', () => {
    assert.equal(formatPortal('2a01:e0a:e6a:9500::1', 3260), '[2a01:e0a:e6a:9500::1]:3260,1')
  })
})

describe('buildSendTargetsResponse', () => {
  it('advertises the target name and address', () => {
    const keys = parseTextKeys(buildSendTargetsResponse('iqn.2024-01.tech.vates:lun0', '10.0.0.1', 3260))
    assert.equal(keys.get('TargetName'), 'iqn.2024-01.tech.vates:lun0')
    assert.equal(keys.get('TargetAddress'), '10.0.0.1:3260,1')
  })

  it('advertises a clean IPv4 portal for an IPv4-mapped local address', () => {
    const keys = parseTextKeys(buildSendTargetsResponse('iqn.x:y', '::ffff:192.168.1.8', 3260))
    assert.equal(keys.get('TargetAddress'), '192.168.1.8:3260,1')
  })
})
