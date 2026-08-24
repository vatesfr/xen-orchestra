// Offset  Size  Field
//      0     4  magic: 0x48424400 ("HBD\0")
//      4     1  codec: 0x00 = raw (no compression),0x01= brotli compression  ,  reserved for future codecs,
//      5     3  reserved (zero)
//      8     8  verified_at: Unix timestamp in milliseconds of last successful hash check (0 = never)
//     16    32  payload_hash: SHA-256 of the raw (uncompressed, unencrypted) payload — redundant with
//               the store path but enables self-contained verification without path context
//     48   464  reserved (zero)
//    512     N  payload: raw block data (currently uncompressed, unencrypted; N = blockSize)
import crypto from 'node:crypto'
import type { Branded } from '@vates/types'
import { compareVersions } from 'compare-versions'
import { createLogger } from '@xen-orchestra/log'
const { warn } = createLogger('xo:backup-archive:hbd')

export type BlockHash = Branded<'hbd-block-hash'>

export const VERSION = '0.0.1'
export const HBD_HEADER_SIZE = 512
export const HBD_MAGIC = 0x48424400
export const HASH_SIZE = 32 // bytes, on disk

// block header field offsets, in bytes (see the layout table at the top of this file)
const OFFSET_MAGIC = 0
const OFFSET_CODEC = 4
const OFFSET_VERIFIED_AT = 8
const OFFSET_PAYLOAD_HASH = 16

export const CODEC_RAW = 0x00
export const CODEC_BROTLI = 0x01

const ZERO_ENTRY = Buffer.alloc(HASH_SIZE)
const HASH_HEX_LENGTH = HASH_SIZE * 2 // chars, in memory
const HASH_PATH_DEPTH = 4
const HASH_PATH_SEGMENT = HASH_HEX_LENGTH / HASH_PATH_DEPTH
const BLOCK_HASH_RE = new RegExp(`^[0-9a-f]{${HASH_HEX_LENGTH}}$`)

export function asBlockHash(value: string): BlockHash {
  if (!BLOCK_HASH_RE.test(value)) {
    throw new Error(`not a valid block hash: ${value}`)
  }
  return value as BlockHash
}

type DedupType = 'PER_BACKUP_REPOSITORY' | 'PER_DISK'

export interface HashedDiskMetadata {
  version: string
  virtualSize: number
  blockSize: number
  uuid: string
  parentUuid?: string
  parentPath?: string // relative path to parent hbd file from this hbd file
  dedupType: DedupType
  localBlocksPath: string //relative to this file
  hashesPath: string //relative to this file
}

export function checkVersion(version: string) {
  if (compareVersions(version, VERSION) > 0) {
    throw new Error(`Unsupported hbd version ${version}, expected: ${VERSION}`)
  }
}

export function blockRelPath(hash: BlockHash): string {
  return `${hash.slice(0, HASH_PATH_SEGMENT)}/${hash.slice(HASH_PATH_SEGMENT, HASH_PATH_SEGMENT * 2)}/${hash.slice(HASH_PATH_SEGMENT * 2, HASH_PATH_SEGMENT * 3)}/${hash.slice(HASH_PATH_SEGMENT * 3, HASH_PATH_SEGMENT * 4)}`
}

export interface HbdBlockHeader {
  magic: number
  codec: number
  verifiedAt: number // ms since epoch, 0 = never verified
  payloadHash: BlockHash
}

export function buildBlockHeader(hash: BlockHash, codec = CODEC_RAW, verifiedAt = 0): Buffer {
  if (!Number.isInteger(codec) || codec < 0 || codec > 0xff) {
    throw new Error(`codec must be a single byte, got ${codec}`)
  }
  if (!Number.isSafeInteger(verifiedAt) || verifiedAt < 0) {
    throw new Error(`verifiedAt must be a non negative safe integer, got ${verifiedAt}`)
  }

  // zero filled, which is exactly what the reserved ranges (5..7 and 48..511) must contain
  const header = Buffer.alloc(HBD_HEADER_SIZE)

  // big endian so the bytes read as "HBD\0" in a hex dump
  header.writeUInt32BE(HBD_MAGIC, OFFSET_MAGIC)
  header.writeUInt8(codec, OFFSET_CODEC)
  header.writeBigInt64LE(BigInt(verifiedAt), OFFSET_VERIFIED_AT)

  if (header.write(hash, OFFSET_PAYLOAD_HASH, 'hex') !== HASH_SIZE) {
    throw new Error(`not a valid block hash: ${hash}`)
  }

  return header
}

/**
 * Accepts a buffer of at least HBD_HEADER_SIZE bytes, so a full block
 * (header + payload) can be passed without slicing it first.
 *
 * Does not validate `magic`: it is returned so the caller decides what a
 * mismatch means. Any caller reading a payload MUST check it.
 */
export function parseBlockHeader(buffer: Buffer): HbdBlockHeader {
  if (buffer.length < HBD_HEADER_SIZE) {
    throw new Error(`a block header is ${HBD_HEADER_SIZE} bytes, got ${buffer.length}`)
  }

  return {
    magic: buffer.readUInt32BE(OFFSET_MAGIC),
    codec: buffer.readUInt8(OFFSET_CODEC),
    verifiedAt: Number(buffer.readBigInt64LE(OFFSET_VERIFIED_AT)),
    payloadHash: buffer.subarray(OFFSET_PAYLOAD_HASH, OFFSET_PAYLOAD_HASH + HASH_SIZE).toString('hex') as BlockHash,
  }
}

/**
 * Validates a full block file (header + payload) and returns its payload.
 *
 * `expectedHash` is the hash the BAT holds for this index: it is the authority,
 * the header is only cross checked against it. Pure, no I/O — the caller reads
 * the bytes and decides what to do with a throw.
 */
export function decodeBlock(
  buffer: Buffer,
  blockSize: number,
  expectedHash: BlockHash
): { header: HbdBlockHeader; payload: Buffer } {
  const expectedLength = HBD_HEADER_SIZE + blockSize
  if (buffer.length < expectedLength) {
    throw new Error(`truncated block: expected ${expectedLength} bytes, got ${buffer.length}`)
  }

  const header = parseBlockHeader(buffer)
  if (header.magic !== HBD_MAGIC) {
    throw new Error(`not a hbd block: magic is 0x${header.magic.toString(16)}`)
  }
  if (header.payloadHash !== expectedHash) {
    // wrong file at the right path, or a store file overwritten by another hash
    throw new Error(`block hash mismatch: header says ${header.payloadHash}, expected ${expectedHash}`)
  }

  const payload = buffer.subarray(HBD_HEADER_SIZE, expectedLength)

  // Only raw payloads can be checked here. An authenticated encryption codec
  // gets the same guarantee from its auth tag at decryption time.
  if (header.codec === CODEC_RAW) {
    const actualHash = sha256hex(payload)
    if (actualHash !== expectedHash) {
      warn('block corruption on read', { expected: expectedHash, actual: actualHash })
      throw new Error(`block corruption on read: expected ${expectedHash}, got ${actualHash}`)
    }
  }

  return { header, payload }
}

export function hashesFileName(date: Date): string {
  return `hashes.${date.getTime()}.hash`
}

export function sha256hex(data: Buffer): BlockHash {
  const hash = crypto.createHash('sha256')
  return hash.update(data).digest('hex') as BlockHash
}

export class BlockAllocationTable {
  #bat: Buffer
  #maxBlockCount: number

  static allocate(maxBlockCount: number): BlockAllocationTable {
    return new BlockAllocationTable(Buffer.alloc(maxBlockCount * HASH_SIZE), maxBlockCount)
  }

  static fromBuffer(buffer: Buffer, maxBlockCount: number, force = false): BlockAllocationTable {
    const expected = maxBlockCount * HASH_SIZE
    if (buffer.length !== expected) {
      const message = `unexpected hashes file size: ${buffer.length} instead of ${expected},`
      if (force) {
        warn(message)
        maxBlockCount = Math.min(maxBlockCount, Math.floor(buffer.length / HASH_SIZE))
      } else {
        throw new Error(message)
      }
    }
    return new BlockAllocationTable(buffer, maxBlockCount)
  }

  private constructor(bat: Buffer, maxBlockCount: number) {
    this.#bat = bat
    this.#maxBlockCount = maxBlockCount
  }

  #entry(index: number): Buffer {
    if (index < 0 || index >= this.#maxBlockCount) {
      throw new Error(`block index ${index} out of range [0, ${this.#maxBlockCount})`)
    }
    const offset = index * HASH_SIZE
    return this.#bat.subarray(offset, offset + HASH_SIZE)
  }

  get(index: number): BlockHash {
    return this.#entry(index).toString('hex') as BlockHash
  }

  set(index: number, hash: BlockHash) {
    this.#entry(index).write(hash, 'hex')
  }

  isEmpty(index: number): boolean {
    return this.#entry(index).equals(ZERO_ENTRY)
  }

  countAllocated(): number {
    let total = 0
    for (let idx = 0; idx < this.#maxBlockCount; idx++) {
      if (!this.isEmpty(idx)) total++
    }
    return total
  }

  indexes(): Array<number> {
    const res = new Array<number>()
    for (let idx = 0; idx < this.#maxBlockCount; idx++) {
      if (!this.isEmpty(idx)) res.push(idx)
    }
    return res
  }

  toBuffer(): Buffer {
    return this.#bat
  }
}
