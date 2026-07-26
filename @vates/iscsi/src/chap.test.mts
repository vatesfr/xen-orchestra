import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { describe, it } from 'node:test'

import {
  CHAP_ALGORITHM_MD5,
  computeResponse,
  decodeChapValue,
  encodeChapValue,
  generateChallenge,
  generateId,
  parseAlgorithmList,
  selectAlgorithm,
  verifyResponse,
} from './chap.mjs'

describe('computeResponse', () => {
  // Known-answer vector: MD5(0x01 ‖ "s3cr3t" ‖ <16-byte challenge>), computed
  // independently so this pins the exact byte layout (id octet first), not MD5
  // against itself.
  const id = 1
  const secret = 's3cr3t'
  const challenge = Buffer.from('0102030405060708090a0b0c0d0e0f10', 'hex')
  const expected = 'fc14fb49f184c847514a10278d75a10f'

  it('hashes id ‖ secret ‖ challenge (RFC 1994)', () => {
    assert.equal(computeResponse(id, secret, challenge).toString('hex'), expected)
  })

  it('treats a string secret as its UTF-8 bytes', () => {
    assert.deepEqual(
      computeResponse(id, Buffer.from(secret, 'utf8'), challenge),
      computeResponse(id, secret, challenge)
    )
  })

  it('uses the id as a raw octet, not its ASCII decimal', () => {
    // computeResponse(1, …) must hash the byte 0x01, whereas hashing the ASCII
    // text "1" would hash 0x31 — the two must differ.
    const rawOctet = createHash('md5')
      .update(Buffer.from([1]))
      .update(secret)
      .update(challenge)
      .digest()
    const asciiText = createHash('md5').update(Buffer.from('1', 'ascii')).update(secret).update(challenge).digest()
    assert.deepEqual(computeResponse(1, secret, challenge), rawOctet)
    assert.notDeepEqual(computeResponse(1, secret, challenge), asciiText)
  })
})

describe('CHAP value codec', () => {
  it('encodes as a 0x hex-constant', () => {
    assert.equal(encodeChapValue(Buffer.from([0xab, 0xcd, 0x01])), '0xabcd01')
  })

  it('round-trips through hex', () => {
    const value = generateChallenge()
    assert.deepEqual(decodeChapValue(encodeChapValue(value)), value)
  })

  it('decodes a 0b base64-constant', () => {
    const raw = Buffer.from('0102030405060708090a0b0c0d0e0f10', 'hex')
    assert.deepEqual(decodeChapValue('0b' + raw.toString('base64')), raw)
  })

  it('accepts uppercase 0X / 0B prefixes', () => {
    assert.deepEqual(decodeChapValue('0Xabcd'), Buffer.from('abcd', 'hex'))
    assert.deepEqual(decodeChapValue('0B' + Buffer.from([1, 2]).toString('base64')), Buffer.from([1, 2]))
  })

  it('rejects an unknown encoding', () => {
    assert.throws(() => decodeChapValue('12345'), /unsupported CHAP value encoding/)
  })
})

describe('algorithm selection', () => {
  it('parses a preference list', () => {
    assert.deepEqual(parseAlgorithmList('5,6,7'), [5, 6, 7])
    assert.deepEqual(parseAlgorithmList('5'), [5])
  })

  it('picks MD5 when offered', () => {
    assert.equal(selectAlgorithm([1, CHAP_ALGORITHM_MD5, 6]), CHAP_ALGORITHM_MD5)
  })

  it('returns undefined when MD5 is not offered (never falls back)', () => {
    assert.equal(selectAlgorithm([1, 2]), undefined)
  })
})

describe('verifyResponse', () => {
  const secret = 's3cr3t'
  const challenge = generateChallenge()
  const id = generateId()
  const good = computeResponse(id, secret, challenge)

  it('accepts a matching response', () => {
    assert.equal(verifyResponse(good, computeResponse(id, secret, challenge)), true)
  })

  it('rejects a wrong secret', () => {
    assert.equal(verifyResponse(good, computeResponse(id, 'wrong', challenge)), false)
  })

  it('rejects a wrong-length response without throwing', () => {
    assert.equal(verifyResponse(good, Buffer.alloc(4)), false)
  })
})
