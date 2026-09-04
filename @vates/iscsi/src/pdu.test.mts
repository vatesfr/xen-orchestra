import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { describe, it } from 'node:test'

import { InitiatorOpcode } from './constants.mjs'
import { allocBhs, assemblePdu, IncomingPdu, readPdu, roundUp4 } from './pdu.mjs'

function buildScsiCommandPdu(itt: number, cmdSN: number, cdb: Buffer, data?: Buffer): Buffer {
  const bhs = allocBhs(InitiatorOpcode.SCSI_COMMAND)
  bhs[1] = 0x80 // Final
  bhs.writeUInt32BE(itt, 16)
  bhs.writeUInt32BE(0, 20) // EDTL
  bhs.writeUInt32BE(cmdSN, 24)
  cdb.copy(bhs, 32)
  return assemblePdu(bhs, data)
}

async function readOne(buffer: Buffer): Promise<IncomingPdu> {
  const stream = new PassThrough()
  stream.end(buffer)
  const pdu = await readPdu(stream)
  assert.ok(pdu !== null)
  return pdu
}

describe('roundUp4', () => {
  it('rounds up to the next multiple of 4', () => {
    assert.equal(roundUp4(0), 0)
    assert.equal(roundUp4(1), 4)
    assert.equal(roundUp4(4), 4)
    assert.equal(roundUp4(5), 8)
    assert.equal(roundUp4(15), 16)
  })
})

describe('assemblePdu / readPdu round-trip', () => {
  it('preserves opcode and header fields', async () => {
    const cdb = Buffer.alloc(16)
    cdb[0] = 0x28 // READ(10)
    const pdu = await readOne(buildScsiCommandPdu(0xdeadbeef, 42, cdb))
    assert.equal(pdu.opcode, InitiatorOpcode.SCSI_COMMAND)
    assert.equal(pdu.immediate, false)
    assert.equal(pdu.finalBit, true)
    assert.equal(pdu.itt, 0xdeadbeef)
    assert.equal(pdu.cmdSN, 42)
    assert.equal(pdu.bhs.subarray(32, 48)[0], 0x28)
  })

  it('carries a data segment and strips its 4-byte padding', async () => {
    const data = Buffer.from([1, 2, 3, 4, 5]) // 5 bytes -> padded to 8 on the wire
    const wire = buildScsiCommandPdu(1, 1, Buffer.alloc(16), data)
    assert.equal(wire.length, 48 + 8, 'data segment is padded to a 4-byte boundary')
    const pdu = await readOne(wire)
    assert.deepEqual(pdu.data, data, 'padding is stripped from the parsed data')
  })
})

describe('readPdu framing', () => {
  it('reassembles a PDU split across multiple TCP chunks', async () => {
    const data = Buffer.from('hello world!!') // 13 bytes -> padded to 16
    const wire = buildScsiCommandPdu(7, 7, Buffer.alloc(16), data)
    const stream = new PassThrough()
    const pduPromise = readPdu(stream)
    // Feed the bytes in awkward fragments.
    stream.write(wire.subarray(0, 10))
    stream.write(wire.subarray(10, 48))
    stream.write(wire.subarray(48, 55))
    stream.end(wire.subarray(55))
    const pdu = await pduPromise
    assert.ok(pdu !== null)
    assert.equal(pdu.itt, 7)
    assert.deepEqual(pdu.data, data)
  })

  it('reads two PDUs coalesced into one chunk', async () => {
    const first = buildScsiCommandPdu(1, 1, Buffer.alloc(16), Buffer.from([0xaa]))
    const second = buildScsiCommandPdu(2, 2, Buffer.alloc(16), Buffer.from([0xbb, 0xcc]))
    const stream = new PassThrough()
    stream.end(Buffer.concat([first, second]))

    const a = await readPdu(stream)
    const b = await readPdu(stream)
    assert.equal(a?.itt, 1)
    assert.deepEqual(a?.data, Buffer.from([0xaa]))
    assert.equal(b?.itt, 2)
    assert.deepEqual(b?.data, Buffer.from([0xbb, 0xcc]))
  })

  it('returns null on a clean end-of-stream', async () => {
    const stream = new PassThrough()
    stream.end()
    assert.equal(await readPdu(stream), null)
  })

  it('throws on a truncated BHS', async () => {
    const stream = new PassThrough()
    stream.end(Buffer.alloc(20)) // fewer than 48 bytes, then EOF
    await assert.rejects(readPdu(stream), /truncated/)
  })
})
