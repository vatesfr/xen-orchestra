import assert from 'assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'

import CryptoCredentials from './crypto-credentials.mjs'

const { describe, it, before } = test

describe('CryptoCredentials', function () {
  let cryptoCredentials, mockApp

  before(async function () {
    mockApp = { hooks: { on: () => {} }, config: { getOptional: () => false } }
    cryptoCredentials = new CryptoCredentials(mockApp)
    await cryptoCredentials._loadKey(randomBytes(32), randomBytes(32))
  })

  it('encrypts and decripts a string', async function () {
    const payload = 'vates_rocks'

    const encrypted = await cryptoCredentials.encrypt(payload)
    assert.equal(typeof encrypted, 'string')
    // valid base64 decodes without throwing
    assert.ok(Buffer.from(encrypted, 'base64').length > 0)

    const decrypted = await cryptoCredentials.decrypt(encrypted)
    assert.equal(typeof decrypted, 'string')
    // encrypt and decrypt works
    assert.equal(decrypted, payload)
  })

  it('multiple encrypts give different ciphertexts', async function () {
    const payload = 'vates_rocks'

    const encrypted1 = await cryptoCredentials.encrypt(payload)
    const encrypted2 = await cryptoCredentials.encrypt(payload)

    assert.notEqual(encrypted1, encrypted2)
  })

  it('same key halves always produce the same derived key', async function () {
    const payload = 'vates_rocks'
    const halfA = randomBytes(32)
    const halfB = randomBytes(32)

    const instance1 = new CryptoCredentials(mockApp)
    await instance1._loadKey(halfA, halfB)

    const instance2 = new CryptoCredentials(mockApp)
    await instance2._loadKey(halfA, halfB)

    const encrypted = await instance1.encrypt(payload)

    // If HKDF is consistent, instance2 can decrypt what instance1 encrypted
    assert.equal(await instance2.decrypt(encrypted), payload)
  })

  it('decrypt with wrong key throws', async function () {
    const payload = 'vates_rocks'

    const encrypted = await cryptoCredentials.encrypt(payload)

    // Technically, the random could be the same as the first loadKey,
    // but you sometimes have to accept risks
    await cryptoCredentials._loadKey(randomBytes(32), randomBytes(32))

    await assert.rejects(() => cryptoCredentials.decrypt(encrypted), { name: 'OperationError' })
  })
})
