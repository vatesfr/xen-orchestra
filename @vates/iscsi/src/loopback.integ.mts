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
import { FileBlockDevice, IscsiTarget } from './index.mjs'
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
})
