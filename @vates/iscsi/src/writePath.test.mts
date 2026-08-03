import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { FLAG_FINAL, TargetOpcode } from './constants.mjs'
import { buildR2t, receiveDataOut, type PendingWrite } from './writePath.mjs'

const TTT = 7
const BLOCK = 512

/**
 * A pending WRITE with its first burst already solicited, as `beginWrite`
 * leaves it. `solicited` defaults to the whole command (one burst), which is
 * what a write below MaxBurstLength gets.
 */
const pending = ({
  totalLength = BLOCK,
  solicited = totalLength,
}: { totalLength?: number; solicited?: number } = {}): PendingWrite => ({
  itt: 1,
  targetTransferTag: TTT,
  lunOffset: 0,
  buffer: Buffer.alloc(totalLength),
  totalLength,
  contiguousReceived: 0,
  solicited,
  r2tSN: 1,
})

const dataOut = (bufferOffset: number, length: number, fill = 0xab) => ({
  targetTransferTag: TTT,
  bufferOffset,
  data: Buffer.alloc(length, fill),
})

describe('buildR2t', () => {
  it('solicits the requested range, always with the final bit set', () => {
    const r2t = buildR2t(
      { itt: 42, r2tSN: 3, targetTransferTag: TTT, bufferOffset: 1024, desiredLength: 512 },
      { statSN: 9, expCmdSN: 10, maxCmdSN: 74 }
    )

    assert.equal(r2t[0], TargetOpcode.R2T)
    assert.equal(r2t[1], FLAG_FINAL)
    assert.equal(r2t.readUInt32BE(16), 42)
    assert.equal(r2t.readUInt32BE(20), TTT)
    assert.equal(r2t.readUInt32BE(36), 3)
    assert.equal(r2t.readUInt32BE(40), 1024)
    assert.equal(r2t.readUInt32BE(44), 512)
  })
})

describe('receiveDataOut', () => {
  it('places a burst delivered in one PDU and reports it complete', () => {
    const write = pending()

    const outcome = receiveDataOut(write, dataOut(0, BLOCK))

    assert.deepEqual(outcome, { ok: true, complete: true, burstComplete: true })
    assert.equal(write.contiguousReceived, BLOCK)
    assert.deepEqual(write.buffer, Buffer.alloc(BLOCK, 0xab))
  })

  it('places consecutive PDUs of one burst, completing only on the last', () => {
    const write = pending({ totalLength: 3 * BLOCK })

    const first = receiveDataOut(write, dataOut(0, BLOCK, 0x11))
    const second = receiveDataOut(write, dataOut(BLOCK, BLOCK, 0x22))
    const third = receiveDataOut(write, dataOut(2 * BLOCK, BLOCK, 0x33))

    assert.deepEqual(first, { ok: true, complete: false, burstComplete: false })
    assert.deepEqual(second, { ok: true, complete: false, burstComplete: false })
    assert.deepEqual(third, { ok: true, complete: true, burstComplete: true })
    assert.deepEqual(
      write.buffer,
      Buffer.concat([Buffer.alloc(BLOCK, 0x11), Buffer.alloc(BLOCK, 0x22), Buffer.alloc(BLOCK, 0x33)])
    )
  })

  it('reports the burst complete, but not the command, when more remains to solicit', () => {
    const write = pending({ totalLength: 2 * BLOCK, solicited: BLOCK })

    const outcome = receiveDataOut(write, dataOut(0, BLOCK))

    assert.deepEqual(outcome, { ok: true, complete: false, burstComplete: true })
  })

  // The three ways a plain count of received bytes reached `totalLength` with
  // part of the staging buffer never written — each one an acknowledged write
  // that silently lost data, since `Buffer.copy` clamps instead of throwing.
  describe('refuses a PDU that would leave a hole in the buffer', () => {
    it('past the end of the buffer, where the copy would land nothing', () => {
      const write = pending()

      const outcome = receiveDataOut(write, dataOut(BLOCK, BLOCK))

      assert.equal(outcome.ok, false)
      assert.equal(write.contiguousReceived, 0)
      assert.deepEqual(write.buffer, Buffer.alloc(BLOCK))
    })

    it('straddling the end, where the copy would be silently short', () => {
      const write = pending()

      const outcome = receiveDataOut(write, dataOut(BLOCK / 2, BLOCK))

      assert.equal(outcome.ok, false)
      assert.equal(write.contiguousReceived, 0)
    })

    it('repeating a range already received, which would never fill the rest', () => {
      const write = pending()
      assert.equal(receiveDataOut(write, dataOut(0, BLOCK / 2, 0x11)).ok, true)

      const outcome = receiveDataOut(write, dataOut(0, BLOCK / 2, 0x22))

      assert.equal(outcome.ok, false)
      // the first PDU's bytes are still there, and the rest is still unfilled
      assert.equal(write.contiguousReceived, BLOCK / 2)
      assert.deepEqual(write.buffer, Buffer.concat([Buffer.alloc(BLOCK / 2, 0x11), Buffer.alloc(BLOCK / 2)]))
    })

    it('skipping ahead, leaving a gap before it', () => {
      const write = pending({ totalLength: 2 * BLOCK })

      const outcome = receiveDataOut(write, dataOut(BLOCK, BLOCK))

      assert.equal(outcome.ok, false)
      assert.equal(write.contiguousReceived, 0)
    })
  })

  it('refuses bytes beyond the current burst, even when the buffer could hold them', () => {
    // 2 blocks solicited of a 4-block write: the last 2 are only legitimate
    // after the next R2T, so accepting them now would break burst accounting
    const write = pending({ totalLength: 4 * BLOCK, solicited: 2 * BLOCK })

    const outcome = receiveDataOut(write, dataOut(0, 3 * BLOCK))

    assert.equal(outcome.ok, false)
    assert.equal(write.contiguousReceived, 0)
  })

  it("refuses a PDU carrying another command's Target Transfer Tag", () => {
    const write = pending()

    const outcome = receiveDataOut(write, { ...dataOut(0, BLOCK), targetTransferTag: TTT + 1 })

    assert.equal(outcome.ok, false)
    assert.equal(write.contiguousReceived, 0)
  })

  it('explains why it refused, for the log line next to the Reject', () => {
    const outcome = receiveDataOut(pending(), dataOut(BLOCK, BLOCK))

    assert.equal(outcome.ok, false)
    assert.match(outcome.ok === false ? outcome.reason : '', /BufferOffset/)
  })

  it('accepts a zero-length PDU without disturbing the coverage it has', () => {
    const write = pending()
    receiveDataOut(write, dataOut(0, BLOCK / 2, 0x11))

    const outcome = receiveDataOut(write, dataOut(BLOCK / 2, 0))

    assert.deepEqual(outcome, { ok: true, complete: false, burstComplete: false })
    assert.equal(write.contiguousReceived, BLOCK / 2)
  })
})
