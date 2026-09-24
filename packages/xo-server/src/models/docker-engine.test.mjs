// Needs a redis server: skipped unless XO_DOCKER_TEST_REDIS_URL is set (e.g.
// `redis://127.0.0.1:6379`). The database XO_DOCKER_TEST_REDIS_DB (default 9)
// is flushed.

import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { after, before, beforeEach, describe, it } from 'node:test'
import { createClient } from 'redis'

import CryptoCredentials from '../xo-mixins/crypto-credentials.mjs'
import { DockerEngines } from './docker-engine.mjs'

const { XO_DOCKER_TEST_REDIS_URL: redisUrl, XO_DOCKER_TEST_REDIS_DB: redisDb = '9' } = process.env
const skip = redisUrl === undefined ? 'XO_DOCKER_TEST_REDIS_URL is not set' : false

const NAMESPACE = 'dockerEngineTest'
const VM = '5b0b5a4c-6a4b-4e0a-9d8e-2f6f9d8f0a01'
const OTHER_VM = '5b0b5a4c-6a4b-4e0a-9d8e-2f6f9d8f0a02'

const PRIVATE_KEY = '-----BEGIN OPENSSH PRIVATE KEY-----\nsecret-private-key\n-----END OPENSSH PRIVATE KEY-----\n'

const makeRecord = (props = {}) => ({
  vm: VM,
  host: '192.0.2.10',
  port: 2222,
  username: 'docker',
  password: 'secret-password',
  privateKey: PRIVATE_KEY,
  passphrase: 'secret-passphrase',
  socketPath: '/var/run/docker.sock',
  hostKeyFingerprint: 'SHA256:cuhCGsZJgQqGd0EohvOtnSax1uVTj3+/5ZB53nwP/co',
  hostKeyAlgorithm: 'ssh-ed25519',
  revision: 3,
  ...props,
})

async function createCrypto() {
  const crypto = new CryptoCredentials({ hooks: { on() {} }, config: { getOptional: () => true } })
  await crypto._loadKey(randomBytes(32), randomBytes(32))
  assert.equal(crypto.isDegraded(), false)
  return crypto
}

describe('DockerEngines (redis)', { skip }, () => {
  let redis

  before(async () => {
    redis = createClient({ url: redisUrl })
    await redis.connect()
    await redis.select(Number(redisDb))
  })

  after(async () => {
    await redis?.flushDb()
    await redis?.quit()
  })

  for (const encrypted of [false, true]) {
    describe(encrypted ? 'with redis.encryptCredentialDatabase' : 'without encryption', () => {
      let db

      beforeEach(async () => {
        await redis.flushDb()
        db = new DockerEngines({
          connection: redis,
          namespace: NAMESPACE,
          indexes: ['vm'],
          crypto: encrypted ? await createCrypto() : null,
        })
      })

      it('round-trips a record, types included', async () => {
        const { id } = await db.add(makeRecord())
        assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)

        assert.deepEqual(await db.first(id), { ...makeRecord(), id })
        assert.deepEqual(await db.get(), [{ ...makeRecord(), id }])
      })

      it('finds a record by VM through the index', async () => {
        const { id } = await db.add(makeRecord())
        await db.add(makeRecord({ vm: undefined, host: '192.0.2.11' }))
        assert.equal((await db.first({ vm: VM }))?.id, id)
        assert.equal(await db.first({ vm: OTHER_VM }), undefined)
      })

      it(encrypted ? 'stores the secrets encrypted' : 'stores the secrets in plain text', async () => {
        const { id } = await db.add(makeRecord())
        const raw = await redis.get(`xo:${NAMESPACE}:${id}`)
        const indexKeys = await redis.keys(`xo:${NAMESPACE}_vm:*`)
        assert.equal(indexKeys.length, 1)
        if (encrypted) {
          assert.ok(raw.startsWith('enc:'), raw.slice(0, 10))
          for (const secret of ['secret-password', 'secret-private-key', 'secret-passphrase', VM]) {
            assert.ok(!raw.includes(secret), secret)
          }
          // blind index: the VM uuid does not appear in the key
          assert.ok(!indexKeys[0].includes(VM))
        } else {
          assert.deepEqual(JSON.parse(raw), makeRecord())
          assert.equal(indexKeys[0], `xo:${NAMESPACE}_vm:${VM}`)
        }
      })

      it('removes a record and its index entry', async () => {
        const { id } = await db.add(makeRecord())
        await db.remove(id)
        assert.equal(await db.first(id), undefined)
        assert.equal(await db.first({ vm: VM }), undefined)
      })

      describe('one engine per VM', () => {
        it('refuses to add a second engine for the same VM (objectAlreadyExists → 409)', async () => {
          const { id } = await db.add(makeRecord())
          await assert.rejects(db.add(makeRecord({ host: '192.0.2.99' })), error => {
            assert.equal(error.code, 16) // objectAlreadyExists
            assert.deepEqual(error.data, { objectId: id, objectType: 'docker-engine' })
            return true
          })
          // nothing left behind by the failed add
          assert.equal((await db.get()).length, 1)
          assert.equal(await redis.sCard(`xo:${NAMESPACE}_ids`), 1)
        })

        it('allows several engines without VM', async () => {
          await db.add(makeRecord({ vm: undefined }))
          await db.add(makeRecord({ vm: undefined }))
          assert.equal((await db.get()).length, 2)
        })

        it('refuses to move an engine to a VM which already has one', async () => {
          await db.add(makeRecord())
          const other = await db.add(makeRecord({ vm: OTHER_VM }))
          await assert.rejects(db.update({ ...other, vm: VM }), { code: 16 })
          assert.equal((await db.first(other.id)).vm, OTHER_VM)

          // an update which keeps the VM is fine
          await db.update({ ...other, label: 'renamed' })
          assert.equal((await db.first({ vm: OTHER_VM })).label, 'renamed')
        })
      })
    })
  }
})
