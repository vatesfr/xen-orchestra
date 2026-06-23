import { FLAG_FINAL, TargetOpcode } from './constants.mjs'
import { allocBhs, assemblePdu } from './pdu.mjs'

/** Sequence numbers stamped into an outbound R2T (which does not advance StatSN). */
export interface SequenceSnapshot {
  statSN: number
  expCmdSN: number
  maxCmdSN: number
}

/**
 * Build a Ready To Transfer (R2T) PDU soliciting `desiredLength` bytes of write
 * data starting at `bufferOffset`.
 */
export function buildR2t(
  params: {
    itt: number
    r2tSN: number
    targetTransferTag: number
    bufferOffset: number
    desiredLength: number
  },
  sequence: SequenceSnapshot
): Buffer {
  const bhs = allocBhs(TargetOpcode.R2T)
  bhs[1] = FLAG_FINAL // R2T always has the Final bit set
  bhs.writeUInt32BE(params.itt, 16)
  bhs.writeUInt32BE(params.targetTransferTag, 20)
  bhs.writeUInt32BE(sequence.statSN, 24)
  bhs.writeUInt32BE(sequence.expCmdSN, 28)
  bhs.writeUInt32BE(sequence.maxCmdSN, 32)
  bhs.writeUInt32BE(params.r2tSN, 36)
  bhs.writeUInt32BE(params.bufferOffset, 40)
  bhs.writeUInt32BE(params.desiredLength, 44)
  return assemblePdu(bhs)
}

/**
 * State of one in-progress WRITE: data is solicited one burst at a time (we pin
 * MaxOutstandingR2T=1) and accumulated as Data-Out PDUs arrive, interleaved with
 * any other commands on the connection.
 */
export interface PendingWrite {
  /** Initiator Task Tag of the WRITE command; Data-Out PDUs are routed by it. */
  readonly itt: number
  /** Target Transfer Tag echoed in this command's R2Ts / Data-Out PDUs. */
  readonly targetTransferTag: number
  /** Byte offset within the LUN where the data must land. */
  readonly lunOffset: number
  /** Assembled write payload. */
  readonly buffer: Buffer
  /** Total bytes expected. */
  readonly totalLength: number
  /** Bytes received so far. */
  received: number
  /** Bytes solicited so far (one burst ahead of `received`). */
  solicited: number
  /** Next R2TSN to emit. */
  r2tSN: number
}
