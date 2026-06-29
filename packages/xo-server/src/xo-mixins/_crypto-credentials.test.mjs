import assert from 'assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'
import { configure } from '@xen-orchestra/log/configure'

import CryptoCredentials, { ENCRYPTION_PREFIX } from './crypto-credentials.mjs'

configure({ level: 'FATAL', transport: () => {} })

const { describe, it, before } = test

function xenToolsNotFound() {
  return Object.assign(new Error('spawn xenstore-read ENOENT'), {
    code: 'ENOENT',
    syscall: 'spawn xenstore-read',
    path: 'xenstore-read',
  })
}

function xenStoreKeyMissing() {
  return new Error("couldn't read path")
}

function fileNotFound() {
  return Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' })
}

function makeDeps({ fileKey, xenStoreKey, xenStoreWriteFails = false } = {}) {
  return {
    xenStore: {
      read: async () => {
        if (xenStoreKey !== undefined) return xenStoreKey.toString('hex')
        throw xenStoreKeyMissing()
      },
      write: async () => {
        if (xenStoreWriteFails) throw new Error('xenstore write failed')
      },
      rm: async () => {},
    },
    fsPromises: {
      readFile: async () => {
        if (fileKey !== undefined) return fileKey
        throw fileNotFound()
      },
      writeFile: async () => {},
      rm: async () => {},
      unlink: async () => {},
      access: async () => {
        throw fileNotFound()
      },
    },
  }
}

function makeApp(encryptionEnabled) {
  let startCoreCb
  return {
    app: {
      hooks: {
        on: (event, cb) => {
          if (event === 'start core') startCoreCb = cb
        },
      },
      config: { getOptional: key => (key === 'redis.encryptCredentialDatabase' ? encryptionEnabled : undefined) },
      _redis: {
        sMembers: async () => [],
        sIsMember: async () => false,
        get: async () => null,
        mSet: async () => {},
      },
    },
    run: () => startCoreCb(),
  }
}

async function runHook(encryptionEnabled, deps) {
  const { app, run } = makeApp(encryptionEnabled)
  const instance = new CryptoCredentials(app, deps)
  await run()
  return instance
}

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

    it('decrypt returns non-encrypted values unchanged', async function () {
      assert.equal(await cryptoCredentials.decrypt(payload1), payload1)
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

  describe('#initialize', function () {
    describe('Encryption DISABLED', function () {
      it('no keys - not degraded', async function () {
        const instance = await runHook(false, makeDeps())
        assert.equal(instance.isDegraded(), false)
      })

      it('fileKey only, xen-tools unavailable - degraded', async function () {
        const deps = makeDeps({ fileKey: randomBytes(32) })
        deps.xenStore.read = async () => {
          throw xenToolsNotFound()
        }
        const instance = await runHook(false, deps)
        assert.equal(instance.isDegraded(), true)
      })

      it('fileKey only, xenStoreKey path missing - degraded', async function () {
        const instance = await runHook(false, makeDeps({ fileKey: randomBytes(32) }))
        assert.equal(instance.isDegraded(), true)
      })

      it('both keys present - keys loaded, migration to decryption', async function () {
        const instance = await runHook(false, makeDeps({ fileKey: randomBytes(32), xenStoreKey: randomBytes(32) }))
        assert.equal(instance.isDegraded(), false)
        const encrypted = await instance.encrypt(payload1)
        assert.ok(encrypted.startsWith(ENCRYPTION_PREFIX))
      })
    })

    describe('Encryption ENABLED', function () {
      it('no xen-tools, no fileKey - degraded', async function () {
        const deps = makeDeps()
        deps.xenStore.read = async () => {
          throw xenToolsNotFound()
        }
        const instance = await runHook(true, deps)
        assert.equal(instance.isDegraded(), true)
      })

      it('no xen-tools, fileKey exists - degraded', async function () {
        const deps = makeDeps({ fileKey: randomBytes(32) })
        deps.xenStore.read = async () => {
          throw xenToolsNotFound()
        }
        const instance = await runHook(true, deps)
        assert.equal(instance.isDegraded(), true)
      })

      it('neither key in store - generates new keys, migration to encryption', async function () {
        let xenStoreWriteCalled = false
        const deps = makeDeps()
        deps.xenStore.write = async () => {
          xenStoreWriteCalled = true
        }
        const instance = await runHook(true, deps)
        assert.equal(instance.isDegraded(), false)
        assert.equal(xenStoreWriteCalled, true)
        const encrypted = await instance.encrypt(payload1)
        assert.ok(encrypted.startsWith(ENCRYPTION_PREFIX))
      })

      it('both keys present - keys loaded, not degraded', async function () {
        const instance = await runHook(true, makeDeps({ fileKey: randomBytes(32), xenStoreKey: randomBytes(32) }))
        assert.equal(instance.isDegraded(), false)
        const encrypted = await instance.encrypt(payload1)
        assert.ok(encrypted.startsWith(ENCRYPTION_PREFIX))
      })

      it('key write fails - degraded', async function () {
        const instance = await runHook(true, makeDeps({ xenStoreWriteFails: true }))
        assert.equal(instance.isDegraded(), true)
      })
    })
  })
})
