import { Asc, ScsiStatus, SenseKey } from './constants.mjs'
import { decodeCdb, type CommandContext, type SenseInfo } from './types.mjs'

/** SCSI INQUIRY identity strings advertised by the LUN. */
export interface ScsiIdentity {
  /** T10 vendor identification (≤ 8 ASCII chars). */
  vendor: string
  /** Product identification (≤ 16 ASCII chars). */
  product: string
  /** Product revision level (≤ 4 ASCII chars). */
  revision: string
  /** Unit serial number; also seeds the VPD 0x83 device identifier. */
  serial: string
}

// --- low-level encoders -----------------------------------------------------

function writeAscii(buffer: Buffer, offset: number, length: number, value: string): void {
  buffer.fill(0x20, offset, offset + length) // space pad
  buffer.write(value.slice(0, length), offset, 'ascii')
}

/** Standard INQUIRY data (36 bytes) for a direct-access block device. */
export function buildStandardInquiry(identity: ScsiIdentity): Buffer {
  const buffer = Buffer.alloc(36)
  buffer[0] = 0x00 // peripheral qualifier 0, device type 0x00 (direct-access block device)
  buffer[1] = 0x00 // not removable
  buffer[2] = 0x05 // version: SPC-3
  buffer[3] = 0x02 // response data format 2
  buffer[4] = 31 // additional length (total 36 - 5)
  writeAscii(buffer, 8, 8, identity.vendor)
  writeAscii(buffer, 16, 16, identity.product)
  writeAscii(buffer, 32, 4, identity.revision)
  return buffer
}

const SUPPORTED_VPD_PAGES = [0x00, 0x80, 0x83]

/**
 * Build an INQUIRY EVPD page, or `undefined` for an unsupported page code (the
 * caller then returns CHECK CONDITION / INVALID FIELD IN CDB).
 */
export function buildVpd(pageCode: number, identity: ScsiIdentity): Buffer | undefined {
  switch (pageCode) {
    case 0x00: {
      // Supported VPD pages.
      const buffer = Buffer.alloc(4 + SUPPORTED_VPD_PAGES.length)
      buffer[1] = 0x00
      buffer.writeUInt16BE(SUPPORTED_VPD_PAGES.length, 2)
      SUPPORTED_VPD_PAGES.forEach((page, i) => {
        buffer[4 + i] = page
      })
      return buffer
    }
    case 0x80: {
      // Unit serial number.
      const serial = Buffer.from(identity.serial, 'ascii')
      const buffer = Buffer.alloc(4 + serial.length)
      buffer[1] = 0x80
      buffer.writeUInt16BE(serial.length, 2)
      serial.copy(buffer, 4)
      return buffer
    }
    case 0x83: {
      // Device identification: one T10-vendor-ID-based designator (ASCII).
      const designator = Buffer.alloc(8 + identity.serial.length)
      writeAscii(designator, 0, 8, identity.vendor)
      designator.write(identity.serial, 8, 'ascii')
      const descriptor = Buffer.alloc(4 + designator.length)
      descriptor[0] = 0x02 // code set: ASCII
      descriptor[1] = 0x01 // association: logical unit, designator type: T10 vendor ID based
      descriptor[3] = designator.length
      designator.copy(descriptor, 4)
      const buffer = Buffer.alloc(4 + descriptor.length)
      buffer[1] = 0x83
      buffer.writeUInt16BE(descriptor.length, 2)
      descriptor.copy(buffer, 4)
      return buffer
    }
    default:
      return undefined
  }
}

/** READ CAPACITY(10) parameter data (8 bytes). */
export function buildReadCapacity10(blockCount: number, blockSize: number): Buffer {
  const buffer = Buffer.alloc(8)
  const maxLba = blockCount - 1
  // If the capacity overflows 32 bits, return 0xffffffff to force the initiator
  // to issue READ CAPACITY(16).
  buffer.writeUInt32BE(maxLba > 0xffffffff ? 0xffffffff : maxLba, 0)
  buffer.writeUInt32BE(blockSize, 4)
  return buffer
}

/** READ CAPACITY(16) parameter data (32 bytes). */
export function buildReadCapacity16(blockCount: number, blockSize: number): Buffer {
  const buffer = Buffer.alloc(32)
  buffer.writeBigUInt64BE(BigInt(blockCount - 1), 0)
  buffer.writeUInt32BE(blockSize, 8)
  return buffer
}

/** REPORT LUNS parameter data advertising a single LUN 0 (16 bytes). */
export function buildReportLuns(): Buffer {
  const buffer = Buffer.alloc(16)
  buffer.writeUInt32BE(8, 0) // LUN list length: one 8-byte LUN entry
  return buffer // bytes 8-15 are LUN 0 (all zero)
}

/** Fixed-format sense data (18 bytes). */
export function buildFixedSense({ key, asc, ascq }: SenseInfo): Buffer {
  const buffer = Buffer.alloc(18)
  buffer[0] = 0x70 // response code: current error, fixed format
  buffer[2] = key
  buffer[7] = 10 // additional sense length (18 - 8)
  buffer[12] = asc
  buffer[13] = ascq
  return buffer
}

/** Minimal MODE SENSE parameter data: a header with no block descriptor or pages. */
export function buildModeSense(long: boolean): Buffer {
  if (long) {
    const buffer = Buffer.alloc(8)
    buffer.writeUInt16BE(6, 0) // mode data length (8 - 2)
    return buffer
  }
  const buffer = Buffer.alloc(4)
  buffer[0] = 3 // mode data length (4 - 1)
  return buffer
}

const ILLEGAL_REQUEST_INVALID_OPCODE: SenseInfo = {
  key: SenseKey.ILLEGAL_REQUEST,
  ...Asc.INVALID_COMMAND_OPERATION_CODE,
}
const ILLEGAL_REQUEST_INVALID_FIELD: SenseInfo = {
  key: SenseKey.ILLEGAL_REQUEST,
  ...Asc.INVALID_FIELD_IN_CDB,
}
const ILLEGAL_REQUEST_LBA_OUT_OF_RANGE: SenseInfo = {
  key: SenseKey.ILLEGAL_REQUEST,
  ...Asc.LOGICAL_BLOCK_ADDRESS_OUT_OF_RANGE,
}

function checkCondition(ctx: CommandContext, itt: number, sense: SenseInfo): Promise<void> {
  return ctx.sendScsiResponse(itt, ScsiStatus.CHECK_CONDITION, { sense: buildFixedSense(sense) })
}

/**
 * Decode and execute one SCSI Command, driving completion through `ctx`.
 *
 * `cdb` is the 16-byte CDB from the SCSI Command PDU and `itt` its Initiator
 * Task Tag. Read commands stream Data-In; WRITE solicits Data-Out via R2T;
 * everything else returns status (with sense on error).
 */
export async function handleScsiCommand(
  cdb: Buffer,
  itt: number,
  ctx: CommandContext,
  identity: ScsiIdentity
): Promise<void> {
  const { lun } = ctx
  const blockSize = lun.getBlockSize()
  const blockCount = lun.getSize() / blockSize
  const request = decodeCdb(cdb)

  switch (request.kind) {
    case 'inquiry': {
      if (!request.evpd) {
        if (request.pageCode !== 0) {
          // EVPD clear but a page code was given: invalid per SPC.
          return checkCondition(ctx, itt, ILLEGAL_REQUEST_INVALID_FIELD)
        }
        return ctx.sendReadData(itt, buildStandardInquiry(identity), request.allocationLength)
      }
      const page = buildVpd(request.pageCode, identity)
      if (page === undefined) {
        return checkCondition(ctx, itt, ILLEGAL_REQUEST_INVALID_FIELD)
      }
      return ctx.sendReadData(itt, page, request.allocationLength)
    }

    case 'reportLuns':
      return ctx.sendReadData(itt, buildReportLuns(), request.allocationLength)

    case 'readCapacity10':
      return ctx.sendReadData(itt, buildReadCapacity10(blockCount, blockSize), 8)

    case 'readCapacity16':
      return ctx.sendReadData(itt, buildReadCapacity16(blockCount, blockSize), request.allocationLength)

    case 'read': {
      if (request.lba + request.blocks > blockCount) {
        return checkCondition(ctx, itt, ILLEGAL_REQUEST_LBA_OUT_OF_RANGE)
      }
      const byteLength = request.blocks * blockSize
      const data = byteLength === 0 ? Buffer.alloc(0) : await lun.read(request.lba * blockSize, byteLength)
      return ctx.sendReadData(itt, data, byteLength)
    }

    case 'write': {
      if (request.lba + request.blocks > blockCount) {
        return checkCondition(ctx, itt, ILLEGAL_REQUEST_LBA_OUT_OF_RANGE)
      }
      const byteLength = request.blocks * blockSize
      if (byteLength === 0) {
        return ctx.sendScsiResponse(itt, ScsiStatus.GOOD)
      }
      // Hand off to the connection: it solicits the data via R2T and sends the
      // SCSI Response once the (possibly interleaved) Data-Out PDUs complete.
      return ctx.beginWrite(itt, request.lba * blockSize, byteLength)
    }

    case 'testUnitReady':
      return ctx.sendScsiResponse(itt, ScsiStatus.GOOD)

    case 'requestSense': {
      // No deferred error model in v1: always report NO SENSE.
      const sense = buildFixedSense({ key: SenseKey.NO_SENSE, ...Asc.NO_ADDITIONAL_SENSE })
      return ctx.sendReadData(itt, sense, request.allocationLength)
    }

    case 'modeSense':
      return ctx.sendReadData(itt, buildModeSense(request.long), request.allocationLength)

    case 'syncCache':
      await lun.flush()
      return ctx.sendScsiResponse(itt, ScsiStatus.GOOD)

    case 'unsupported':
      return checkCondition(ctx, itt, ILLEGAL_REQUEST_INVALID_OPCODE)
  }
}
