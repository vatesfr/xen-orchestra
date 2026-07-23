import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { BlockDevice } from './backend.mjs'
import { ScsiStatus, SenseKey } from './constants.mjs'
import {
  buildReadCapacity10,
  buildReadCapacity16,
  buildReportLuns,
  buildStandardInquiry,
  buildVpd,
  handleScsiCommand,
  type ScsiIdentity,
} from './scsi.mjs'
import { decodeCdb, type CommandContext, type ScsiResponseOptions } from './types.mjs'

const IDENTITY: ScsiIdentity = { vendor: 'VATES', product: 'ISCSI LUN', revision: '0001', serial: 'unit-serial-1' }

// --- a trivial in-memory LUN ------------------------------------------------

class MemoryBlockDevice implements BlockDevice {
  readonly #buffer: Buffer
  readonly #blockSize: number

  constructor(sizeBytes: number, blockSize = 512) {
    this.#buffer = Buffer.alloc(sizeBytes)
    this.#blockSize = blockSize
  }

  get buffer(): Buffer {
    return this.#buffer
  }

  getSize(): number {
    return this.#buffer.length
  }
  getBlockSize(): number {
    return this.#blockSize
  }
  async read(offset: number, length: number): Promise<Buffer> {
    return Buffer.from(this.#buffer.subarray(offset, offset + length))
  }
  async write(offset: number, data: Buffer): Promise<void> {
    data.copy(this.#buffer, offset)
  }
  async flush(): Promise<void> {}
  async close(): Promise<void> {}
}

class FakeContext implements CommandContext {
  readonly reads: Array<{ data: Buffer; allocationLength: number }> = []
  readonly responses: Array<{ status: number; options?: ScsiResponseOptions }> = []
  readonly writes: Array<{ itt: number; lunOffset: number; totalLength: number }> = []

  constructor(readonly lun: BlockDevice) {}

  async sendReadData(_itt: number, data: Buffer, allocationLength: number): Promise<void> {
    this.reads.push({ data, allocationLength })
  }
  async beginWrite(itt: number, lunOffset: number, totalLength: number): Promise<void> {
    this.writes.push({ itt, lunOffset, totalLength })
  }
  async sendScsiResponse(_itt: number, status: number, options?: ScsiResponseOptions): Promise<void> {
    this.responses.push({ status, options })
  }
}

function cdb(...bytes: number[]): Buffer {
  const buffer = Buffer.alloc(16)
  Buffer.from(bytes).copy(buffer)
  return buffer
}

describe('decodeCdb', () => {
  it('decodes READ(10) LBA and transfer length', () => {
    const buffer = Buffer.alloc(16)
    buffer[0] = 0x28
    buffer.writeUInt32BE(0x01020304, 2)
    buffer.writeUInt16BE(8, 7)
    assert.deepEqual(decodeCdb(buffer), { kind: 'read', lba: 0x01020304, blocks: 8 })
  })

  it('decodes WRITE(16) LBA and transfer length', () => {
    const buffer = Buffer.alloc(16)
    buffer[0] = 0x8a
    buffer.writeBigUInt64BE(123456789n, 2)
    buffer.writeUInt32BE(16, 10)
    assert.deepEqual(decodeCdb(buffer), { kind: 'write', lba: 123456789, blocks: 16 })
  })

  it('decodes READ CAPACITY(16) only for the right service action', () => {
    assert.equal(decodeCdb(cdb(0x9e, 0x10)).kind, 'readCapacity16')
    assert.equal(decodeCdb(cdb(0x9e, 0x12)).kind, 'unsupported')
  })

  it('maps unknown opcodes to unsupported', () => {
    assert.deepEqual(decodeCdb(cdb(0xff)), { kind: 'unsupported', opcode: 0xff })
  })
})

describe('response encoders', () => {
  it('builds 36-byte standard INQUIRY data for a block device', () => {
    const data = buildStandardInquiry(IDENTITY)
    assert.equal(data.length, 36)
    assert.equal(data[0], 0x00) // direct-access block device
    assert.equal(data[4], 31) // additional length
    assert.equal(data.subarray(8, 16).toString('ascii').trim(), 'VATES')
    assert.equal(data.subarray(16, 32).toString('ascii').trim(), 'ISCSI LUN')
  })

  it('builds READ CAPACITY(10) as (maxLba, blockSize)', () => {
    const data = buildReadCapacity10(2048, 512)
    assert.equal(data.readUInt32BE(0), 2047)
    assert.equal(data.readUInt32BE(4), 512)
  })

  it('clamps READ CAPACITY(10) max LBA to force RC16 on large disks', () => {
    const data = buildReadCapacity10(0x1_0000_0001, 512)
    assert.equal(data.readUInt32BE(0), 0xffffffff)
  })

  it('builds READ CAPACITY(16) with a 64-bit max LBA', () => {
    const data = buildReadCapacity16(0x1_0000_0001, 512)
    assert.equal(data.readBigUInt64BE(0), 0x1_0000_0000n)
    assert.equal(data.readUInt32BE(8), 512)
  })

  it('reports a single LUN 0', () => {
    const data = buildReportLuns()
    assert.equal(data.readUInt32BE(0), 8) // one 8-byte LUN entry
    assert.deepEqual(data.subarray(8, 16), Buffer.alloc(8))
  })

  it('advertises supported VPD pages and rejects unknown ones', () => {
    const page00 = buildVpd(0x00, IDENTITY)
    assert.ok(page00 !== undefined)
    assert.deepEqual([...page00.subarray(4)], [0x00, 0x80, 0x83])
    assert.equal(buildVpd(0x55, IDENTITY), undefined)
  })
})

describe('handleScsiCommand', () => {
  it('INQUIRY returns standard data trimmed to the allocation length', async () => {
    const ctx = new FakeContext(new MemoryBlockDevice(1024 * 1024))
    await handleScsiCommand(cdb(0x12, 0x00, 0x00, 0x00, 36), 1, ctx, IDENTITY)
    assert.equal(ctx.reads.length, 1)
    assert.equal(ctx.reads[0].data.length, 36)
    assert.equal(ctx.reads[0].allocationLength, 36)
  })

  it('READ(10) returns the backing bytes for the requested blocks', async () => {
    const lun = new MemoryBlockDevice(4096)
    lun.buffer.fill(0xab, 512, 1024) // block 1
    const ctx = new FakeContext(lun)
    const buffer = Buffer.alloc(16)
    buffer[0] = 0x28
    buffer.writeUInt32BE(1, 2) // LBA 1
    buffer.writeUInt16BE(1, 7) // 1 block
    await handleScsiCommand(buffer, 1, ctx, IDENTITY)
    assert.equal(ctx.reads.length, 1)
    assert.deepEqual(ctx.reads[0].data, Buffer.alloc(512, 0xab))
  })

  it('WRITE(10) begins a solicited write at the right LUN offset and length', async () => {
    const ctx = new FakeContext(new MemoryBlockDevice(4096))
    const buffer = Buffer.alloc(16)
    buffer[0] = 0x2a
    buffer.writeUInt32BE(2, 2) // LBA 2
    buffer.writeUInt16BE(3, 7) // 3 blocks
    await handleScsiCommand(buffer, 7, ctx, IDENTITY)
    // The data transfer + GOOD response are completed later by the connection.
    assert.deepEqual(ctx.writes, [{ itt: 7, lunOffset: 2 * 512, totalLength: 3 * 512 }])
    assert.equal(ctx.responses.length, 0)
  })

  it('WRITE(10) of zero blocks returns GOOD immediately with no transfer', async () => {
    const ctx = new FakeContext(new MemoryBlockDevice(4096))
    const buffer = Buffer.alloc(16)
    buffer[0] = 0x2a // LBA 0, 0 blocks
    await handleScsiCommand(buffer, 1, ctx, IDENTITY)
    assert.equal(ctx.writes.length, 0)
    assert.deepEqual(ctx.responses, [{ status: ScsiStatus.GOOD, options: undefined }])
  })

  it('rejects an out-of-range READ with CHECK CONDITION', async () => {
    const ctx = new FakeContext(new MemoryBlockDevice(4096)) // 8 blocks
    const buffer = Buffer.alloc(16)
    buffer[0] = 0x28
    buffer.writeUInt32BE(7, 2) // LBA 7
    buffer.writeUInt16BE(4, 7) // 4 blocks -> past end
    await handleScsiCommand(buffer, 1, ctx, IDENTITY)
    assert.equal(ctx.responses.length, 1)
    assert.equal(ctx.responses[0].status, ScsiStatus.CHECK_CONDITION)
    assert.equal(ctx.responses[0].options?.sense?.[2], SenseKey.ILLEGAL_REQUEST)
  })

  it('returns CHECK CONDITION for an unsupported opcode', async () => {
    const ctx = new FakeContext(new MemoryBlockDevice(4096))
    await handleScsiCommand(cdb(0xff), 1, ctx, IDENTITY)
    assert.equal(ctx.responses[0].status, ScsiStatus.CHECK_CONDITION)
    assert.equal(ctx.responses[0].options?.sense?.[12], 0x20) // INVALID COMMAND OPERATION CODE
  })
})
