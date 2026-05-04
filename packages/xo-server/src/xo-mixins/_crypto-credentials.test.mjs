import assert from 'assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'

import CryptoCredentials, { ENCRYPTION_PREFIX } from './crypto-credentials.mjs'

const { describe, it, before } = test

describe('CryptoCredentials', function () {
  let cryptoCredentials, mockApp

  const payload1 = 'vates_rocks'
  const payload2 = 'vates_is_great'

  before(async function () {
    mockApp = { hooks: { on: () => {} }, config: { getOptional: () => false } }
    cryptoCredentials = new CryptoCredentials(mockApp)
    await cryptoCredentials._loadKey(randomBytes(32), randomBytes(32))
  })

  it('is not degraded by default', function () {
    const instance = new CryptoCredentials(mockApp)
    assert.equal(instance.isDegraded(), false)
  })

  describe('Encryption', function () {
    it('encrypts and decrypts a string', async function () {
      const encrypted = await cryptoCredentials.encrypt(payload1)
      assert.equal(typeof encrypted, 'string')
      // Check that encryption prefix has been added
      assert.ok(encrypted.startsWith(ENCRYPTION_PREFIX))

      const decrypted = await cryptoCredentials.decrypt(encrypted)
      assert.equal(typeof decrypted, 'string')
      // encrypt and decrypt works
      assert.equal(decrypted, payload1)
    })

    it('encrypted value is base64 and not valid JSON', async function () {
      const encrypted = await cryptoCredentials.encrypt('{"why":"vates_rocks"}')

      assert.ok(encrypted.startsWith(ENCRYPTION_PREFIX))
      assert.ok(Buffer.from(encrypted, 'base64').length > 12)
    })

    it('multiple encrypts give different ciphertexts', async function () {
      const encrypted1 = await cryptoCredentials.encrypt(payload1)
      const encrypted2 = await cryptoCredentials.encrypt(payload1)

      assert.notEqual(encrypted1, encrypted2)
    })

    it('same key halves always produce the same derived key', async function () {
      const halfA = randomBytes(32)
      const halfB = randomBytes(32)

      // Since _loadKey fills the key half buffers with zeros,
      // we need to pass a copy using Buffer.from, not by reference.

      const instance1 = new CryptoCredentials(mockApp)
      await instance1._loadKey(Buffer.from(halfA), Buffer.from(halfB))

      const instance2 = new CryptoCredentials(mockApp)
      await instance2._loadKey(Buffer.from(halfA), Buffer.from(halfB))

      const encrypted = await instance1.encrypt(payload1)

      // If HKDF is consistent, instance2 can decrypt what instance1 encrypted
      assert.equal(await instance2.decrypt(encrypted), payload1)
    })

    it('decrypt with wrong key throws', async function () {
      const encrypted = await cryptoCredentials.encrypt(payload1)

      // Technically, the random could be the same as the first loadKey,
      // but you sometimes have to live dangerously
      const instance = new CryptoCredentials(mockApp)
      await instance._loadKey(randomBytes(32), randomBytes(32))

      await assert.rejects(() => instance.decrypt(encrypted), { name: 'OperationError' })
    })
  })

  describe('HMAC index', function () {
    it('same key halves always produce the same hmac indexes', async function () {
      const halfA = randomBytes(32)
      const halfB = randomBytes(32)

      // Since _loadKey fills the key half buffers with zeros,
      // we need to pass a copy using Buffer.from, not by reference.

      const instance1 = new CryptoCredentials(mockApp)
      await instance1._loadKey(Buffer.from(halfA), Buffer.from(halfB))

      const instance2 = new CryptoCredentials(mockApp)
      await instance2._loadKey(Buffer.from(halfA), Buffer.from(halfB))

      // Both instances should produced the same hmac index.
      assert.equal(await instance1.hmacIndex(payload1), await instance2.hmacIndex(payload1))
    })

    it('different payloads produce  different hmac indexes', async function () {
      assert.notEqual(await cryptoCredentials.hmacIndex(payload1), await cryptoCredentials.hmacIndex(payload2))
    })

    it('different halves produce different hmac indexes', async function () {
      const hmacIndex = await cryptoCredentials.hmacIndex(payload1)

      // Technically, the random could be the same as the first loadKey,
      // but you sometimes have to live dangerously
      const instance = new CryptoCredentials(mockApp)
      await instance._loadKey(randomBytes(32), randomBytes(32))

      // Different hmac keys should produce different indexes.
      assert.notEqual(hmacIndex, await instance.hmacIndex(payload1))
    })
  })
})
