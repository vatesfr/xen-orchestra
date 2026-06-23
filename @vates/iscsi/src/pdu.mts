import type { Socket } from 'node:net'
import type { Readable } from 'node:stream'
import { readChunk, readChunkStrict } from '@vates/read-chunk'
import { pTimeout } from 'promise-toolbox'

import { BHS_LENGTH, OPCODE_IMMEDIATE, OPCODE_MASK, FLAG_FINAL } from './constants.mjs'

const EMPTY = Buffer.alloc(0)

/** Round `n` up to the next multiple of 4 (iSCSI segments are 4-byte padded). */
export function roundUp4(n: number): number {
  return (n + 3) & ~3
}

/**
 * A fully-received inbound PDU: the 48-byte Basic Header Segment, any Additional
 * Header Segment, and the (unpadded) data segment. Field accessors read the BHS
 * at the offsets defined by RFC 7143; callers pick the ones relevant to the
 * opcode they are handling.
 */
export class IncomingPdu {
  constructor(
    readonly bhs: Buffer,
    readonly ahs: Buffer,
    readonly data: Buffer
  ) {}

  /** 6-bit opcode (immediate bit masked off). */
  get opcode(): number {
    return this.bhs[0] & OPCODE_MASK
  }

  /** Whether the immediate bit is set (initiator requests immediate processing). */
  get immediate(): boolean {
    return (this.bhs[0] & OPCODE_IMMEDIATE) !== 0
  }

  /** Raw opcode-specific flags byte (byte 1). */
  get flags(): number {
    return this.bhs[1]
  }

  get finalBit(): boolean {
    return (this.bhs[1] & FLAG_FINAL) !== 0
  }

  readU8(offset: number): number {
    return this.bhs.readUInt8(offset)
  }

  readU16(offset: number): number {
    return this.bhs.readUInt16BE(offset)
  }

  readU32(offset: number): number {
    return this.bhs.readUInt32BE(offset)
  }

  /** Initiator Task Tag (bytes 16-19), present in every initiator PDU we handle. */
  get itt(): number {
    return this.bhs.readUInt32BE(16)
  }

  /** CmdSN (bytes 24-27) — meaningful on command-carrying PDUs. */
  get cmdSN(): number {
    return this.bhs.readUInt32BE(24)
  }

  /** ExpStatSN (bytes 28-31). */
  get expStatSN(): number {
    return this.bhs.readUInt32BE(28)
  }
}

/**
 * Read exactly one PDU from `stream`, reassembling across TCP boundaries.
 *
 * Resolves to `null` on a clean end-of-stream between PDUs (the peer closed the
 * connection). Throws on a truncated PDU or a read error. Digests are pinned off
 * during login, so no header/data digest bytes are present.
 *
 * This intentionally has no per-read timeout: a target may sit idle between
 * commands indefinitely, and killing such a connection would be wrong. Liveness
 * is a transport concern (socket timeout / NOP keepalives), handled elsewhere.
 */
export async function readPdu(stream: Readable): Promise<IncomingPdu | null> {
  const bhs = await readChunk(stream, BHS_LENGTH)
  if (bhs === null) {
    return null // clean EOF between PDUs
  }
  if (bhs.length !== BHS_LENGTH) {
    throw new Error(`truncated iSCSI BHS (got ${bhs.length} of ${BHS_LENGTH} bytes)`)
  }

  const totalAhsLength = bhs.readUInt8(4)
  const dataSegmentLength = bhs.readUIntBE(5, 3)
  const ahsBytes = totalAhsLength * 4
  const dataBytesPadded = roundUp4(dataSegmentLength)

  let ahs = EMPTY
  let data = EMPTY
  if (ahsBytes + dataBytesPadded > 0) {
    const rest = await readChunkStrict(stream, ahsBytes + dataBytesPadded)
    if (ahsBytes > 0) {
      ahs = rest.subarray(0, ahsBytes)
    }
    data = rest.subarray(ahsBytes, ahsBytes + dataSegmentLength) // strip 4-byte padding
  }

  return new IncomingPdu(bhs, ahs, data)
}

/** Allocate a zeroed 48-byte BHS with byte 0 set to `opcode`. */
export function allocBhs(opcode: number): Buffer {
  const bhs = Buffer.alloc(BHS_LENGTH)
  bhs[0] = opcode
  return bhs
}

/** Write the 24-bit DataSegmentLength field (bytes 5-7) of a BHS. */
export function setDataSegmentLength(bhs: Buffer, length: number): void {
  bhs.writeUIntBE(length, 5, 3)
}

/**
 * Assemble a complete PDU buffer from a 48-byte BHS and an optional data
 * segment, setting DataSegmentLength and applying 4-byte padding.
 */
export function assemblePdu(bhs: Buffer, data?: Buffer): Buffer {
  const length = data?.length ?? 0
  setDataSegmentLength(bhs, length)
  if (length === 0) {
    return bhs
  }
  const padding = roundUp4(length) - length
  return padding === 0 ? Buffer.concat([bhs, data!]) : Buffer.concat([bhs, data!, Buffer.alloc(padding)])
}

/**
 * Write a PDU to the socket, resolving once the kernel has accepted it (honoring
 * back-pressure via the write callback). Rejects if the write errors or does not
 * drain within `timeoutMs` (0 disables the timeout).
 */
export function writePdu(socket: Socket, buffer: Buffer, timeoutMs: number): Promise<void> {
  const promise = new Promise<void>((resolve, reject) => {
    socket.write(buffer, error => (error ? reject(error) : resolve()))
  })
  return timeoutMs > 0 ? pTimeout.call(promise, timeoutMs) : promise
}
