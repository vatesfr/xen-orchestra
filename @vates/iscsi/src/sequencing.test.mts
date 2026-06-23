import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { addSerial, incrementSerial, SERIAL_MODULO } from './connection.mjs'

describe('iSCSI serial-number arithmetic', () => {
  it('increments within range', () => {
    assert.equal(incrementSerial(0), 1)
    assert.equal(incrementSerial(41), 42)
  })

  it('wraps at 2^32', () => {
    assert.equal(SERIAL_MODULO, 0x1_0000_0000)
    assert.equal(incrementSerial(0xffffffff), 0)
    assert.equal(addSerial(0xfffffffe, 5), 3)
    assert.equal(addSerial(0xffffffff, 1), 0)
  })

  it('advertises a command window above the next expected CmdSN, wrapping cleanly', () => {
    const expCmdSN = 0xfffffff0
    const window = 64
    assert.equal(addSerial(expCmdSN, window), (0xfffffff0 + 64) % SERIAL_MODULO)
  })
})
