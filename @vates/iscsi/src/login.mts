import { isIP } from 'node:net'

import {
  LOGIN_CSG_MASK,
  LOGIN_CSG_SHIFT,
  LOGIN_FLAG_CONTINUE,
  LOGIN_FLAG_TRANSIT,
  LOGIN_NSG_MASK,
  LoginStage,
} from './constants.mjs'
import type { IncomingPdu } from './pdu.mjs'
import type { NegotiatedParams, SessionType } from './types.mjs'

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
}

/**
 * Accumulates login state across the (one or more) Login Request PDUs of a
 * connection and produces each Login Response's flags + key text. The caller
 * wraps the result in a BHS carrying the sequence numbers and TSIH.
 *
 * Since the target is authoritative, every negotiated key is answered with the
 * pinned value; RFC 7143 boolean rules guarantee the session collapses to the
 * single supported code path regardless of the initiator's offer.
 */
export class LoginNegotiator {
  #firstResponseSent = false
  #complete = false

  sessionType: SessionType = 'Normal'
  initiatorName?: string
  targetName?: string
  readonly params: NegotiatedParams = {
    initiatorMaxRecvDataSegmentLength: DEFAULT_INITIATOR_MAX_RECV_DATA_SEGMENT_LENGTH,
    maxBurstLength: OUR_MAX_BURST_LENGTH,
  }

  /** True once the session has transited to the full-feature phase. */
  get complete(): boolean {
    return this.#complete
  }

  process(pdu: IncomingPdu): LoginStepResult {
    const flags = pdu.flags
    const csg = (flags & LOGIN_CSG_MASK) >> LOGIN_CSG_SHIFT
    const nsg = flags & LOGIN_NSG_MASK
    const transit = (flags & LOGIN_FLAG_TRANSIT) !== 0
    const cont = (flags & LOGIN_FLAG_CONTINUE) !== 0
    const keys = parseTextKeys(pdu.data)

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

    if (csg === LoginStage.SECURITY_NEGOTIATION) {
      if (keys.has('AuthMethod')) {
        responseKeys.push(['AuthMethod', 'None'])
      }
    } else if (csg === LoginStage.OPERATIONAL_NEGOTIATION) {
      this.#negotiateOperational(keys, responseKeys)
    }

    let flagsByte = csg << LOGIN_CSG_SHIFT
    // Transit only when the initiator asked to and is not still sending keys.
    if (transit && !cont) {
      flagsByte |= LOGIN_FLAG_TRANSIT | nsg
      if (nsg === LoginStage.FULL_FEATURE_PHASE) {
        this.#complete = true
      }
    }

    this.#firstResponseSent = true
    return { flagsByte, data: serializeTextKeys(responseKeys) }
  }

  #negotiateOperational(keys: Map<string, string>, responseKeys: Array<[string, string]>): void {
    const answer = (key: string, value: string) => {
      if (keys.has(key)) {
        responseKeys.push([key, value])
      }
    }
    answer('HeaderDigest', 'None')
    answer('DataDigest', 'None')
    answer('MaxConnections', '1')
    answer('InitialR2T', 'Yes')
    answer('ImmediateData', 'No')
    answer('ErrorRecoveryLevel', '0')
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
