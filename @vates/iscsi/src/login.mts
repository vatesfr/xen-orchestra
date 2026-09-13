import { isIP } from 'node:net'
import { createLogger, type Logger } from '@xen-orchestra/log'

import {
  AuthMethod,
  LOGIN_CSG_MASK,
  LOGIN_CSG_SHIFT,
  LOGIN_FLAG_CONTINUE,
  LOGIN_FLAG_TRANSIT,
  LOGIN_NSG_MASK,
  LoginStage,
  LoginStatusClass,
  LoginStatusDetail,
} from './constants.mjs'
import {
  computeResponse,
  encodeChapValue,
  decodeChapValue,
  generateChallenge,
  generateId,
  parseAlgorithmList,
  selectAlgorithm,
  verifyResponse,
} from './chap.mjs'
import type { IncomingPdu } from './pdu.mjs'
import type { ChapCredentials, NegotiatedParams, SessionType } from './types.mjs'

const EMPTY = Buffer.alloc(0)

// Target-side login negotiation trace. Enable the `vates:iscsi:login` debug
// namespace to see every negotiated key and CHAP state change — the usual root
// cause when a particular initiator fails to attach.
const log: Logger = createLogger('vates:iscsi:login')

// Operational values the target imposes. The target drives negotiation, so these
// are pinned to a single code path (see plan): all writes are R2T-solicited
// (InitialR2T=Yes, ImmediateData=No), no digests, one connection.
const OUR_MAX_RECV_DATA_SEGMENT_LENGTH = 262144
const OUR_MAX_BURST_LENGTH = 262144
const DEFAULT_INITIATOR_MAX_RECV_DATA_SEGMENT_LENGTH = 8192 // RFC 7143 default

/** Parse a NUL-delimited iSCSI text key=value data segment. */
export function parseTextKeys(data: Buffer): Map<string, string> {
  const keys = new Map<string, string>()
  for (const pair of data.toString('utf8').split('\0')) {
    if (pair.length === 0) {
      continue
    }
    const eq = pair.indexOf('=')
    if (eq !== -1) {
      keys.set(pair.slice(0, eq), pair.slice(eq + 1))
    }
  }
  return keys
}

/** Serialize key=value pairs into a NUL-delimited (and NUL-terminated) buffer. */
export function serializeTextKeys(entries: ReadonlyArray<readonly [string, string]>): Buffer {
  if (entries.length === 0) {
    return Buffer.alloc(0)
  }
  return Buffer.from(entries.map(([key, value]) => `${key}=${value}\0`).join(''), 'utf8')
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback
  }
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Format an `address:port,portal-group-tag` value for a SendTargets
 * `TargetAddress`, per the iSCSI grammar:
 * - unwrap IPv4-mapped IPv6 (`::ffff:1.2.3.4`, produced by a dual-stack socket
 *   accepting an IPv4 connection) to plain IPv4, so initiators get a clean,
 *   matchable portal;
 * - bracket real IPv6 literals (`[2001:db8::1]:3260,1`).
 */
export function formatPortal(address: string, port: number): string {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address)
  const normalized = mapped !== null ? mapped[1] : address
  const bracketed = isIP(normalized) === 6 ? `[${normalized}]` : normalized
  return `${bracketed}:${port},1`
}

/** Build the SendTargets discovery Text Response data segment. */
export function buildSendTargetsResponse(iqn: string, address: string, port: number): Buffer {
  return serializeTextKeys([
    ['TargetName', iqn],
    ['TargetAddress', formatPortal(address, port)],
  ])
}

/** Outcome of processing a single Login Request PDU. */
export interface LoginStepResult {
  /** Byte 1 (T/C/CSG/NSG) of the Login Response. */
  flagsByte: number
  /** Response key=value text segment. */
  data: Buffer
  /** Login Response Status-Class (byte 36). Defaults to SUCCESS when omitted. */
  statusClass?: number
  /** Login Response Status-Detail (byte 37). Defaults to 0 when omitted. */
  statusDetail?: number
}

/** A rejected login: the Status-Class/Detail bytes the response must carry. */
interface AuthFailure {
  statusClass: number
  statusDetail: number
}

/** CHAP authentication failure (RFC 7143 §11.1.5): Initiator Error / auth failure. */
const AUTH_FAILURE: AuthFailure = {
  statusClass: LoginStatusClass.INITIATOR_ERROR,
  statusDetail: LoginStatusDetail.AUTHENTICATION_FAILURE,
}

/** Progress of the target-side one-way CHAP exchange (RFC 7143 §11.1.4). */
type ChapState = 'none' | 'awaitAlgorithm' | 'awaitResponse' | 'authenticated' | 'failed'

/**
 * Negotiates one connection's login: the target is authoritative, so every
 * key is answered with the pinned value, and RFC 7143's boolean rules
 * guarantee the session collapses to the one supported path regardless of
 * what the initiator offers.
 *
 * With {@link ChapCredentials}, the target challenges the initiator during
 * security negotiation and refuses to reach the operational stage until it
 * proves the secret; without one, it uses the legacy `AuthMethod=None` path.
 */
export class LoginNegotiator {
  #firstResponseSent = false
  #complete = false

  readonly #chap?: ChapCredentials
  #chapState: ChapState = 'none'
  #chapId = 0
  #chapChallenge: Buffer = EMPTY

  sessionType: SessionType = 'Normal'
  initiatorName?: string
  targetName?: string
  readonly params: NegotiatedParams = {
    initiatorMaxRecvDataSegmentLength: DEFAULT_INITIATOR_MAX_RECV_DATA_SEGMENT_LENGTH,
    maxBurstLength: OUR_MAX_BURST_LENGTH,
  }

  constructor(chap?: ChapCredentials) {
    this.#chap = chap
  }

  /** True once the session has transited to the full-feature phase. */
  get complete(): boolean {
    return this.#complete
  }

  /** True once CHAP authentication has definitively failed for this connection. */
  get failed(): boolean {
    return this.#chapState === 'failed'
  }

  /** CHAP is enforced only when configured and only for Normal (data) sessions. */
  get #chapRequired(): boolean {
    return this.#chap !== undefined && this.sessionType === 'Normal'
  }

  process(pdu: IncomingPdu): LoginStepResult {
    const flags = pdu.flags
    const csg = (flags & LOGIN_CSG_MASK) >> LOGIN_CSG_SHIFT
    const nsg = flags & LOGIN_NSG_MASK
    const transit = (flags & LOGIN_FLAG_TRANSIT) !== 0
    const cont = (flags & LOGIN_FLAG_CONTINUE) !== 0
    const keys = parseTextKeys(pdu.data)
    log.debug('login request', { csg, nsg, transit, cont, keys: Object.fromEntries(keys) })

    const sessionType = keys.get('SessionType')
    if (sessionType !== undefined) {
      this.sessionType = sessionType === 'Discovery' ? 'Discovery' : 'Normal'
    }
    this.initiatorName ??= keys.get('InitiatorName')
    this.targetName ??= keys.get('TargetName')

    const responseKeys: Array<[string, string]> = []
    // A normal session's first Login Response must carry the portal group tag.
    if (!this.#firstResponseSent && this.sessionType === 'Normal') {
      responseKeys.push(['TargetPortalGroupTag', '1'])
    }

    let failure: AuthFailure | undefined
    if (csg === LoginStage.SECURITY_NEGOTIATION) {
      // Act only on a complete key set (C bit clear); while the initiator is
      // still sending keys we accumulate without answering the exchange.
      if (!cont) {
        failure = this.#handleSecurity(keys, responseKeys)
      }
    } else if (csg === LoginStage.OPERATIONAL_NEGOTIATION) {
      if (this.#chapRequired && this.#chapState !== 'authenticated') {
        // Normal session jumped to operational negotiation without completing the
        // CHAP security stage we require.
        this.#chapState = 'failed'
        failure = AUTH_FAILURE
      } else {
        this.#negotiateOperational(keys, responseKeys)
      }
    }

    let flagsByte = csg << LOGIN_CSG_SHIFT
    // Transit only when the initiator asked to, is not still sending keys, and
    // (if CHAP is required) authentication has succeeded. This single gate blocks
    // a premature Transit bit and any transit before/without CHAP.
    const authReady = !this.#chapRequired || this.#chapState === 'authenticated'
    if (transit && !cont && authReady) {
      flagsByte |= LOGIN_FLAG_TRANSIT | nsg
      if (nsg === LoginStage.FULL_FEATURE_PHASE) {
        this.#complete = true
      }
    }

    this.#firstResponseSent = true
    log.debug('login response', {
      transit: (flagsByte & LOGIN_FLAG_TRANSIT) !== 0,
      nsg: flagsByte & LOGIN_NSG_MASK,
      keys: Object.fromEntries(responseKeys),
      statusClass: failure?.statusClass ?? 0,
      statusDetail: failure?.statusDetail ?? 0,
      chapState: this.#chapState,
    })
    return {
      flagsByte,
      data: serializeTextKeys(responseKeys),
      statusClass: failure?.statusClass,
      statusDetail: failure?.statusDetail,
    }
  }

  /**
   * Drive one round of the target-side one-way CHAP exchange, mutating
   * {@link ChapState} and appending any response keys. Returns an
   * {@link AuthFailure} when authentication is rejected, otherwise `undefined`
   * (success or "still in progress, awaiting the next PDU").
   */
  #handleSecurity(keys: Map<string, string>, responseKeys: Array<[string, string]>): AuthFailure | undefined {
    // CHAP applies only to Normal (data) sessions. Discovery sessions can only
    // run SendTargets — they never reach the LUN — so they negotiate
    // AuthMethod=None, keeping the standard unauthenticated `iscsiadm -m
    // discovery` flow working. Without CHAP configured, this is the only path.
    const chap = this.#chap
    if (chap === undefined || this.sessionType !== 'Normal') {
      if (keys.has('AuthMethod')) {
        responseKeys.push(['AuthMethod', AuthMethod.NONE])
      }
      return undefined
    }

    switch (this.#chapState) {
      case 'none': {
        const offer = keys.get('AuthMethod')
        if (offer === undefined) {
          return undefined // still waiting for the AuthMethod offer
        }
        if (!offer.split(',').includes(AuthMethod.CHAP)) {
          // Initiator offered only None (or an unknown method) while we require CHAP.
          log.debug('chap: initiator did not offer CHAP', { offered: offer })
          this.#chapState = 'failed'
          return AUTH_FAILURE
        }
        responseKeys.push(['AuthMethod', AuthMethod.CHAP])
        this.#chapState = 'awaitAlgorithm'
        return undefined
      }
      case 'awaitAlgorithm': {
        const offered = keys.get('CHAP_A')
        if (offered === undefined) {
          return undefined // still waiting for CHAP_A
        }
        const algorithm = selectAlgorithm(parseAlgorithmList(offered))
        if (algorithm === undefined) {
          log.debug('chap: no supported algorithm offered', { offered })
          this.#chapState = 'failed'
          return AUTH_FAILURE
        }
        this.#chapId = generateId()
        this.#chapChallenge = generateChallenge()
        responseKeys.push(['CHAP_A', String(algorithm)])
        responseKeys.push(['CHAP_I', String(this.#chapId)])
        responseKeys.push(['CHAP_C', encodeChapValue(this.#chapChallenge)])
        log.debug('chap: issued challenge', { algorithm, id: this.#chapId })
        this.#chapState = 'awaitResponse'
        return undefined
      }
      case 'awaitResponse': {
        const name = keys.get('CHAP_N')
        const response = keys.get('CHAP_R')
        if (name === undefined || response === undefined) {
          return undefined // still waiting for CHAP_N / CHAP_R
        }
        let got: Buffer
        try {
          got = decodeChapValue(response)
        } catch {
          this.#chapState = 'failed'
          return AUTH_FAILURE
        }
        const expected = computeResponse(this.#chapId, chap.secret, this.#chapChallenge)
        if (name === chap.user && verifyResponse(expected, got)) {
          log.debug('chap: authenticated', { user: name })
          this.#chapState = 'authenticated'
          return undefined
        }
        log.debug('chap: verification failed', { user: name, userMatch: name === chap.user })
        this.#chapState = 'failed'
        return AUTH_FAILURE
      }
      default:
        return undefined
    }
  }

  #negotiateOperational(keys: Map<string, string>, responseKeys: Array<[string, string]>): void {
    // Only answer what the initiator actually offered: for every key below, the
    // RFC 7143 default of an unoffered key is already the value we want, so
    // staying silent and letting the default stand is equivalent.
    const answer = (key: string, value: string) => {
      if (keys.has(key)) {
        responseKeys.push([key, value])
      }
    }
    answer('HeaderDigest', 'None')
    answer('DataDigest', 'None')
    answer('MaxConnections', '1')
    answer('InitialR2T', 'Yes')
    answer('ErrorRecoveryLevel', '0')

    // ImmediateData is the one exception: its RFC 7143 default is *Yes*, so an
    // initiator that never offers the key may legally put write data in the SCSI
    // Command PDU itself — which this target does not implement and would
    // otherwise silently drop, acknowledging a write it never applied. Declare
    // No whether or not it was offered. Costs nothing: there is no immediate
    // data path to lose, and every mainstream initiator offers the key anyway,
    // so for them this is byte-identical to before.
    responseKeys.push(['ImmediateData', 'No'])
    answer('DataPDUInOrder', 'Yes')
    answer('DataSequenceInOrder', 'Yes')
    answer('DefaultTime2Wait', '2')
    answer('DefaultTime2Retain', '0')
    answer('MaxOutstandingR2T', '1')

    // MaxRecvDataSegmentLength is declarative per direction: capture the
    // initiator's (caps our Data-In) and always declare ours (caps its Data-Out).
    this.params.initiatorMaxRecvDataSegmentLength = parsePositiveInt(
      keys.get('MaxRecvDataSegmentLength'),
      this.params.initiatorMaxRecvDataSegmentLength
    )
    responseKeys.push(['MaxRecvDataSegmentLength', String(OUR_MAX_RECV_DATA_SEGMENT_LENGTH)])

    // MaxBurstLength / FirstBurstLength negotiate to the minimum of both offers.
    const maxBurst = Math.min(parsePositiveInt(keys.get('MaxBurstLength'), OUR_MAX_BURST_LENGTH), OUR_MAX_BURST_LENGTH)
    this.params.maxBurstLength = maxBurst
    if (keys.has('MaxBurstLength')) {
      responseKeys.push(['MaxBurstLength', String(maxBurst)])
    }
    if (keys.has('FirstBurstLength')) {
      const firstBurst = Math.min(parsePositiveInt(keys.get('FirstBurstLength'), maxBurst), maxBurst)
      responseKeys.push(['FirstBurstLength', String(firstBurst)])
    }
  }
}
