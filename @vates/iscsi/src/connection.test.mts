import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Socket } from 'node:net'
import { Duplex } from 'node:stream'

import type { BlockDevice } from './backend.mjs'
import {
  DATA_IN_FLAG_FINAL,
  DATA_IN_FLAG_OVERFLOW,
  DATA_IN_FLAG_STATUS,
  DATA_IN_FLAG_UNDERFLOW,
  FLAG_FINAL,
  InitiatorOpcode,
  LOGIN_CSG_SHIFT,
  LOGIN_FLAG_TRANSIT,
  LoginStage,
  LoginStatusClass,
  OPCODE_IMMEDIATE,
  RejectReason,
  RESERVED_TAG,
  ScsiStatus,
  SenseKey,
  TargetOpcode,
} from './constants.mjs'
import { Connection, type ConnectionDeps } from './connection.mjs'
import { serializeTextKeys } from './login.mjs'
import { assemblePdu, IncomingPdu } from './pdu.mjs'
import type { ScsiIdentity } from './scsi.mjs'

const IDENTITY: ScsiIdentity = { vendor: 'VATES', product: 'ISCSI LUN', revision: '0001', serial: 'unit-serial-1' }
const BLOCK_SIZE = 512
const LUN_SIZE = 16 * BLOCK_SIZE

// Small enough that a handful of blocks splits into several PDUs / bursts, so
// the chunking and multi-burst paths are exercised without huge buffers.
const MAX_RECV_DATA_SEGMENT_LENGTH = 512
const MAX_BURST_LENGTH = 512

// --- test doubles -----------------------------------------------------------

/**
 * Stands in for the TCP socket. `deliver()` queues a PDU for the connection's
 * read loop (the readable side); everything the connection writes is captured
 * in `sent` rather than transmitted. `Connection` only ever reads, writes, and
 * destroys its socket, plus `localAddress`/`localPort` for SendTargets — hence
 * the narrow cast in `asSocket()`.
 */
class FakeSocket extends Duplex {
  readonly sent: Array<Buffer> = []
  readonly localAddress = '10.0.0.1'
  readonly localPort = 3260

  override _read(): void {}

  override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.sent.push(Buffer.from(chunk))
    callback()
  }

  /** Hand a PDU to the connection. */
  deliver(pdu: Buffer): void {
    this.push(pdu)
  }

  /** Clean end-of-stream, which ends `serve()`'s read loop. */
  finish(): void {
    this.push(null)
  }

  asSocket(): Socket {
    return this as unknown as Socket
  }
}

class MemoryLun implements BlockDevice {
  readonly content = Buffer.alloc(LUN_SIZE)
  /** Set to make the next `write()` fail, standing in for a backend error. */
  failNextWrite = false

  getSize(): number {
    return this.content.length
  }
  getBlockSize(): number {
    return BLOCK_SIZE
  }
  async read(offset: number, length: number): Promise<Buffer> {
    return Buffer.from(this.content.subarray(offset, offset + length))
  }
  async write(offset: number, data: Buffer): Promise<void> {
    if (this.failNextWrite) {
      this.failNextWrite = false
      throw new Error('backend write failed')
    }
    data.copy(this.content, offset)
  }
  async flush(): Promise<void> {}
  async close(): Promise<void> {}
}

// --- initiator-side PDU builders --------------------------------------------

/** A single-PDU operational login that transits straight to Full Feature Phase. */
const loginPdu = (): Buffer => {
  const bhs = Buffer.alloc(48)
  bhs[0] = InitiatorOpcode.LOGIN_REQUEST | OPCODE_IMMEDIATE
  bhs[1] = LOGIN_FLAG_TRANSIT | (LoginStage.OPERATIONAL_NEGOTIATION << LOGIN_CSG_SHIFT) | LoginStage.FULL_FEATURE_PHASE
  bhs.writeUInt32BE(1, 16) // ITT
  return assemblePdu(
    bhs,
    serializeTextKeys([
      ['InitiatorName', 'iqn.2026-01.tech.vates:test-initiator'],
      ['SessionType', 'Normal'],
      ['HeaderDigest', 'None'],
      ['DataDigest', 'None'],
      ['MaxRecvDataSegmentLength', String(MAX_RECV_DATA_SEGMENT_LENGTH)],
      ['MaxBurstLength', String(MAX_BURST_LENGTH)],
    ])
  )
}

const scsiCommandPdu = ({
  itt,
  cmdSN,
  cdb,
  data,
}: {
  itt: number
  cmdSN: number
  cdb: Buffer
  data?: Buffer
}): Buffer => {
  const bhs = Buffer.alloc(48)
  bhs[0] = InitiatorOpcode.SCSI_COMMAND
  bhs[1] = FLAG_FINAL
  bhs.writeUInt32BE(itt, 16)
  bhs.writeUInt32BE(cmdSN, 24)
  cdb.copy(bhs, 32)
  return assemblePdu(bhs, data)
}

const dataOutPdu = ({
  itt,
  targetTransferTag,
  bufferOffset,
  data,
  dataSN = 0,
}: {
  itt: number
  targetTransferTag: number
  bufferOffset: number
  data: Buffer
  dataSN?: number
}): Buffer => {
  const bhs = Buffer.alloc(48)
  bhs[0] = InitiatorOpcode.SCSI_DATA_OUT
  bhs[1] = FLAG_FINAL
  bhs.writeUInt32BE(itt, 16)
  bhs.writeUInt32BE(targetTransferTag, 20)
  bhs.writeUInt32BE(dataSN, 36)
  bhs.writeUInt32BE(bufferOffset, 40)
  return assemblePdu(bhs, data)
}

const cdb10 = (opcode: number, lba: number, blocks: number): Buffer => {
  const cdb = Buffer.alloc(16)
  cdb[0] = opcode
  cdb.writeUInt32BE(lba, 2)
  cdb.writeUInt16BE(blocks, 7)
  return cdb
}
const read10 = (lba: number, blocks: number) => cdb10(0x28, lba, blocks)
const write10 = (lba: number, blocks: number) => cdb10(0x2a, lba, blocks)

const cdb16 = (opcode: number, lba: bigint, blocks: number): Buffer => {
  const cdb = Buffer.alloc(16)
  cdb[0] = opcode
  cdb.writeBigUInt64BE(lba, 2)
  cdb.writeUInt32BE(blocks, 10)
  return cdb
}
const read16 = (lba: bigint, blocks: number) => cdb16(0x88, lba, blocks)
const write16 = (lba: bigint, blocks: number) => cdb16(0x8a, lba, blocks)

const inquiry = (allocationLength: number): Buffer => {
  const cdb = Buffer.alloc(16)
  cdb[0] = 0x12
  cdb.writeUInt16BE(allocationLength, 3)
  return cdb
}

// --- harness ----------------------------------------------------------------

/** Re-read a PDU the target sent, so assertions can talk in field names. */
const parseSent = (buffer: Buffer): IncomingPdu => {
  const dataSegmentLength = buffer.readUIntBE(5, 3)
  return new IncomingPdu(buffer.subarray(0, 48), Buffer.alloc(0), buffer.subarray(48, 48 + dataSegmentLength))
}

/**
 * Sense key of a SCSI Response: its data segment is a 2-byte sense length then
 * the fixed-format sense data, whose byte 2 holds the key in its low nibble.
 */
const senseKey = (response: IncomingPdu): number => response.data[4] & 0x0f

class Harness {
  readonly socket = new FakeSocket()
  readonly lun = new MemoryLun()
  readonly serving: Promise<void>

  constructor(overrides: Partial<ConnectionDeps> = {}) {
    const deps: ConnectionDeps = {
      iqn: 'iqn.2026-01.tech.vates:target',
      identity: IDENTITY,
      lun: this.lun,
      writeTimeoutMs: 0,
      cmdWindow: 64,
      readConcurrency: 4,
      allocateTsih: () => 1,
      ...overrides,
    }
    this.serving = new Connection(this.socket.asSocket(), deps).serve()
  }

  /** Every PDU the target has sent, parsed. */
  get sent(): Array<IncomingPdu> {
    return this.socket.sent.map(parseSent)
  }

  /**
   * Let the read loop run until the target has sent `count` PDUs in total,
   * optionally delivering something first. Bounded so a response that never
   * comes fails the test instead of hanging it.
   */
  async untilSent(count: number, deliver?: () => void): Promise<Array<IncomingPdu>> {
    deliver?.()
    for (let turn = 0; turn < 500 && this.socket.sent.length < count; turn++) {
      await new Promise(resolve => setImmediate(resolve))
    }
    const sent = this.sent
    assert.ok(
      sent.length >= count,
      `expected ${count} PDUs, got ${sent.length}: ${sent.map(pdu => pdu.opcode.toString(16)).join(',')}`
    )
    return sent
  }

  /** Log in and confirm the target accepted it. */
  async login(): Promise<void> {
    // relative to what has already been sent, so this works mid-connection too
    const baseline = this.socket.sent.length
    const response = (await this.untilSent(baseline + 1, () => this.socket.deliver(loginPdu())))[baseline]
    assert.equal(response.opcode, TargetOpcode.LOGIN_RESPONSE)
    assert.equal(response.readU8(36), LoginStatusClass.SUCCESS)
  }

  async close(): Promise<void> {
    this.socket.finish()
    await this.serving
  }
}

/** Log in, then run `body`, always tearing the connection down afterwards. */
const withSession = async (body: (harness: Harness) => Promise<void>, overrides?: Partial<ConnectionDeps>) => {
  const harness = new Harness(overrides)
  try {
    await harness.login()
    await body(harness)
  } finally {
    await harness.close()
  }
}

const CMD_WINDOW = 64
/** ExpCmdSN (bytes 28-31) and MaxCmdSN (32-35), the command window we advertise. */
const commandWindow = (pdu: IncomingPdu) => ({ expCmdSN: pdu.readU32(28), maxCmdSN: pdu.readU32(32) })

describe('command window', () => {
  // Bytes 24-27 are CmdSN only on command PDUs. On a Data-Out (RFC 7143 §11.7)
  // and a SNACK they are reserved, so reading a window out of them yields the
  // zeroes an initiator puts there — advertising ExpCmdSN=1 mid-session. Real
  // initiators discard that as stale only while session CmdSN < 2^31; past the
  // wrap it compares as newer, is adopted, and the window collapses to a stall.
  it('is not recomputed from the reserved bytes of a Data-Out', async () => {
    await withSession(async harness => {
      // two bursts, so an R2T is emitted *after* a Data-Out has been processed
      harness.socket.deliver(scsiCommandPdu({ itt: 31, cmdSN: 50, cdb: write10(0, 2) }))
      const [, firstR2t] = await harness.untilSent(2)
      const expected = { expCmdSN: 51, maxCmdSN: 51 + CMD_WINDOW }
      assert.deepEqual(commandWindow(firstR2t), expected)

      const ttt = firstR2t.readU32(20)
      harness.socket.deliver(
        dataOutPdu({ itt: 31, targetTransferTag: ttt, bufferOffset: 0, data: Buffer.alloc(BLOCK_SIZE, 0x11) })
      )

      const [, , secondR2t] = await harness.untilSent(3)
      assert.equal(secondR2t.opcode, TargetOpcode.R2T)
      assert.deepEqual(commandWindow(secondR2t), expected)

      harness.socket.deliver(
        dataOutPdu({
          itt: 31,
          targetTransferTag: ttt,
          bufferOffset: BLOCK_SIZE,
          data: Buffer.alloc(BLOCK_SIZE, 0x22),
          dataSN: 1,
        })
      )

      const [, , , response] = await harness.untilSent(4)
      assert.equal(response.opcode, TargetOpcode.SCSI_RESPONSE)
      assert.deepEqual(commandWindow(response), expected)
    })
  })

  it('is not recomputed from an opcode the target does not implement', async () => {
    await withSession(async harness => {
      harness.socket.deliver(scsiCommandPdu({ itt: 33, cmdSN: 70, cdb: read10(0, 1) }))
      const [, dataIn] = await harness.untilSent(2)
      const expected = { expCmdSN: 71, maxCmdSN: 71 + CMD_WINDOW }
      assert.deepEqual(commandWindow(dataIn), expected)

      // SNACK also has bytes 24-27 reserved; it is rejected, but the Reject it
      // gets must still carry the window the session actually reached
      const bhs = Buffer.alloc(48)
      bhs[0] = InitiatorOpcode.SNACK_REQUEST
      harness.socket.deliver(assemblePdu(bhs))

      const [, , rejected] = await harness.untilSent(3)
      assert.equal(rejected.opcode, TargetOpcode.REJECT)
      assert.equal(rejected.readU8(2), RejectReason.COMMAND_NOT_SUPPORTED)
      assert.deepEqual(commandWindow(rejected), expected)
    })
  })

  it('advances the window for each command PDU, but not for an immediate one', async () => {
    await withSession(async harness => {
      harness.socket.deliver(scsiCommandPdu({ itt: 35, cmdSN: 5, cdb: read10(0, 1) }))
      const [, dataIn] = await harness.untilSent(2)
      assert.deepEqual(commandWindow(dataIn), { expCmdSN: 6, maxCmdSN: 6 + CMD_WINDOW })

      // an immediate NOP-Out is answered but consumes no CmdSN slot
      const bhs = Buffer.alloc(48)
      bhs[0] = InitiatorOpcode.NOP_OUT | OPCODE_IMMEDIATE
      bhs[1] = FLAG_FINAL
      bhs.writeUInt32BE(37, 16)
      bhs.writeUInt32BE(RESERVED_TAG, 20)
      bhs.writeUInt32BE(6, 24)
      harness.socket.deliver(assemblePdu(bhs))

      const [, , nopIn] = await harness.untilSent(3)
      assert.equal(nopIn.opcode, TargetOpcode.NOP_IN)
      assert.deepEqual(commandWindow(nopIn), { expCmdSN: 6, maxCmdSN: 6 + CMD_WINDOW })
    })
  })
})

describe('login', () => {
  it('reaches full feature phase and only then accepts commands', async () => {
    const harness = new Harness()
    try {
      // a command before login is a protocol error, not a served command
      harness.socket.deliver(scsiCommandPdu({ itt: 5, cmdSN: 0, cdb: read10(0, 1) }))
      const [rejected] = await harness.untilSent(1)
      assert.equal(rejected.opcode, TargetOpcode.REJECT)
      assert.equal(rejected.readU8(2), RejectReason.PROTOCOL_ERROR)

      await harness.login()

      // the same command now gets served
      harness.socket.deliver(scsiCommandPdu({ itt: 5, cmdSN: 1, cdb: read10(0, 1) }))
      const sent = await harness.untilSent(3)
      assert.equal(sent[2].opcode, TargetOpcode.SCSI_DATA_IN)
    } finally {
      await harness.close()
    }
  })
})

describe('write path wiring', () => {
  it('solicits the data, commits it to the LUN, and answers GOOD', async () => {
    await withSession(async harness => {
      harness.socket.deliver(scsiCommandPdu({ itt: 9, cmdSN: 1, cdb: write10(2, 1) }))

      const [, r2t] = await harness.untilSent(2)
      assert.equal(r2t.opcode, TargetOpcode.R2T)
      assert.equal(r2t.itt, 9)
      assert.equal(r2t.readU32(36), 0) // R2TSN
      assert.equal(r2t.readU32(40), 0) // BufferOffset
      assert.equal(r2t.readU32(44), BLOCK_SIZE) // DesiredDataTransferLength

      const payload = Buffer.alloc(BLOCK_SIZE, 0xab)
      harness.socket.deliver(dataOutPdu({ itt: 9, targetTransferTag: r2t.readU32(20), bufferOffset: 0, data: payload }))

      const [, , response] = await harness.untilSent(3)
      assert.equal(response.opcode, TargetOpcode.SCSI_RESPONSE)
      assert.equal(response.readU8(3), ScsiStatus.GOOD)
      // ... and the bytes landed at the LBA the CDB asked for, nowhere else
      assert.deepEqual(harness.lun.content.subarray(2 * BLOCK_SIZE, 3 * BLOCK_SIZE), payload)
      assert.deepEqual(harness.lun.content.subarray(0, 2 * BLOCK_SIZE), Buffer.alloc(2 * BLOCK_SIZE))
      assert.deepEqual(harness.lun.content.subarray(3 * BLOCK_SIZE), Buffer.alloc(LUN_SIZE - 3 * BLOCK_SIZE))
    })
  })

  it('solicits one burst at a time for a write larger than MaxBurstLength', async () => {
    await withSession(async harness => {
      // 2 blocks with a 1-block burst limit: two R2Ts, second only after the first lands
      harness.socket.deliver(scsiCommandPdu({ itt: 11, cmdSN: 1, cdb: write10(0, 2) }))

      const [, first] = await harness.untilSent(2)
      assert.equal(first.readU32(36), 0) // R2TSN
      assert.equal(first.readU32(40), 0) // BufferOffset
      assert.equal(first.readU32(44), MAX_BURST_LENGTH)

      const ttt = first.readU32(20)
      harness.socket.deliver(
        dataOutPdu({ itt: 11, targetTransferTag: ttt, bufferOffset: 0, data: Buffer.alloc(BLOCK_SIZE, 0x11) })
      )

      const [, , second] = await harness.untilSent(3)
      assert.equal(second.opcode, TargetOpcode.R2T)
      assert.equal(second.readU32(36), 1) // R2TSN advanced
      assert.equal(second.readU32(40), BLOCK_SIZE) // next burst picks up where the first ended
      assert.equal(second.readU32(44), MAX_BURST_LENGTH)
      // nothing is committed until the whole command has landed
      assert.deepEqual(harness.lun.content.subarray(0, BLOCK_SIZE), Buffer.alloc(BLOCK_SIZE))

      harness.socket.deliver(
        dataOutPdu({
          itt: 11,
          targetTransferTag: ttt,
          bufferOffset: BLOCK_SIZE,
          data: Buffer.alloc(BLOCK_SIZE, 0x22),
          dataSN: 1,
        })
      )

      const [, , , response] = await harness.untilSent(4)
      assert.equal(response.opcode, TargetOpcode.SCSI_RESPONSE)
      assert.equal(response.readU8(3), ScsiStatus.GOOD)
      assert.deepEqual(
        harness.lun.content.subarray(0, 2 * BLOCK_SIZE),
        Buffer.concat([Buffer.alloc(BLOCK_SIZE, 0x11), Buffer.alloc(BLOCK_SIZE, 0x22)])
      )
    })
  })

  it('rejects an unplaceable Data-Out and drops the command with it', async () => {
    await withSession(async harness => {
      harness.socket.deliver(scsiCommandPdu({ itt: 13, cmdSN: 1, cdb: write10(0, 1) }))
      const [, r2t] = await harness.untilSent(2)
      const ttt = r2t.readU32(20)

      // BufferOffset past the end of the command's data: a copy there would land
      // nothing, so the write must be refused rather than acknowledged
      harness.socket.deliver(
        dataOutPdu({
          itt: 13,
          targetTransferTag: ttt,
          bufferOffset: BLOCK_SIZE,
          data: Buffer.alloc(BLOCK_SIZE, 0xcc),
        })
      )

      const [, , rejected] = await harness.untilSent(3)
      assert.equal(rejected.opcode, TargetOpcode.REJECT)
      assert.equal(rejected.readU8(2), RejectReason.PROTOCOL_ERROR)
      assert.deepEqual(harness.lun.content, Buffer.alloc(LUN_SIZE))

      // the command is gone, not merely stalled: a now-valid Data-Out for it is
      // an unknown ITT, and no SCSI Response ever completes it
      harness.socket.deliver(
        dataOutPdu({ itt: 13, targetTransferTag: ttt, bufferOffset: 0, data: Buffer.alloc(BLOCK_SIZE, 0xdd) })
      )
      const sent = await harness.untilSent(4)
      assert.equal(sent[3].opcode, TargetOpcode.REJECT)
      assert.deepEqual(harness.lun.content, Buffer.alloc(LUN_SIZE))
      assert.equal(
        sent.some(pdu => pdu.opcode === TargetOpcode.SCSI_RESPONSE),
        false
      )
    })
  })

  it("rejects a Data-Out carrying another command's Target Transfer Tag", async () => {
    await withSession(async harness => {
      harness.socket.deliver(scsiCommandPdu({ itt: 15, cmdSN: 1, cdb: write10(0, 1) }))
      const [, r2t] = await harness.untilSent(2)

      harness.socket.deliver(
        dataOutPdu({
          itt: 15,
          targetTransferTag: r2t.readU32(20) + 1,
          bufferOffset: 0,
          data: Buffer.alloc(BLOCK_SIZE, 0xee),
        })
      )

      const [, , rejected] = await harness.untilSent(3)
      assert.equal(rejected.opcode, TargetOpcode.REJECT)
      assert.deepEqual(harness.lun.content, Buffer.alloc(LUN_SIZE))
    })
  })

  it('rejects a Data-Out for a command it knows nothing about', async () => {
    await withSession(async harness => {
      harness.socket.deliver(
        dataOutPdu({ itt: 404, targetTransferTag: 1, bufferOffset: 0, data: Buffer.alloc(BLOCK_SIZE, 0xff) })
      )

      const [, rejected] = await harness.untilSent(2)
      assert.equal(rejected.opcode, TargetOpcode.REJECT)
      assert.equal(rejected.readU8(2), RejectReason.PROTOCOL_ERROR)
    })
  })

  it('reports a failed backend write as CHECK CONDITION, not a dropped connection', async () => {
    await withSession(async harness => {
      harness.lun.failNextWrite = true
      harness.socket.deliver(scsiCommandPdu({ itt: 17, cmdSN: 1, cdb: write10(0, 1) }))
      const [, r2t] = await harness.untilSent(2)

      harness.socket.deliver(
        dataOutPdu({
          itt: 17,
          targetTransferTag: r2t.readU32(20),
          bufferOffset: 0,
          data: Buffer.alloc(BLOCK_SIZE, 0xab),
        })
      )

      const [, , response] = await harness.untilSent(3)
      assert.equal(response.opcode, TargetOpcode.SCSI_RESPONSE)
      assert.equal(response.readU8(3), ScsiStatus.CHECK_CONDITION)
      assert.equal(senseKey(response), SenseKey.MEDIUM_ERROR)
    })
  })

  it('fails a command carrying immediate data instead of silently dropping it', async () => {
    await withSession(async harness => {
      // ImmediateData=No is declared at login, so this cannot be honoured — and
      // must not be ignored either, since the write would be short by these bytes
      harness.socket.deliver(
        scsiCommandPdu({ itt: 19, cmdSN: 1, cdb: write10(0, 1), data: Buffer.alloc(BLOCK_SIZE, 0x99) })
      )

      const [, response] = await harness.untilSent(2)
      assert.equal(response.opcode, TargetOpcode.SCSI_RESPONSE)
      assert.equal(response.readU8(3), ScsiStatus.CHECK_CONDITION)
      assert.equal(senseKey(response), SenseKey.ILLEGAL_REQUEST)
      assert.deepEqual(harness.lun.content, Buffer.alloc(LUN_SIZE))
      // no R2T either: the command never started
      assert.equal(
        harness.sent.some(pdu => pdu.opcode === TargetOpcode.R2T),
        false
      )
    })
  })
})

describe('Data-In chunking', () => {
  /** Read `blocks` blocks of a LUN pre-filled with a recognizable pattern. */
  const readBack = async (harness: Harness, blocks: number): Promise<Array<IncomingPdu>> => {
    for (let i = 0; i < harness.lun.content.length; i++) {
      harness.lun.content[i] = (i * 7 + 3) & 0xff
    }
    harness.socket.deliver(scsiCommandPdu({ itt: 21, cmdSN: 1, cdb: read10(0, blocks) }))
    const expected = Math.ceil((blocks * BLOCK_SIZE) / MAX_RECV_DATA_SEGMENT_LENGTH)
    const sent = await harness.untilSent(1 + expected)
    return sent.slice(1)
  }

  it('splits the payload at the initiator MaxRecvDataSegmentLength', async () => {
    await withSession(async harness => {
      const dataIn = await readBack(harness, 4)

      assert.equal(dataIn.length, 4)
      for (const pdu of dataIn) {
        assert.equal(pdu.opcode, TargetOpcode.SCSI_DATA_IN)
        assert.equal(pdu.data.length, MAX_RECV_DATA_SEGMENT_LENGTH)
      }
      // reassembled, it is exactly what the LUN holds
      assert.deepEqual(Buffer.concat(dataIn.map(pdu => pdu.data)), harness.lun.content.subarray(0, 4 * BLOCK_SIZE))
    })
  })

  it('numbers the PDUs with a gapless DataSN and stamps each BufferOffset', async () => {
    await withSession(async harness => {
      const dataIn = await readBack(harness, 3)

      assert.deepEqual(
        dataIn.map(pdu => pdu.readU32(36)),
        [0, 1, 2]
      )
      assert.deepEqual(
        dataIn.map(pdu => pdu.readU32(40)),
        [0, MAX_RECV_DATA_SEGMENT_LENGTH, 2 * MAX_RECV_DATA_SEGMENT_LENGTH]
      )
      // Target Transfer Tag is unused on Data-In
      for (const pdu of dataIn) {
        assert.equal(pdu.readU32(20), RESERVED_TAG)
      }
    })
  })

  it('carries the status only on the final PDU, and advances StatSN once', async () => {
    await withSession(async harness => {
      const statSNAfterLogin = parseSent(harness.socket.sent[0]).readU32(24) + 1
      const dataIn = await readBack(harness, 3)

      for (const pdu of dataIn.slice(0, -1)) {
        assert.equal(pdu.flags & DATA_IN_FLAG_FINAL, 0)
        assert.equal(pdu.flags & DATA_IN_FLAG_STATUS, 0)
        // both fields are defined as meaningless without the S bit, and are left
        // unset rather than filled with a value an initiator might act on
        assert.equal(pdu.readU8(3), 0)
        assert.equal(pdu.readU32(24), 0)
      }

      const last = dataIn[dataIn.length - 1]
      assert.equal(last.flags & DATA_IN_FLAG_FINAL, DATA_IN_FLAG_FINAL)
      assert.equal(last.flags & DATA_IN_FLAG_STATUS, DATA_IN_FLAG_STATUS)
      assert.equal(last.readU8(3), ScsiStatus.GOOD)
      // exactly one StatSN consumed for the whole command, on its final PDU
      assert.equal(last.readU32(24), statSNAfterLogin)
    })
  })

  it('sends a single Data-In when the payload fits one segment', async () => {
    await withSession(async harness => {
      const dataIn = await readBack(harness, 1)

      assert.equal(dataIn.length, 1)
      assert.equal(
        dataIn[0].flags & (DATA_IN_FLAG_FINAL | DATA_IN_FLAG_STATUS),
        DATA_IN_FLAG_FINAL | DATA_IN_FLAG_STATUS
      )
      assert.equal(dataIn[0].readU32(36), 0)
    })
  })

  it('flags residual overflow when the allocation length truncates the payload', async () => {
    await withSession(async harness => {
      // standard INQUIRY data is 36 bytes; ask for 8
      harness.socket.deliver(scsiCommandPdu({ itt: 23, cmdSN: 1, cdb: inquiry(8) }))

      const [, dataIn] = await harness.untilSent(2)
      assert.equal(dataIn.opcode, TargetOpcode.SCSI_DATA_IN)
      assert.equal(dataIn.data.length, 8)
      assert.equal(dataIn.flags & DATA_IN_FLAG_OVERFLOW, DATA_IN_FLAG_OVERFLOW)
      assert.equal(dataIn.flags & DATA_IN_FLAG_UNDERFLOW, 0)
      assert.equal(dataIn.readU32(44), 36 - 8) // Residual Count
    })
  })

  it('flags residual underflow when the payload is shorter than requested', async () => {
    await withSession(async harness => {
      harness.socket.deliver(scsiCommandPdu({ itt: 25, cmdSN: 1, cdb: inquiry(100) }))

      const [, dataIn] = await harness.untilSent(2)
      assert.equal(dataIn.data.length, 36)
      assert.equal(dataIn.flags & DATA_IN_FLAG_UNDERFLOW, DATA_IN_FLAG_UNDERFLOW)
      assert.equal(dataIn.flags & DATA_IN_FLAG_OVERFLOW, 0)
      assert.equal(dataIn.readU32(44), 100 - 36)
    })
  })

  it('answers with status alone, no Data-In, when nothing is allocated for the data', async () => {
    await withSession(async harness => {
      harness.socket.deliver(scsiCommandPdu({ itt: 27, cmdSN: 1, cdb: inquiry(0) }))

      const [, response] = await harness.untilSent(2)
      assert.equal(response.opcode, TargetOpcode.SCSI_RESPONSE)
      assert.equal(response.readU8(3), ScsiStatus.GOOD)
      assert.equal(
        harness.sent.some(pdu => pdu.opcode === TargetOpcode.SCSI_DATA_IN),
        false
      )
    })
  })
})

describe('unservable CDBs', () => {
  // An LBA above 2^53 cannot be held exactly by a JS number. Decoding it must
  // not throw: the error would unwind out of the dispatch loop and destroy the
  // socket, turning one bogus CDB — a buggy or hostile initiator's — into the
  // loss of the whole session and every command in flight on it.
  for (const [name, cdb] of [
    ['READ(16)', read16(0xffffffffffffffffn, 1)],
    ['WRITE(16)', write16(0xffffffffffffffffn, 1)],
  ] as const) {
    it(`answers a ${name} past the addressable range with CHECK CONDITION, keeping the session`, async () => {
      await withSession(async harness => {
        harness.socket.deliver(scsiCommandPdu({ itt: 31, cmdSN: 1, cdb }))

        const [, response] = await harness.untilSent(2)
        assert.equal(response.opcode, TargetOpcode.SCSI_RESPONSE)
        assert.equal(response.readU8(3), ScsiStatus.CHECK_CONDITION)
        assert.equal(senseKey(response), SenseKey.ILLEGAL_REQUEST)
        assert.equal(
          harness.sent.some(pdu => pdu.opcode === TargetOpcode.R2T),
          false
        )

        // the connection is still serving: a following command is answered
        harness.socket.deliver(scsiCommandPdu({ itt: 32, cmdSN: 2, cdb: inquiry(36) }))
        const [, , dataIn] = await harness.untilSent(3)
        assert.equal(dataIn.opcode, TargetOpcode.SCSI_DATA_IN)
      })
    })
  }
})
