import assert from 'assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'

import CryptoCredentials from './crypto-credentials.mjs'

const { describe, it, before } = test

describe('encrypt/decrypt', function () {
  let cryptoCredentials

  before(async function () {
    cryptoCredentials = new CryptoCredentials(null)
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

  it('decrypt with wrong key throws', async function () {
    const payload = 'vates_rocks'

    const encrypted = await cryptoCredentials.encrypt(payload)

    // Technically, the random could be the same as the first loadKey,
    // but you sometimes have to accept risks
    await cryptoCredentials._loadKey(randomBytes(32), randomBytes(32))

    await assert.rejects(() => cryptoCredentials.decrypt(encrypted), { name: 'OperationError' })
  })
})
