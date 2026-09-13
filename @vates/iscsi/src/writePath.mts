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
  /**
   * Bytes of {@link buffer} filled, counted from offset 0 and contiguous by
   * construction — see {@link receiveDataOut}. Never a plain count of bytes
   * received off the wire, which is not the same thing.
   */
  contiguousReceived: number
  /** Bytes solicited so far (one burst ahead of `contiguousReceived`). */
  solicited: number
  /** Next R2TSN to emit. */
  r2tSN: number
}

/** One inbound Data-Out PDU, reduced to what the write path needs from it. */
export interface DataOutSegment {
  /** Target Transfer Tag echoed by the initiator (BHS bytes 20-23). */
  readonly targetTransferTag: number
  /** Where these bytes belong, relative to the start of the command's data (BHS bytes 40-43). */
  readonly bufferOffset: number
  readonly data: Buffer
}

/** The PDU was placed in the staging buffer. */
export interface PlacedDataOut {
  readonly ok: true
  /** Every byte of the command has landed: the write can be committed to the LUN. */
  readonly complete: boolean
  /** The solicited burst is fully received: the next one can be solicited. */
  readonly burstComplete: boolean
}

/** The PDU cannot be placed; the command must be aborted rather than committed. */
export interface RefusedDataOut {
  readonly ok: false
  /** Why, for the log line accompanying the Reject. */
  readonly reason: string
}

export type DataOutOutcome = PlacedDataOut | RefusedDataOut

/**
 * Validate one Data-Out PDU against its pending write and, only if it belongs
 * exactly where the buffer is still unfilled, copy it in. Validation and copy
 * live together on purpose: the checks are what make the copy in-bounds, so a
 * caller must not be able to do one without the other.
 *
 * A Data-Out must start exactly where the previous one ended. That strictness
 * is what makes `contiguousReceived` mean "bytes of the buffer filled" — and
 * only that meaning makes the completion test sound. Counting bytes as they
 * arrive off the wire does not work, because `Buffer.copy` silently clamps:
 *
 *  - 512 bytes at BufferOffset 512 of a 512-byte write copies *nothing*,
 *  - 512 bytes at BufferOffset 256 of a 512-byte write copies only 256,
 *  - the same 256 bytes sent twice copies 256 bytes over themselves.
 *
 * Each of those reaches `totalLength` bytes received with part of the buffer
 * never written, so the target would commit a partly-applied write and answer
 * GOOD — an acknowledged write silently losing data, which is worse than
 * failing it. Before this was a contiguity check the staging buffer was also
 * `allocUnsafe`, so the unwritten part leaked recycled heap to the initiator.
 *
 * Requiring contiguity is legitimate only because of what login declares in
 * `#negotiateOperational`: `InitialR2T=Yes` (no unsolicited data, so every
 * Data-Out is covered by an R2T and its TTT must match), `DataPDUInOrder=Yes`
 * (RFC 7143: within a sequence, Data-Out PDUs MUST be in increasing
 * BufferOffset order) and `MaxOutstandingR2T=1` (only one burst is ever
 * solicited, so no other range can legitimately be in flight). Each of those
 * is the winning side of its negotiation rule, so an initiator cannot talk us
 * out of them. Should any of the three ever change, this must become per-burst
 * range accounting instead of a single high-water mark.
 */
export function receiveDataOut(pending: PendingWrite, segment: DataOutSegment): DataOutOutcome {
  const { targetTransferTag, bufferOffset, data } = segment
  if (targetTransferTag !== pending.targetTransferTag) {
    return {
      ok: false,
      reason: `Target Transfer Tag ${targetTransferTag} is not this command's ${pending.targetTransferTag}`,
    }
  }
  if (bufferOffset !== pending.contiguousReceived) {
    return { ok: false, reason: `BufferOffset ${bufferOffset} is not the expected ${pending.contiguousReceived}` }
  }
  // `solicited` only ever grows to at most `totalLength`, so bounding by it also
  // keeps the copy inside the buffer — no clamping, no silent short copy.
  if (bufferOffset + data.length > pending.solicited) {
    return {
      ok: false,
      reason: `${data.length} bytes at ${bufferOffset} exceed the ${pending.solicited} bytes solicited`,
    }
  }

  data.copy(pending.buffer, bufferOffset)
  pending.contiguousReceived += data.length
  return {
    ok: true,
    complete: pending.contiguousReceived === pending.totalLength,
    burstComplete: pending.contiguousReceived === pending.solicited,
  }
}
