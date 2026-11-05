import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  InitiatorOpcode,
  LOGIN_CSG_SHIFT,
  LOGIN_FLAG_CONTINUE,
  LOGIN_FLAG_TRANSIT,
  LOGIN_NSG_MASK,
  LoginStage,
  LoginStatusClass,
  LoginStatusDetail,
  OPCODE_IMMEDIATE,
} from './constants.mjs'
import { buildSendTargetsResponse, formatPortal, LoginNegotiator, parseTextKeys, serializeTextKeys } from './login.mjs'
import { computeResponse, decodeChapValue, encodeChapValue } from './chap.mjs'
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

describe('LoginNegotiator CHAP authenticator', () => {
  const CHAP = { user: 'alice', secret: 's3cr3t' }

  const securityFlags = (transit = false) =>
    loginFlags({ transit, csg: LoginStage.SECURITY_NEGOTIATION, nsg: LoginStage.OPERATIONAL_NEGOTIATION })

  /** Round 1: offer AuthMethod. */
  function offerAuth(negotiator: LoginNegotiator, methods = 'CHAP,None', transit = false) {
    return negotiator.process(
      makeLoginPdu(securityFlags(transit), { InitiatorName: 'iqn.x:i', SessionType: 'Normal', AuthMethod: methods })
    )
  }

  /** Round 2: offer CHAP_A, return the target's parsed challenge keys. */
  function offerAlgorithm(negotiator: LoginNegotiator, list = '5') {
    const result = negotiator.process(makeLoginPdu(securityFlags(false), { CHAP_A: list }))
    return { result, keys: parseTextKeys(result.data) }
  }

  /** Round 3: answer with CHAP_N/CHAP_R for the given challenge. */
  function answerChallenge(
    negotiator: LoginNegotiator,
    challengeKeys: Map<string, string>,
    { user = CHAP.user, secret = CHAP.secret } = {}
  ) {
    const id = Number.parseInt(challengeKeys.get('CHAP_I') ?? '', 10)
    const challenge = decodeChapValue(challengeKeys.get('CHAP_C') ?? '')
    const response = encodeChapValue(computeResponse(id, secret, challenge))
    return negotiator.process(makeLoginPdu(securityFlags(true), { CHAP_N: user, CHAP_R: response }))
  }

  it('challenges then transits only after a correct response', () => {
    const negotiator = new LoginNegotiator(CHAP)

    // Round 1: we answer AuthMethod=CHAP and do NOT transit.
    const r1 = offerAuth(negotiator)
    assert.equal(parseTextKeys(r1.data).get('AuthMethod'), 'CHAP')
    assert.equal(r1.flagsByte & LOGIN_FLAG_TRANSIT, 0)
    assert.equal(r1.statusClass ?? LoginStatusClass.SUCCESS, LoginStatusClass.SUCCESS)

    // Round 2: we issue CHAP_A=5, an identifier and a challenge, still no transit.
    const { result: r2, keys: challenge } = offerAlgorithm(negotiator)
    assert.equal(challenge.get('CHAP_A'), '5')
    assert.ok(challenge.has('CHAP_I'))
    assert.match(challenge.get('CHAP_C') ?? '', /^0x[0-9a-f]+$/)
    assert.equal(r2.flagsByte & LOGIN_FLAG_TRANSIT, 0)

    // Round 3: a correct response transits to the operational stage.
    const r3 = answerChallenge(negotiator, challenge)
    assert.equal(r3.statusClass ?? LoginStatusClass.SUCCESS, LoginStatusClass.SUCCESS)
    assert.ok((r3.flagsByte & LOGIN_FLAG_TRANSIT) !== 0, 'transit granted after auth')
    assert.equal(r3.flagsByte & LOGIN_NSG_MASK, LoginStage.OPERATIONAL_NEGOTIATION)
    assert.equal(negotiator.failed, false)

    // The operational stage then completes as usual.
    const op = negotiator.process(
      makeLoginPdu(
        loginFlags({ transit: true, csg: LoginStage.OPERATIONAL_NEGOTIATION, nsg: LoginStage.FULL_FEATURE_PHASE }),
        { HeaderDigest: 'None', DataDigest: 'None' }
      )
    )
    assert.equal(negotiator.complete, true)
    assert.equal(parseTextKeys(op.data).get('HeaderDigest'), 'None')
  })

  it('rejects a wrong secret with Initiator Error / authentication failure', () => {
    const negotiator = new LoginNegotiator(CHAP)
    offerAuth(negotiator)
    const { keys: challenge } = offerAlgorithm(negotiator)
    const r3 = answerChallenge(negotiator, challenge, { secret: 'wrong' })

    assert.equal(r3.statusClass, LoginStatusClass.INITIATOR_ERROR)
    assert.equal(r3.statusDetail, LoginStatusDetail.AUTHENTICATION_FAILURE)
    assert.equal(r3.flagsByte & LOGIN_FLAG_TRANSIT, 0)
    assert.equal(negotiator.complete, false)
    assert.equal(negotiator.failed, true)
  })

  it('rejects a wrong username even with the right secret', () => {
    const negotiator = new LoginNegotiator(CHAP)
    offerAuth(negotiator)
    const { keys: challenge } = offerAlgorithm(negotiator)
    const r3 = answerChallenge(negotiator, challenge, { user: 'mallory' })
    assert.equal(r3.statusClass, LoginStatusClass.INITIATOR_ERROR)
    assert.equal(negotiator.failed, true)
  })

  it('fails when the initiator offers only AuthMethod=None', () => {
    const negotiator = new LoginNegotiator(CHAP)
    const r1 = offerAuth(negotiator, 'None')
    assert.equal(r1.statusClass, LoginStatusClass.INITIATOR_ERROR)
    assert.equal(r1.statusDetail, LoginStatusDetail.AUTHENTICATION_FAILURE)
    assert.equal(negotiator.failed, true)
  })

  it('fails when CHAP_A does not offer MD5', () => {
    const negotiator = new LoginNegotiator(CHAP)
    offerAuth(negotiator)
    const { result } = offerAlgorithm(negotiator, '6,7')
    assert.equal(result.statusClass, LoginStatusClass.INITIATOR_ERROR)
    assert.equal(negotiator.failed, true)
  })

  it('does not transit if the initiator sets the T bit before authenticating', () => {
    const negotiator = new LoginNegotiator(CHAP)
    // Round 1 with the Transit bit set: must be ignored until CHAP completes.
    const r1 = offerAuth(negotiator, 'CHAP,None', true)
    assert.equal(r1.flagsByte & LOGIN_FLAG_TRANSIT, 0)
    assert.equal(negotiator.complete, false)
  })

  it('fails if the initiator skips security and jumps to operational negotiation', () => {
    const negotiator = new LoginNegotiator(CHAP)
    const result = negotiator.process(
      makeLoginPdu(
        loginFlags({ transit: true, csg: LoginStage.OPERATIONAL_NEGOTIATION, nsg: LoginStage.FULL_FEATURE_PHASE }),
        { HeaderDigest: 'None' }
      )
    )
    assert.equal(result.statusClass, LoginStatusClass.INITIATOR_ERROR)
    assert.equal(result.flagsByte & LOGIN_FLAG_TRANSIT, 0)
    assert.equal(negotiator.complete, false)
    assert.equal(negotiator.failed, true)
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
