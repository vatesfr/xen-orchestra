import type { BlockDevice } from './backend.mjs'
import {
  ScsiOpcode,
  SERVICE_ACTION_READ_CAPACITY_16,
} from './constants.mjs'

// --- Decoded SCSI requests --------------------------------------------------

/** A SCSI command we recognize, decoded from its CDB. */
export type ScsiRequest =
  | { kind: 'inquiry'; evpd: boolean; pageCode: number; allocationLength: number }
  | { kind: 'reportLuns'; allocationLength: number }
  | { kind: 'readCapacity10' }
  | { kind: 'readCapacity16'; allocationLength: number }
  | { kind: 'read'; lba: number; blocks: number }
  | { kind: 'write'; lba: number; blocks: number }
  | { kind: 'testUnitReady' }
  | { kind: 'requestSense'; allocationLength: number }
  | { kind: 'modeSense'; long: boolean; pageCode: number; allocationLength: number }
  | { kind: 'syncCache' }
  | { kind: 'unsupported'; opcode: number }

/** Largest LBA representable as a safe JS integer; guards 64-bit CDB decoding. */
const MAX_SAFE_LBA = Number.MAX_SAFE_INTEGER

function readLba64(cdb: Buffer, offset: number): number {
  const lba = cdb.readBigUInt64BE(offset)
  if (lba > BigInt(MAX_SAFE_LBA)) {
    throw new Error(`LBA ${lba} exceeds the supported range`)
  }
  return Number(lba)
}

/**
 * Decode a SCSI CDB into a {@link ScsiRequest}. Unknown opcodes (and READ
 * CAPACITY(16)'s sibling service actions we do not implement) map to
 * `{ kind: 'unsupported' }` so the caller can return CHECK CONDITION.
 */
export function decodeCdb(cdb: Buffer): ScsiRequest {
  const opcode = cdb[0]
  switch (opcode) {
    case ScsiOpcode.INQUIRY:
      return {
        kind: 'inquiry',
        evpd: (cdb[1] & 0x01) !== 0,
        pageCode: cdb[2],
        allocationLength: cdb.readUInt16BE(3),
      }
    case ScsiOpcode.REPORT_LUNS:
      return { kind: 'reportLuns', allocationLength: cdb.readUInt32BE(6) }
    case ScsiOpcode.READ_CAPACITY_10:
      return { kind: 'readCapacity10' }
    case ScsiOpcode.SERVICE_ACTION_IN_16:
      if ((cdb[1] & 0x1f) === SERVICE_ACTION_READ_CAPACITY_16) {
        return { kind: 'readCapacity16', allocationLength: cdb.readUInt32BE(10) }
      }
      return { kind: 'unsupported', opcode }
    case ScsiOpcode.READ_10:
      return { kind: 'read', lba: cdb.readUInt32BE(2), blocks: cdb.readUInt16BE(7) }
    case ScsiOpcode.WRITE_10:
      return { kind: 'write', lba: cdb.readUInt32BE(2), blocks: cdb.readUInt16BE(7) }
    case ScsiOpcode.READ_16:
      return { kind: 'read', lba: readLba64(cdb, 2), blocks: cdb.readUInt32BE(10) }
    case ScsiOpcode.WRITE_16:
      return { kind: 'write', lba: readLba64(cdb, 2), blocks: cdb.readUInt32BE(10) }
    case ScsiOpcode.TEST_UNIT_READY:
      return { kind: 'testUnitReady' }
    case ScsiOpcode.REQUEST_SENSE:
      return { kind: 'requestSense', allocationLength: cdb[4] }
    case ScsiOpcode.MODE_SENSE_6:
      return { kind: 'modeSense', long: false, pageCode: cdb[2] & 0x3f, allocationLength: cdb[4] }
    case ScsiOpcode.MODE_SENSE_10:
      return { kind: 'modeSense', long: true, pageCode: cdb[2] & 0x3f, allocationLength: cdb.readUInt16BE(7) }
    case ScsiOpcode.SYNCHRONIZE_CACHE_10:
    case ScsiOpcode.SYNCHRONIZE_CACHE_16:
      return { kind: 'syncCache' }
    default:
      return { kind: 'unsupported', opcode }
  }
}

// --- Session / connection state shared across modules -----------------------

/** Operational parameters fixed during login that the SCSI layer depends on. */
export interface NegotiatedParams {
  /** Initiator's MaxRecvDataSegmentLength — the cap on each Data-In PDU we send. */
  initiatorMaxRecvDataSegmentLength: number
  /** Max bytes solicited per R2T. */
  maxBurstLength: number
}

export type SessionType = 'Discovery' | 'Normal'

/** Sense data to attach to a CHECK CONDITION response. */
export interface SenseInfo {
  key: number
  asc: number
  ascq: number
}

export interface ScsiResponseOptions {
  /** Fixed-format sense data buffer (already serialized). */
  sense?: Buffer
  /** Residual byte counts for under/overflow reporting. */
  residualOverflow?: number
  residualUnderflow?: number
}

/**
 * The capabilities the SCSI command handler needs from its connection: the LUN
 * backend plus the three ways a command can complete (stream read data, begin a
 * solicited write, or just return status). The connection implements this;
 * keeping it an interface avoids a dependency cycle between `scsi` and
 * `connection`.
 */
export interface CommandContext {
  readonly lun: BlockDevice
  /**
   * Send `data` as Data-In PDU(s) with GOOD status piggybacked on the last,
   * trimmed/residual-reported against `allocationLength`.
   */
  sendReadData(itt: number, data: Buffer, allocationLength: number): Promise<void>
  /**
   * Begin a solicited write of `totalLength` bytes landing at `lunOffset`: the
   * connection registers the transfer and sends the first R2T, then returns. The
   * write executes and its SCSI Response is sent once the Data-Out PDUs arrive
   * (which may be interleaved with other commands).
   */
  beginWrite(itt: number, lunOffset: number, totalLength: number): Promise<void>
  /** Send a standalone SCSI Response carrying `status` (+ optional sense/residual). */
  sendScsiResponse(itt: number, status: number, options?: ScsiResponseOptions): Promise<void>
}
