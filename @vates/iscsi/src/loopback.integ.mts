import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, truncate, writeFile } from 'node:fs/promises'
import { connect, type Socket } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import { after, before, describe, it } from 'node:test'

import {
  DATA_IN_FLAG_STATUS,
  FLAG_FINAL,
  InitiatorOpcode,
  LOGIN_FLAG_TRANSIT,
  LOGIN_NSG_MASK,
  LoginStage,
  OPCODE_IMMEDIATE,
  ScsiStatus,
  TargetOpcode,
} from './constants.mjs'
import { RandomAccessDisk, type DiskBlock } from '@xen-orchestra/disk-transform'
import type { BlockDevice } from './backend.mjs'
import {
  CachedDiskBlockDevice,
  DiskBlockDevice,
  FileBlockDevice,
  IscsiDisk,
  IscsiInitiator,
  IscsiTarget,
} from './index.mjs'
import { allocBhs, assemblePdu, type IncomingPdu, readPdu } from './pdu.mjs'
import { parseTextKeys, serializeTextKeys } from './login.mjs'

const IQN = 'iqn.2024-01.tech.vates:loopback'
const LUN_SIZE = 1024 * 1024 // 1 MiB
const BLOCK_SIZE = 512

// --- a minimal in-process iSCSI initiator (test-only) -----------------------
//
// Speaks just enough of the protocol to exercise the target end to end. It
// reuses the package's framing helpers (independently covered by pdu.test); the
// assertions here are on the target's session/SCSI behavior and data integrity.

const READ_BIT = 0x40
const WRITE_BIT = 0x20

function send(socket: Socket, buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.write(buffer, error => (error ? reject(error) : resolve()))
  })
}

async function expectPdu(socket: Socket, opcode: number): Promise<IncomingPdu> {
  const pdu = await readPdu(socket)
  assert.ok(pdu !== null, 'expected a PDU, got end-of-stream')
  assert.equal(pdu.opcode, opcode, `expected opcode 0x${opcode.toString(16)}, got 0x${pdu.opcode.toString(16)}`)
  return pdu
}

class MiniInitiator {
  #socket: Socket
  #itt = 0
  #cmdSN = 0

  constructor(socket: Socket) {
    this.#socket = socket
  }

  #nextItt(): number {
    return ++this.#itt
  }

  async login(sessionType: 'Normal' | 'Discovery'): Promise<void> {
    const bhs = allocBhs(InitiatorOpcode.LOGIN_REQUEST | OPCODE_IMMEDIATE)
    bhs[1] = LOGIN_FLAG_TRANSIT | (LoginStage.OPERATIONAL_NEGOTIATION << 2) | LoginStage.FULL_FEATURE_PHASE
    Buffer.from([0x80, 0, 0, 0, 0, 1]).copy(bhs, 8) // ISID
    bhs.writeUInt32BE(this.#nextItt(), 16)
    bhs.writeUInt32BE(this.#cmdSN, 24)
    const keys: Array<[string, string]> = [
      ['InitiatorName', 'iqn.1994-05.com.example:test'],
      ['SessionType', sessionType],
      ['HeaderDigest', 'None'],
      ['DataDigest', 'None'],
      ['MaxRecvDataSegmentLength', '262144'],
    ]
    if (sessionType === 'Normal') {
      keys.push(['TargetName', IQN])
    }
    await send(this.#socket, assemblePdu(bhs, serializeTextKeys(keys)))

    const response = await expectPdu(this.#socket, TargetOpcode.LOGIN_RESPONSE)
    assert.equal(response.bhs[36], 0, 'login status-class should be success')
    assert.ok((response.bhs[1] & LOGIN_FLAG_TRANSIT) !== 0, 'should transit')
    assert.equal(response.bhs[1] & LOGIN_NSG_MASK, LoginStage.FULL_FEATURE_PHASE)
  }

  async sendTargets(): Promise<Map<string, string>> {
    const bhs = allocBhs(InitiatorOpcode.TEXT_REQUEST | OPCODE_IMMEDIATE)
    bhs[1] = FLAG_FINAL
    bhs.writeUInt32BE(this.#nextItt(), 16)
    bhs.writeUInt32BE(0xffffffff, 20) // Target Transfer Tag: none
    bhs.writeUInt32BE(this.#cmdSN, 24)
    await send(this.#socket, assemblePdu(bhs, serializeTextKeys([['SendTargets', 'All']])))
    const response = await expectPdu(this.#socket, TargetOpcode.TEXT_RESPONSE)
    return parseTextKeys(response.data)
  }

  #scsiCommandBhs(cdb: Buffer, flags: number, edtl: number): Buffer {
    const bhs = allocBhs(InitiatorOpcode.SCSI_COMMAND)
    bhs[1] = FLAG_FINAL | flags
    bhs.writeUInt32BE(this.#nextItt(), 16)
    bhs.writeUInt32BE(edtl, 20)
    bhs.writeUInt32BE(this.#cmdSN++, 24)
    cdb.copy(bhs, 32)
    return bhs
  }

  /** Issue a read-type command and collect Data-In; returns the assembled data + status. */
  async read(cdb: Buffer, edtl: number): Promise<{ data: Buffer; status: number }> {
    await send(this.#socket, assemblePdu(this.#scsiCommandBhs(cdb, READ_BIT, edtl)))
    const chunks: Buffer[] = []
    for (;;) {
      const pdu = await readPdu(this.#socket)
      assert.ok(pdu !== null)
      if (pdu.opcode === TargetOpcode.SCSI_DATA_IN) {
        chunks.push(pdu.data)
        if ((pdu.flags & DATA_IN_FLAG_STATUS) !== 0) {
          return { data: Buffer.concat(chunks), status: pdu.bhs[3] }
        }
      } else if (pdu.opcode === TargetOpcode.SCSI_RESPONSE) {
        return { data: Buffer.concat(chunks), status: pdu.bhs[3] }
      } else {
        assert.fail(`unexpected opcode during read: 0x${pdu.opcode.toString(16)}`)
      }
    }
  }

  /** Issue a write-type command, satisfy its R2Ts with Data-Out, return the final status. */
  async write(cdb: Buffer, payload: Buffer): Promise<number> {
    const itt = this.#itt + 1 // matches the ITT #scsiCommandBhs is about to allocate
    await send(this.#socket, assemblePdu(this.#scsiCommandBhs(cdb, WRITE_BIT, payload.length)))
    for (;;) {
      const pdu = await readPdu(this.#socket)
      assert.ok(pdu !== null)
      if (pdu.opcode === TargetOpcode.R2T) {
        const ttt = pdu.readU32(20)
        const bufferOffset = pdu.readU32(40)
        const desiredLength = pdu.readU32(44)
        const dataOut = allocBhs(InitiatorOpcode.SCSI_DATA_OUT)
        dataOut[1] = FLAG_FINAL
        dataOut.writeUInt32BE(itt, 16)
        dataOut.writeUInt32BE(ttt, 20)
        dataOut.writeUInt32BE(bufferOffset, 40)
        await send(this.#socket, assemblePdu(dataOut, payload.subarray(bufferOffset, bufferOffset + desiredLength)))
      } else if (pdu.opcode === TargetOpcode.SCSI_RESPONSE) {
        return pdu.bhs[3]
      } else {
        assert.fail(`unexpected opcode during write: 0x${pdu.opcode.toString(16)}`)
      }
    }
  }

  // --- low-level primitives (for explicit, interleaved orchestration) -------

  /** Send a SCSI Command without consuming any reply; returns its ITT. */
  async scsiCommand(cdb: Buffer, kind: 'read' | 'write' | 'none', edtl: number): Promise<number> {
    const flags = kind === 'read' ? READ_BIT : kind === 'write' ? WRITE_BIT : 0
    await send(this.#socket, assemblePdu(this.#scsiCommandBhs(cdb, flags, edtl)))
    return this.#itt
  }

  /** Read the next inbound PDU. */
  async recv(): Promise<IncomingPdu> {
    const pdu = await readPdu(this.#socket)
    assert.ok(pdu !== null, 'expected a PDU, got end-of-stream')
    return pdu
  }

  /** Send a single (final) Data-Out PDU for `itt` carrying `payload` at offset 0. */
  async dataOut(itt: number, targetTransferTag: number, payload: Buffer): Promise<void> {
    const bhs = allocBhs(InitiatorOpcode.SCSI_DATA_OUT)
    bhs[1] = FLAG_FINAL
    bhs.writeUInt32BE(itt, 16)
    bhs.writeUInt32BE(targetTransferTag, 20)
    bhs.writeUInt32BE(0, 40) // buffer offset
    await send(this.#socket, assemblePdu(bhs, payload))
  }

  async logout(): Promise<void> {
    const bhs = allocBhs(InitiatorOpcode.LOGOUT_REQUEST | OPCODE_IMMEDIATE)
    bhs[1] = FLAG_FINAL // reason 0: close the session
    bhs.writeUInt32BE(this.#nextItt(), 16)
    bhs.writeUInt32BE(this.#cmdSN, 24)
    await send(this.#socket, assemblePdu(bhs))
    const response = await expectPdu(this.#socket, TargetOpcode.LOGOUT_RESPONSE)
    assert.equal(response.bhs[2], 0, 'logout should succeed')
  }
}

function readCapacity10Cdb(): Buffer {
  const cdb = Buffer.alloc(16)
  cdb[0] = 0x25
  return cdb
}
function inquiryCdb(allocationLength: number): Buffer {
  const cdb = Buffer.alloc(16)
  cdb[0] = 0x12
  cdb.writeUInt16BE(allocationLength, 3)
  return cdb
}
function reportLunsCdb(allocationLength: number): Buffer {
  const cdb = Buffer.alloc(16)
  cdb[0] = 0xa0
  cdb.writeUInt32BE(allocationLength, 6)
  return cdb
}
function rwCdb(opcode: number, lba: number, blocks: number): Buffer {
  const cdb = Buffer.alloc(16)
  cdb[0] = opcode
  cdb.writeUInt32BE(lba, 2)
  cdb.writeUInt16BE(blocks, 7)
  return cdb
}

describe('iSCSI target loopback', () => {
  let dir: string
  let backingPath: string
  let target: IscsiTarget
  let port: number

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'vates-iscsi-'))
    backingPath = join(dir, 'lun.img')
    await writeFile(backingPath, Buffer.alloc(0))
    await truncate(backingPath, LUN_SIZE)

    target = new IscsiTarget({
      iqn: IQN,
      host: '127.0.0.1',
      port: 0, // ephemeral
      lun: new FileBlockDevice({ path: backingPath, blockSize: BLOCK_SIZE }),
    })
    await target.listen()
    const address = target.address()
    assert.ok(address !== undefined)
    port = address.port
  })

  after(async () => {
    await target?.close()
    await rm(dir, { recursive: true, force: true })
  })

  async function open(): Promise<Socket> {
    const socket = connect(port, '127.0.0.1')
    await once(socket, 'connect')
    return socket
  }

  it('answers SendTargets discovery with the target IQN', async () => {
    const socket = await open()
    try {
      const initiator = new MiniInitiator(socket)
      await initiator.login('Discovery')
      const keys = await initiator.sendTargets()
      assert.equal(keys.get('TargetName'), IQN)
      assert.match(keys.get('TargetAddress') ?? '', /^127\.0\.0\.1:\d+,1$/)
      await initiator.logout()
    } finally {
      socket.destroy()
    }
  })

  it('reports identity, capacity, and a single LUN', async () => {
    const socket = await open()
    try {
      const initiator = new MiniInitiator(socket)
      await initiator.login('Normal')

      const inquiry = await initiator.read(inquiryCdb(36), 36)
      assert.equal(inquiry.status, ScsiStatus.GOOD)
      assert.equal(inquiry.data[0], 0x00, 'direct-access block device')

      const reportLuns = await initiator.read(reportLunsCdb(64), 64)
      assert.equal(reportLuns.status, ScsiStatus.GOOD)
      assert.equal(reportLuns.data.readUInt32BE(0), 8, 'one LUN reported')

      const capacity = await initiator.read(readCapacity10Cdb(), 8)
      assert.equal(capacity.status, ScsiStatus.GOOD)
      assert.equal(capacity.data.readUInt32BE(0), LUN_SIZE / BLOCK_SIZE - 1, 'max LBA')
      assert.equal(capacity.data.readUInt32BE(4), BLOCK_SIZE)

      await initiator.logout()
    } finally {
      socket.destroy()
    }
  })

  it('writes blocks (R2T/Data-Out) and reads them back identically', async () => {
    const socket = await open()
    try {
      const initiator = new MiniInitiator(socket)
      await initiator.login('Normal')

      // A recognizable multi-block pattern starting at LBA 3.
      const blocks = 4
      const payload = Buffer.alloc(blocks * BLOCK_SIZE)
      for (let i = 0; i < payload.length; i++) {
        payload[i] = (i * 7 + 1) & 0xff
      }
      const lba = 3

      const writeStatus = await initiator.write(rwCdb(0x2a, lba, blocks), payload)
      assert.equal(writeStatus, ScsiStatus.GOOD)

      const readBack = await initiator.read(rwCdb(0x28, lba, blocks), payload.length)
      assert.equal(readBack.status, ScsiStatus.GOOD)
      assert.deepEqual(readBack.data, payload, 'read data matches what was written')

      await initiator.logout()
    } finally {
      socket.destroy()
    }

    // The bytes must have actually landed in the backing file at the right offset.
    const onDisk = await readFile(backingPath)
    const expected = Buffer.alloc(BLOCK_SIZE)
    for (let i = 0; i < BLOCK_SIZE; i++) {
      expected[i] = (i * 7 + 1) & 0xff // first written block
    }
    assert.deepEqual(onDisk.subarray(3 * BLOCK_SIZE, 4 * BLOCK_SIZE), expected)
  })

  // Regression test: real initiators (open-iscsi) send other commands while a
  // WRITE is awaiting its Data-Out. The target must service them and still
  // complete the write — not tear the connection down.
  it('services an interleaved command between R2T and Data-Out', async () => {
    const socket = await open()
    try {
      const initiator = new MiniInitiator(socket)
      await initiator.login('Normal')

      const payload = Buffer.alloc(BLOCK_SIZE, 0x3c)

      // 1. Issue a WRITE and receive its R2T, but do not send Data-Out yet.
      const writeItt = await initiator.scsiCommand(rwCdb(0x2a, 5, 1), 'write', BLOCK_SIZE)
      const r2t = await initiator.recv()
      assert.equal(r2t.opcode, TargetOpcode.R2T)
      assert.equal(r2t.itt, writeItt)
      const ttt = r2t.readU32(20)

      // 2. Interleave a READ CAPACITY before satisfying the write.
      const capItt = await initiator.scsiCommand(readCapacity10Cdb(), 'read', 8)
      const capacity = await initiator.recv()
      assert.equal(capacity.opcode, TargetOpcode.SCSI_DATA_IN)
      assert.equal(capacity.itt, capItt)
      assert.equal(capacity.data.readUInt32BE(0), LUN_SIZE / BLOCK_SIZE - 1)

      // 3. Now send the write's Data-Out; the write must complete with GOOD.
      await initiator.dataOut(writeItt, ttt, payload)
      const response = await initiator.recv()
      assert.equal(response.opcode, TargetOpcode.SCSI_RESPONSE)
      assert.equal(response.itt, writeItt)
      assert.equal(response.bhs[3], ScsiStatus.GOOD)

      // 4. The interleaved write must have persisted correctly.
      const readBack = await initiator.read(rwCdb(0x28, 5, 1), BLOCK_SIZE)
      assert.deepEqual(readBack.data, payload)

      await initiator.logout()
    } finally {
      socket.destroy()
    }
  })

  // The real IscsiInitiator drives the same target, exercising the client login
  // driver and the READ backlog/read-loop against the actual server.
  it('reads the LUN through the IscsiInitiator client', async () => {
    const initiator = new IscsiInitiator({ host: '127.0.0.1', port, targetIqn: IQN })
    await initiator.connect()
    try {
      assert.equal(initiator.getSize(), LUN_SIZE)
      assert.equal(initiator.getBlockSize(), BLOCK_SIZE)
      // Block 3 was written by the earlier test; read it back over READ(16).
      const data = await initiator.read(3 * BLOCK_SIZE, BLOCK_SIZE)
      const expected = Buffer.alloc(BLOCK_SIZE)
      for (let i = 0; i < BLOCK_SIZE; i++) {
        expected[i] = (i * 7 + 1) & 0xff
      }
      assert.deepEqual(data, expected)
    } finally {
      await initiator.close()
    }
  })
})

// Regression coverage for concurrent READ dispatch: a slow read must not block
// a subsequently-dispatched fast one, and StatSN on the wire must still come
// out strictly increasing in actual completion/transmission order — not
// necessarily dispatch order.
describe('concurrent READ dispatch', () => {
  it('services a fast read before an earlier, slower one — StatSN follows completion order', async () => {
    let releaseSlow: () => void
    const slowGate = new Promise<void>(resolve => {
      releaseSlow = resolve
    })
    const lun: BlockDevice = {
      getSize: () => LUN_SIZE,
      getBlockSize: () => BLOCK_SIZE,
      read: async (offset, length) => {
        if (offset === 0) {
          await slowGate // LBA 0 is the slow one
        }
        return Buffer.alloc(length, offset === 0 ? 0xaa : 0xbb)
      },
      write: async () => {
        throw new Error('not used by this test')
      },
      flush: async () => {},
      close: async () => {},
    }

    const target = new IscsiTarget({ iqn: IQN, host: '127.0.0.1', port: 0, lun })
    await target.listen()
    const address = target.address()
    assert.ok(address !== undefined)

    const socket = connect(address.port, '127.0.0.1')
    await once(socket, 'connect')
    // Both IscsiTarget and IscsiInitiator disable Nagle internally; this raw
    // test socket doesn't get that for free, and these tests send several
    // commands back to back with no read in between — exactly the pattern
    // Nagle + delayed ACK stalls (~40ms observed without this).
    socket.setNoDelay(true)
    try {
      const initiator = new MiniInitiator(socket)
      await initiator.login('Normal')

      // Dispatch the slow read (LBA 0) first, then the fast one (LBA 1),
      // without waiting for either's response — exactly what a real
      // initiator with a command window > 1 already does.
      const slowItt = await initiator.scsiCommand(rwCdb(0x28, 0, 1), 'read', BLOCK_SIZE)
      const fastItt = await initiator.scsiCommand(rwCdb(0x28, 1, 1), 'read', BLOCK_SIZE)

      // The fast one must complete first: proof the read loop didn't block
      // on the slow one before even starting the fast one's I/O.
      const fastPdu = await initiator.recv()
      assert.equal(fastPdu.itt, fastItt)
      assert.deepEqual(fastPdu.data, Buffer.alloc(BLOCK_SIZE, 0xbb))
      const fastStatSN = fastPdu.readU32(24)

      releaseSlow!()

      const slowPdu = await initiator.recv()
      assert.equal(slowPdu.itt, slowItt)
      assert.deepEqual(slowPdu.data, Buffer.alloc(BLOCK_SIZE, 0xaa))
      const slowStatSN = slowPdu.readU32(24)

      // StatSN reflects actual transmission order (fast, then slow) even
      // though the slow one's command was dispatched first.
      assert.ok(slowStatSN > fastStatSN, `expected slow StatSN (${slowStatSN}) > fast StatSN (${fastStatSN})`)

      await initiator.logout()
    } finally {
      socket.destroy()
      await target.close()
    }
  })

  it('caps how many reads run at once, independently of the command window', async () => {
    const started: number[] = []
    const releases: Array<() => void> = []
    const lun: BlockDevice = {
      getSize: () => LUN_SIZE,
      getBlockSize: () => BLOCK_SIZE,
      read: async (offset, length) => {
        started.push(offset / BLOCK_SIZE)
        await new Promise<void>(resolve => releases.push(resolve))
        return Buffer.alloc(length)
      },
      write: async () => {
        throw new Error('not used by this test')
      },
      flush: async () => {},
      close: async () => {},
    }

    const target = new IscsiTarget({ iqn: IQN, host: '127.0.0.1', port: 0, lun, readConcurrency: 2 })
    await target.listen()
    const address = target.address()
    assert.ok(address !== undefined)

    const socket = connect(address.port, '127.0.0.1')
    await once(socket, 'connect')
    // Both IscsiTarget and IscsiInitiator disable Nagle internally; this raw
    // test socket doesn't get that for free, and these tests send several
    // commands back to back with no read in between — exactly the pattern
    // Nagle + delayed ACK stalls (~40ms observed without this).
    socket.setNoDelay(true)
    try {
      const initiator = new MiniInitiator(socket)
      await initiator.login('Normal')

      const itts = []
      for (let lba = 0; lba < 4; lba++) {
        itts.push(await initiator.scsiCommand(rwCdb(0x28, lba, 1), 'read', BLOCK_SIZE))
      }

      // Poll instead of a fixed number of ticks: the commands still have to
      // cross a real (loopback) socket before the LUN sees them.
      for (let attempt = 0; started.length < 2 && attempt < 100; attempt++) {
        await new Promise(resolve => setImmediate(resolve))
      }
      assert.equal(started.length, 2, 'only readConcurrency reads should have started')

      releases.shift()!()
      for (let attempt = 0; started.length < 3 && attempt < 100; attempt++) {
        await new Promise(resolve => setImmediate(resolve))
      }
      assert.equal(started.length, 3, 'releasing one slot should admit exactly one more')

      // drain the rest: releasing a slot only lets the NEXT queued read start
      // asynchronously (one microtask later), so keep releasing whatever's
      // pending and yielding until all four have started
      while (started.length < 4) {
        while (releases.length > 0) {
          releases.shift()!()
        }
        await new Promise(resolve => setImmediate(resolve))
      }
      while (releases.length > 0) {
        releases.shift()!()
      }

      for (let i = 0; i < itts.length; i++) {
        const pdu = await initiator.recv()
        assert.ok(itts.includes(pdu.itt))
      }

      await initiator.logout()
    } finally {
      socket.destroy()
      await target.close()
    }
  })
})

// Regression test: a failed lun.read() (backend hiccup, corrupt source block)
// must fail only that command, not the whole connection — mirrors the write
// path's existing per-command CHECK_CONDITION/MEDIUM_ERROR handling.
describe('READ error isolation', () => {
  it('fails only the bad read; the connection and subsequent reads stay healthy', async () => {
    const lun: BlockDevice = {
      getSize: () => LUN_SIZE,
      getBlockSize: () => BLOCK_SIZE,
      read: async offset => {
        if (offset === 0) {
          throw new Error('simulated backend failure')
        }
        return Buffer.alloc(BLOCK_SIZE, 0xcc)
      },
      write: async () => {
        throw new Error('not used by this test')
      },
      flush: async () => {},
      close: async () => {},
    }

    const target = new IscsiTarget({ iqn: IQN, host: '127.0.0.1', port: 0, lun })
    await target.listen()
    const address = target.address()
    assert.ok(address !== undefined)

    const socket = connect(address.port, '127.0.0.1')
    await once(socket, 'connect')
    try {
      const initiator = new MiniInitiator(socket)
      await initiator.login('Normal')

      // LBA 0 is the bad one: must fail with CHECK CONDITION, not drop the connection
      const failed = await initiator.read(rwCdb(0x28, 0, 1), BLOCK_SIZE)
      assert.equal(failed.status, ScsiStatus.CHECK_CONDITION)

      // the connection must still be usable: a healthy read afterward succeeds normally
      const healthy = await initiator.read(rwCdb(0x28, 1, 1), BLOCK_SIZE)
      assert.equal(healthy.status, ScsiStatus.GOOD)
      assert.deepEqual(healthy.data, Buffer.alloc(BLOCK_SIZE, 0xcc))

      await initiator.logout()
    } finally {
      socket.destroy()
      await target.close()
    }
  })
})

describe('connection replacement', () => {
  it('a new connection replaces an existing one instead of being refused forever', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vates-iscsi-'))
    const backingPath = join(dir, 'lun.img')
    await writeFile(backingPath, Buffer.alloc(0))
    await truncate(backingPath, LUN_SIZE)

    const target = new IscsiTarget({
      iqn: IQN,
      host: '127.0.0.1',
      port: 0,
      lun: new FileBlockDevice({ path: backingPath, blockSize: BLOCK_SIZE }),
    })
    await target.listen()
    const address = target.address()
    assert.ok(address !== undefined)

    try {
      // First connection: logs in, then goes idle — standing in for an
      // initiator that gave up on it (its own command timeout, against a slow
      // backend) without ever actually closing the socket.
      const socketA = connect(address.port, '127.0.0.1')
      await once(socketA, 'connect')
      const initiatorA = new MiniInitiator(socketA)
      await initiatorA.login('Normal')
      const closedA = once(socketA, 'close')

      // A second connection must be accepted, not refused, even though the
      // first is still technically open from the target's point of view.
      const socketB = connect(address.port, '127.0.0.1')
      await once(socketB, 'connect')
      const initiatorB = new MiniInitiator(socketB)
      await initiatorB.login('Normal')

      // The target must have torn the first connection's socket down.
      await closedA

      // The new connection is fully usable, not left in some half-adopted state.
      const result = await initiatorB.read(rwCdb(0x28, 0, 1), BLOCK_SIZE)
      assert.equal(result.status, ScsiStatus.GOOD)
      await initiatorB.logout()
      socketB.destroy()
    } finally {
      await target.close()
      await rm(dir, { recursive: true, force: true })
    }
  })
})

// One loopback that exercises BOTH one-way CHAP roles at once: our target is the
// authenticator (challenges + verifies) and our initiator is the responder
// (answers the challenge). This is the same code path each production role uses
// (target vs XCP-ng open-iscsi; initiator vs a Pure array).
describe('iSCSI CHAP loopback (target authenticator + initiator responder)', () => {
  const CHAP = { user: 'alice', secret: 's3cr3t' }
  const pattern = (i: number) => (i * 13 + 7) & 0xff

  let dir: string
  let backingPath: string
  let target: IscsiTarget
  let port: number

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'vates-iscsi-chap-'))
    backingPath = join(dir, 'lun.img')
    // Pre-fill the LUN with a recognizable pattern so a plain read can verify it.
    const image = Buffer.alloc(LUN_SIZE)
    for (let i = 0; i < image.length; i++) {
      image[i] = pattern(i)
    }
    await writeFile(backingPath, image)

    target = new IscsiTarget({
      iqn: IQN,
      host: '127.0.0.1',
      port: 0,
      lun: new FileBlockDevice({ path: backingPath, blockSize: BLOCK_SIZE }),
      chap: CHAP,
    })
    await target.listen()
    const address = target.address()
    assert.ok(address !== undefined)
    port = address.port
  })

  after(async () => {
    await target?.close()
    await rm(dir, { recursive: true, force: true })
  })

  it('authenticates a correct secret and reads the LUN', async () => {
    const initiator = new IscsiInitiator({ host: '127.0.0.1', port, targetIqn: IQN, chap: CHAP })
    await initiator.connect()
    try {
      assert.equal(initiator.getSize(), LUN_SIZE)
      const offset = 5 * BLOCK_SIZE
      const length = 3 * BLOCK_SIZE
      const data = await initiator.read(offset, length)
      const expected = Buffer.alloc(length)
      for (let i = 0; i < length; i++) {
        expected[i] = pattern(offset + i)
      }
      assert.deepEqual(data, expected)
    } finally {
      await initiator.close()
    }
  })

  it('exposes the authenticated LUN as a RandomAccessDisk', async () => {
    const blockSize = 64 * 1024
    const disk = new IscsiDisk({ host: '127.0.0.1', port, targetIqn: IQN, chap: CHAP }, { blockSize })
    await disk.init()
    try {
      assert.equal(disk.getVirtualSize(), LUN_SIZE)
      assert.equal(disk.getBlockIndexes().length, LUN_SIZE / blockSize)
      assert.equal(disk.hasBlock(0), true)
      const { index, data } = await disk.readBlock(2)
      assert.equal(index, 2)
      assert.equal(data.length, blockSize)
      const expected = Buffer.alloc(blockSize)
      for (let i = 0; i < blockSize; i++) {
        expected[i] = pattern(2 * blockSize + i)
      }
      assert.deepEqual(data, expected)
    } finally {
      await disk.close()
    }
  })

  it('rejects a wrong secret', async () => {
    const initiator = new IscsiInitiator({
      host: '127.0.0.1',
      port,
      targetIqn: IQN,
      chap: { user: 'alice', secret: 'wrong' },
    })
    await assert.rejects(initiator.connect(), /login rejected/)
  })

  it('rejects an initiator that offers no credentials', async () => {
    const initiator = new IscsiInitiator({ host: '127.0.0.1', port, targetIqn: IQN })
    await assert.rejects(initiator.connect(), /login rejected/)
  })
})

// --- serving a RandomAccessDisk as a LUN ------------------------------------
//
// The shape used to expose a backup's disk chain: a sparse source disk with big
// blocks, read through the protocol at 512-byte granularity.

describe('DiskBlockDevice loopback', () => {
  const DISK_BLOCK_SIZE = 64 * 1024
  const BLOCK_COUNT = 4
  const DISK_SIZE = BLOCK_COUNT * DISK_BLOCK_SIZE
  const bytePattern = (i: number) => (i * 31 + 11) & 0xff

  // only blocks 0 and 2 are allocated, like a differencing VHD chain
  const allocated = new Map<number, Buffer>()
  for (const index of [0, 2]) {
    const data = Buffer.alloc(DISK_BLOCK_SIZE)
    for (let i = 0; i < data.length; i++) {
      data[i] = bytePattern(index * DISK_BLOCK_SIZE + i)
    }
    allocated.set(index, data)
  }

  const expectedAt = (offset: number, length: number): Buffer => {
    const expected = Buffer.alloc(length)
    for (let i = 0; i < length; i++) {
      const absolute = offset + i
      if (allocated.has(Math.floor(absolute / DISK_BLOCK_SIZE))) {
        expected[i] = bytePattern(absolute)
      }
    }
    return expected
  }

  class SparseDisk extends RandomAccessDisk {
    getBlockSize(): number {
      return DISK_BLOCK_SIZE
    }
    getVirtualSize(): number {
      return DISK_SIZE
    }
    isDifferencing(): boolean {
      return false
    }
    getBlockIndexes(): Array<number> {
      return [...allocated.keys()]
    }
    hasBlock(index: number): boolean {
      return allocated.has(index)
    }
    async init(): Promise<void> {}
    async close(): Promise<void> {}
    async readBlock(index: number): Promise<DiskBlock> {
      const data = allocated.get(index)
      if (data === undefined) {
        // what RemoteVhdDiskChain does, and what the adapter must never trigger
        throw new Error(`Block ${index} not found in chain`)
      }
      return { index, data }
    }
  }

  let target: IscsiTarget
  let port: number

  before(async () => {
    target = new IscsiTarget({
      iqn: IQN,
      host: '127.0.0.1',
      port: 0,
      lun: new DiskBlockDevice({ disk: new SparseDisk(), blockSize: BLOCK_SIZE }),
    })
    await target.listen()
    const address = target.address()
    assert.ok(address !== undefined)
    port = address.port
  })

  after(async () => {
    await target?.close()
  })

  it('serves the disk content, unallocated blocks reading as zeroes', async () => {
    const initiator = new IscsiInitiator({ host: '127.0.0.1', port, targetIqn: IQN })
    await initiator.connect()
    try {
      assert.equal(initiator.getSize(), DISK_SIZE)

      // one sector inside an allocated block
      const offset = DISK_BLOCK_SIZE * 2 + 3 * BLOCK_SIZE
      assert.deepEqual(await initiator.read(offset, BLOCK_SIZE), expectedAt(offset, BLOCK_SIZE))

      // a whole unallocated block
      assert.deepEqual(await initiator.read(DISK_BLOCK_SIZE, DISK_BLOCK_SIZE), Buffer.alloc(DISK_BLOCK_SIZE))

      // a range straddling allocated and unallocated blocks
      const straddle = DISK_BLOCK_SIZE - BLOCK_SIZE
      const length = DISK_BLOCK_SIZE + 2 * BLOCK_SIZE
      assert.deepEqual(await initiator.read(straddle, length), expectedAt(straddle, length))

      // the whole disk, in one go
      assert.deepEqual(await initiator.read(0, DISK_SIZE), expectedAt(0, DISK_SIZE))
    } finally {
      await initiator.close()
    }
  })

  it('fails a write instead of corrupting the source', async () => {
    const socket = connect({ host: '127.0.0.1', port })
    await once(socket, 'connect')
    const initiator = new MiniInitiator(socket)
    try {
      await initiator.login('Normal')
      const status = await initiator.write(rwCdb(0x2a, 0, 1), Buffer.alloc(BLOCK_SIZE, 0xff))
      assert.equal(status, ScsiStatus.CHECK_CONDITION)
      // the source is untouched
      const readBack = await initiator.read(rwCdb(0x28, 0, 1), BLOCK_SIZE)
      assert.equal(readBack.status, ScsiStatus.GOOD)
      assert.deepEqual(readBack.data, expectedAt(0, BLOCK_SIZE))
    } finally {
      socket.destroy()
    }
  })

  // --- the same source, but cached into a local store ----------------------
  //
  // The shape used for a backup mount with a cache VDI: reads materialize into
  // the local store, and writes are accepted there.

  describe('cached into a local store', () => {
    let cache: FileBlockDevice
    let cachedDir: string
    let cachedPath: string
    let cachedTarget: IscsiTarget
    let cachedPort: number

    before(async () => {
      cachedDir = await mkdtemp(join(tmpdir(), 'vates-iscsi-cache-'))
      cachedPath = join(cachedDir, 'cache.img')
      await writeFile(cachedPath, '')
      await truncate(cachedPath, DISK_SIZE)
      cache = new FileBlockDevice({ path: cachedPath, blockSize: BLOCK_SIZE })
      // the cache is opened by its owner, not by the LUN
      await cache.open()

      cachedTarget = new IscsiTarget({
        iqn: IQN,
        host: '127.0.0.1',
        port: 0,
        lun: new CachedDiskBlockDevice({ disk: new SparseDisk(), cache, blockSize: BLOCK_SIZE }),
      })
      await cachedTarget.listen()
      const address = cachedTarget.address()
      assert.ok(address !== undefined)
      cachedPort = address.port
    })

    after(async () => {
      await cachedTarget?.close()
      await rm(cachedDir, { recursive: true, force: true })
    })

    it('serves the source and materializes it into the local store', async () => {
      const initiator = new IscsiInitiator({ host: '127.0.0.1', port: cachedPort, targetIqn: IQN })
      await initiator.connect()
      try {
        assert.deepEqual(await initiator.read(0, BLOCK_SIZE), expectedAt(0, BLOCK_SIZE))
        // the whole source block landed in the store, not just the sector read
        const onDisk = await readFile(cachedPath)
        assert.deepEqual(onDisk.subarray(0, DISK_BLOCK_SIZE), expectedAt(0, DISK_BLOCK_SIZE))
      } finally {
        await initiator.close()
      }
    })

    it('accepts a write and reads it back', async () => {
      const socket = connect({ host: '127.0.0.1', port: cachedPort })
      await once(socket, 'connect')
      const initiator = new MiniInitiator(socket)
      try {
        await initiator.login('Normal')
        const payload = Buffer.alloc(BLOCK_SIZE, 0xee)
        // block 1 is a hole in the source: nothing to fetch, the write stands alone
        const lba = DISK_BLOCK_SIZE / BLOCK_SIZE
        assert.equal(await initiator.write(rwCdb(0x2a, lba, 1), payload), ScsiStatus.GOOD)

        const readBack = await initiator.read(rwCdb(0x28, lba, 1), BLOCK_SIZE)
        assert.equal(readBack.status, ScsiStatus.GOOD)
        assert.deepEqual(readBack.data, payload)
      } finally {
        socket.destroy()
      }
    })
  })
})
