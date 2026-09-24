// Tests of the Docker mixin, instantiated with a minimal fake `app` (config,
// hooks, redis, cryptoCredentials, getObject) instead of a whole `Xo`.
//
// - the first suite needs a redis server: XO_DOCKER_TEST_REDIS_URL (e.g.
//   `redis://127.0.0.1:6379`), database XO_DOCKER_TEST_REDIS_DB (default 10) is
//   flushed
// - the second one also needs the real SSH + dockerd environment of
//   `_docker/connection.integration.test.mjs` (XO_DOCKER_TEST_SSH_HOST…), and
//   uses database XO_DOCKER_TEST_REDIS_DB + 1; XO_DOCKER_TEST_MIXIN_SSH_PORT and
//   XO_DOCKER_TEST_MIXIN_SSH_FINGERPRINT override the port and the fingerprint
//   (see below)

import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { request as httpRequest } from 'node:http'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, beforeEach, describe, it } from 'node:test'
import { parseDuration } from '@vates/parse-duration'
import { createClient } from 'redis'
import { noSuchObject } from 'xo-common/api-errors.js'

import { Readable } from 'node:stream'

import CryptoCredentials from './crypto-credentials.mjs'
import Docker from './docker.mjs'
import { DockerConnection } from '../_docker/connection.mjs'
import { DockerError } from '../_docker/errors.mjs'
import { DockerEngines } from '../models/docker-engine.mjs'

const {
  XO_DOCKER_TEST_REDIS_URL: redisUrl,
  XO_DOCKER_TEST_REDIS_DB: redisDb = '10',
  XO_DOCKER_TEST_SSH_HOST: sshHost,
  XO_DOCKER_TEST_SSH_USER: sshUser,
  XO_DOCKER_TEST_SSH_KEY: keyPath,
  XO_DOCKER_TEST_SSH_BAD_KEY: badKeyPath,
  XO_DOCKER_TEST_SOCKET: socketPath,
  XO_DOCKER_TEST_SSH_NOFWD_PORT: noForwardingPort,
} = process.env

// OpenSSH >= 9.8 refuses connections from a source address which failed too
// many authentications or aborted too many handshakes (PerSourcePenalties),
// which this suite does on purpose: it can use its own SSH server
const {
  XO_DOCKER_TEST_MIXIN_SSH_PORT: sshPort = process.env.XO_DOCKER_TEST_SSH_PORT ?? '22',
  XO_DOCKER_TEST_MIXIN_SSH_FINGERPRINT: fingerprint = process.env.XO_DOCKER_TEST_SSH_FINGERPRINT,
} = process.env

const skipRedis = redisUrl === undefined ? 'XO_DOCKER_TEST_REDIS_URL is not set' : false
const skipIntegration = skipRedis || (sshHost === undefined ? 'XO_DOCKER_TEST_SSH_HOST is not set' : false)

const NAMESPACE = 'dockerEngine'
const SECRETS = ['secret-password', 'secret-private-key', 'secret-passphrase']
const PRIVATE_KEY = '-----BEGIN OPENSSH PRIVATE KEY-----\nsecret-private-key\n-----END OPENSSH PRIVATE KEY-----\n'
const FINGERPRINT = 'SHA256:cuhCGsZJgQqGd0EohvOtnSax1uVTj3+/5ZB53nwP/co'
const WRONG_FINGERPRINT = 'SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

const VM_ID = '0a1b2c3d-0000-4000-8000-000000000001'
const VM_WITHOUT_IP = '0a1b2c3d-0000-4000-8000-000000000002'
const MISSING_VM = '0a1b2c3d-0000-4000-8000-00000000dead'
const POOL_ID = 'c0ffee00-0000-4000-8000-000000000000'

const OBJECTS = {
  [VM_ID]: {
    id: VM_ID,
    type: 'VM',
    $pool: POOL_ID,
    mainIpAddress: '192.0.2.50',
    addresses: { '0/ipv4/0': '192.0.2.50' },
  },
  [VM_WITHOUT_IP]: { id: VM_WITHOUT_IP, type: 'VM', $pool: POOL_ID, addresses: { '0/ipv6/0': 'fe80::1' } },
}

const getPath = (object, path) => path.split('.').reduce((value, key) => value?.[key], object)

async function createCrypto() {
  const crypto = new CryptoCredentials({ hooks: { on() {} }, config: { getOptional: () => true } })
  await crypto._loadKey(randomBytes(32), randomBytes(32))
  return crypto
}

/**
 * @returns {{ app: object, docker: Docker, emit: (event: string) => Promise<void> }}
 */
async function createDocker({ redis, crypto = null, config = {} }) {
  const listeners = new Map()
  const app = {
    _redis: redis,
    cryptoCredentials: crypto,
    config: {
      getOptional: path => getPath(config, path),
      getOptionalDuration: path => {
        const value = getPath(config, path)
        return value === undefined ? undefined : parseDuration(value)
      },
    },
    hooks: {
      on(event, listener) {
        listeners.set(event, [...(listeners.get(event) ?? []), listener])
      },
    },
    getObject(id, type) {
      const object = OBJECTS[id]
      if (object === undefined || (type !== undefined && object.type !== type)) {
        throw noSuchObject(id, type)
      }
      return object
    },
    addConfigManager(id, exp, imp) {
      app.configManagers = { ...app.configManagers, [id]: { exp, imp } }
    },
  }
  const emit = async event => {
    for (const listener of listeners.get(event) ?? []) {
      await listener()
    }
  }
  const docker = new Docker(app)
  await emit('core started')
  return { app, docker, emit }
}

const assertNoSecrets = value => {
  const json = JSON.stringify(value)
  for (const secret of SECRETS) {
    assert.ok(!json.includes(secret), `${secret} leaked: ${json}`)
  }
  for (const engine of Array.isArray(value) ? value : [value]) {
    for (const key of ['password', 'privateKey', 'passphrase', 'vm', 'revision']) {
      assert.ok(!(key in engine), `${key} is exposed`)
    }
  }
}

// a local TCP port on which nothing listens
async function getClosedPort() {
  const server = createServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  await new Promise(resolve => server.close(resolve))
  return port
}

const isCode = code => error => {
  assert.equal(error.code, code, error.message)
  return true
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Replaces the network part of `DockerConnection` while installed: `connect()`
 * runs `fake.connect` (default: succeeds after `fake.delay` ms), the observed
 * host key is `fake.observed`, the API version 1.43. `fake.connect = null`
 * uses the real implementation.
 */
function installFakeConnections() {
  const proto = DockerConnection.prototype
  const original = {
    connect: proto.connect,
    request: proto.request,
    observedHostKey: Object.getOwnPropertyDescriptor(proto, 'observedHostKey'),
    apiVersion: Object.getOwnPropertyDescriptor(proto, 'apiVersion'),
  }
  const fake = {
    connects: 0,
    requests: 0,
    delay: 0,
    connect: undefined,
    observed: { fingerprint: FINGERPRINT, algorithm: 'ssh-ed25519' },
    reset() {
      this.connects = 0
      this.requests = 0
      this.delay = 0
      this.connect = async () => {}
      this.observed = { fingerprint: FINGERPRINT, algorithm: 'ssh-ed25519' }
    },
    uninstall() {
      proto.connect = original.connect
      proto.request = original.request
      Object.defineProperty(proto, 'observedHostKey', original.observedHostKey)
      Object.defineProperty(proto, 'apiVersion', original.apiVersion)
    },
  }
  proto.connect = async function () {
    if (fake.connect === null) {
      return original.connect.call(this)
    }
    ++fake.connects
    await sleep(fake.delay)
    return fake.connect.call(this)
  }
  // no Docker behind the fake connections
  proto.request = async function (opts) {
    if (fake.connect === null) {
      return original.request.call(this, opts)
    }
    ++fake.requests
    throw new DockerError('DOCKER_API_ERROR', 'fake connection', { data: { statusCode: 500 } })
  }
  Object.defineProperty(proto, 'observedHostKey', {
    configurable: true,
    get() {
      return fake.connect === null ? original.observedHostKey.get.call(this) : fake.observed
    },
  })
  Object.defineProperty(proto, 'apiVersion', {
    configurable: true,
    get() {
      return fake.connect === null ? original.apiVersion.get.call(this) : '1.43'
    },
  })
  fake.reset()
  return fake
}

// ===================================================================

describe('Docker mixin: engines CRUD (redis, no SSH)', { skip: skipRedis }, () => {
  let redis, fake

  before(async () => {
    redis = createClient({ url: redisUrl })
    await redis.connect()
    await redis.select(Number(redisDb))
    fake = installFakeConnections()
  })

  after(async () => {
    fake?.uninstall()
    await redis?.flushDb()
    await redis?.quit()
  })

  for (const encrypted of [false, true]) {
    describe(encrypted ? 'with redis.encryptCredentialDatabase' : 'without encryption', () => {
      let crypto, docker, emit, seedDb

      // records written directly in the database, as the mixin would have
      // after a successful connection (pinned host key)
      const seed = props =>
        seedDb.add({
          host: '192.0.2.10',
          port: 22,
          username: 'docker',
          password: 'secret-password',
          privateKey: PRIVATE_KEY,
          passphrase: 'secret-passphrase',
          socketPath: '/var/run/docker.sock',
          hostKeyFingerprint: FINGERPRINT,
          hostKeyAlgorithm: 'ssh-ed25519',
          revision: 0,
          ...props,
        })

      beforeEach(async () => {
        fake.reset()
        await redis.flushDb()
        crypto = encrypted ? await createCrypto() : null
        ;({ docker, emit } = await createDocker({ redis, crypto, config: { docker: { connectTimeout: '2s' } } }))
        seedDb = new DockerEngines({ connection: redis, namespace: NAMESPACE, indexes: ['vm'], crypto })
      })

      describe('secrets never come out', () => {
        it('getDockerEngine() and getAllDockerEngines()', async () => {
          const { id } = await seed({ vm: VM_ID })
          await seed({ vm: undefined, password: undefined })

          const engine = await docker.getDockerEngine(id)
          assertNoSecrets(engine)
          assert.equal(engine.hasPassword, true)
          assert.equal(engine.hasPrivateKey, true)

          const engines = await docker.getAllDockerEngines()
          assert.equal(engines.length, 2)
          assertNoSecrets(engines)
          const other = engines.find(_ => _.id !== id)
          assert.equal(other.hasPassword, false)
          assert.equal(other.hasPrivateKey, true)
        })

        it('updateDockerEngine() result', async () => {
          const { id } = await seed({ vm: VM_ID })
          assertNoSecrets(await docker.updateDockerEngine(id, { password: 'secret-password', label: 'x' }))
        })

        it('returns a copy', async () => {
          const { id } = await seed({})
          const engine = await docker.getDockerEngine(id)
          engine.username = 'mutated'
          assert.equal((await docker.getDockerEngine(id)).username, 'docker')
        })
      })

      it('exposes $VM, $pool (only if the VM exists), resolvedHost and a passive connectionStatus', async () => {
        const withVm = await seed({ vm: VM_ID, host: undefined })
        const missingVm = await seed({ vm: MISSING_VM, host: '192.0.2.99' })
        const noVm = await seed({ vm: undefined })

        assert.deepEqual(await docker.getDockerEngine(withVm.id), {
          id: withVm.id,
          $VM: VM_ID,
          $pool: POOL_ID,
          port: 22,
          username: 'docker',
          socketPath: '/var/run/docker.sock',
          hostKeyFingerprint: FINGERPRINT,
          hostKeyAlgorithm: 'ssh-ed25519',
          resolvedHost: '192.0.2.50',
          hasPassword: true,
          hasPrivateKey: true,
          connectionStatus: 'idle',
        })

        const engine = await docker.getDockerEngine(missingVm.id)
        assert.equal(engine.$VM, MISSING_VM)
        assert.equal('$pool' in engine, false)
        assert.equal(engine.host, '192.0.2.99')
        assert.equal(engine.resolvedHost, '192.0.2.99')

        const withoutVm = await docker.getDockerEngine(noVm.id)
        assert.equal('$VM' in withoutVm, false)
        assert.equal('$pool' in withoutVm, false)
      })

      it('resolves the host from the addresses when the VM has no main IP', async () => {
        const { id } = await seed({ vm: VM_WITHOUT_IP, host: undefined })
        assert.equal((await docker.getDockerEngine(id)).resolvedHost, 'fe80::1')
      })

      it('getDockerEngine() of an unknown engine → noSuchObject', async () => {
        await assert.rejects(docker.getDockerEngine('nope'), noSuchObject.is)
      })

      describe('updateDockerEngine(): PATCH semantics', () => {
        const readRaw = id => seedDb.first(id)

        it('keeps omitted secrets', async () => {
          const { id } = await seed({})
          await docker.updateDockerEngine(id, { label: 'renamed' })
          assert.equal(fake.connects, 0, 'a label-only update does not connect')
          const raw = await readRaw(id)
          assert.equal(raw.password, 'secret-password')
          assert.equal(raw.privateKey, PRIVATE_KEY)
          assert.equal(raw.passphrase, 'secret-passphrase')
          assert.equal(raw.label, 'renamed')
          assert.equal(raw.revision, 0, 'a label change does not bump the revision')
        })

        it('null or empty string clears a secret', async () => {
          const { id } = await seed({})
          const engine = await docker.updateDockerEngine(id, { password: null, passphrase: '' })
          assert.equal(engine.hasPassword, false)
          const raw = await readRaw(id)
          assert.equal('password' in raw, false)
          assert.equal('passphrase' in raw, false)
          assert.equal(raw.privateKey, PRIVATE_KEY)
        })

        it('replaces a secret and bumps the revision (a new unique one, fixes)', async () => {
          const { id } = await seed({})
          await docker.updateDockerEngine(id, { privateKey: 'new-key' })
          const raw = await readRaw(id)
          assert.equal(raw.privateKey, 'new-key')
          assert.match(raw.revision, /^[0-9a-f]{16}$/)
          await docker.updateDockerEngine(id, { host: '192.0.2.11' })
          const { revision } = await readRaw(id)
          assert.notEqual(revision, raw.revision)
          assert.notEqual(revision, 0)
          assert.equal(fake.connects, 2, 'identity changes connect')
        })

        it('clearing the private key also clears the passphrase (fixes)', async () => {
          const { id } = await seed({})
          await docker.updateDockerEngine(id, { privateKey: null })
          const raw = await readRaw(id)
          assert.equal('privateKey' in raw, false)
          assert.equal('passphrase' in raw, false)
          assert.equal(raw.password, 'secret-password')
        })

        it('refuses to clear the last credential', async () => {
          const { id } = await seed({ password: undefined })
          await assert.rejects(docker.updateDockerEngine(id, { privateKey: null }), { code: 10 })
          assert.equal((await readRaw(id)).privateKey, PRIVATE_KEY)
        })

        it('null resets the port and the socket path, host is required without VM', async () => {
          const { id } = await seed({ port: 2222, socketPath: '/run/user/1000/docker.sock' })
          await docker.updateDockerEngine(id, { port: null, socketPath: null })
          const raw = await readRaw(id)
          assert.equal(raw.port, 22)
          assert.equal(raw.socketPath, '/var/run/docker.sock')
          await assert.rejects(docker.updateDockerEngine(id, { host: null }), { code: 10 })
        })

        it('a pasted fingerprint is verified by connecting, then replaces the pin with the observed algorithm', async () => {
          const { id } = await seed({})
          fake.observed = { fingerprint: WRONG_FINGERPRINT, algorithm: 'ssh-rsa' }
          const engine = await docker.updateDockerEngine(id, { hostKeyFingerprint: WRONG_FINGERPRINT.slice(7) })
          assert.equal(fake.connects, 1)
          assert.equal(engine.hostKeyFingerprint, WRONG_FINGERPRINT)
          assert.equal(engine.hostKeyAlgorithm, 'ssh-rsa')
          await assert.rejects(docker.updateDockerEngine(id, { hostKeyFingerprint: 'SHA256:short' }), { code: 10 })
        })

        it('rejects unknown properties and invalid values', async () => {
          const { id } = await seed({})
          await assert.rejects(docker.updateDockerEngine(id, { hots: 'typo' }), { code: 10 })
          await assert.rejects(docker.updateDockerEngine(id, { port: 70000 }), { code: 10 })
          await assert.rejects(docker.updateDockerEngine(id, { socketPath: 'relative' }), { code: 10 })
          await assert.rejects(docker.updateDockerEngine(id, { acceptUnknownHostKey: 'yes' }), { code: 10 })
        })

        it('refuses to attach an engine to a VM which already has one (409)', async () => {
          const first = await seed({ vm: VM_ID })
          const second = await seed({ vm: undefined })
          await assert.rejects(docker.updateDockerEngine(second.id, { $VM: VM_ID }), error => {
            assert.equal(error.code, 16) // objectAlreadyExists
            assert.equal(error.data.objectId, first.id)
            return true
          })
          // re-attaching to its own VM is fine
          await docker.updateDockerEngine(first.id, { $VM: VM_ID, label: 'same VM' })
        })
      })

      describe('createDockerEngine()', () => {
        it('one engine per VM: 409 before any connection', async () => {
          const { id } = await seed({ vm: VM_ID })
          const start = Date.now()
          await assert.rejects(
            // 192.0.2.0/24 is TEST-NET-1: a connection would hang until connectTimeout
            docker.createDockerEngine({ $VM: VM_ID, host: '192.0.2.1', username: 'u', password: 'p' }),
            error => {
              assert.equal(error.code, 16)
              assert.equal(error.data.objectId, id)
              return true
            }
          )
          assert.ok(Date.now() - start < 1e3)
          assert.equal((await docker.getAllDockerEngines()).length, 1)
        })

        it('validates its parameters before connecting', async () => {
          const invalid = [
            { username: 'u', password: 'p' }, // no $VM and no host
            { host: 'h', password: 'p' }, // no username
            { host: 'h', username: 'u' }, // no credential
            { host: 'h', username: 'u', password: 'p', port: '22' },
            { host: 'h', username: 'u', password: 'p', hostKeyFingerprint: 'MD5:aa:bb' },
            { host: 'h', username: 'u', password: 'p', unknown: true },
          ]
          for (const params of invalid) {
            await assert.rejects(docker.createDockerEngine(params), { code: 10 }, JSON.stringify(params))
          }
        })

        it('cannot connect to a VM without address: SSH_UNREACHABLE, nothing saved', async () => {
          await assert.rejects(
            docker.createDockerEngine({ $VM: MISSING_VM, username: 'u', password: 'p' }),
            isCode('SSH_UNREACHABLE')
          )
          assert.deepEqual(await docker.getAllDockerEngines(), [])
        })
      })

      it('deleteDockerEngine()', async () => {
        const { id } = await seed({ vm: VM_ID })
        await docker.deleteDockerEngine(id)
        await assert.rejects(docker.getDockerEngine(id), noSuchObject.is)
        await assert.rejects(docker.deleteDockerEngine(id), noSuchObject.is)
        // the VM can have a new engine
        await seed({ vm: VM_ID })
      })

      it('info of an unreachable engine: status, never throws; the error is then exposed passively and fails fast', async () => {
        // password only: the fake private key cannot be parsed (→ SSH_AUTH_FAILED)
        const { id } = await seed({ host: '127.0.0.1', port: await getClosedPort(), privateKey: undefined })
        fake.connect = null // real connections
        const info = await docker.getDockerEngineInfo(id)
        assert.equal(info.status, 'unreachable')
        assert.equal(info.error.code, 'SSH_UNREACHABLE')
        assert.equal(typeof info.asOf, 'number')

        const engine = await docker.getDockerEngine(id)
        assert.equal(engine.connectionStatus, 'error')
        assert.equal(engine.error.code, 'SSH_UNREACHABLE')

        const again = await docker.getDockerEngineInfo(id)
        assert.equal(again.status, 'unreachable')
        assert.equal(again.error.data.failFast, true)

        // an update of the connection settings (which connects) forgets the failure
        fake.reset()
        await docker.updateDockerEngine(id, { port: 2222 })
        assert.equal((await docker.getDockerEngine(id)).connectionStatus, 'idle')
        await emit('stop')
      })

      describe('concurrency and consistency (fixes)', () => {
        const readRaw = id => seedDb.first(id)

        it('concurrent updates are serialized: no lost update, distinct revisions', async () => {
          const { id } = await seed({})
          fake.delay = 50
          const revisions = new Set()
          const recordRevision = async () => revisions.add((await readRaw(id)).revision)
          await Promise.all([
            docker.updateDockerEngine(id, { password: 'pw-A' }).then(recordRevision),
            docker.updateDockerEngine(id, { port: 2200 }).then(recordRevision),
            docker.updateDockerEngine(id, { label: 'L' }),
          ])
          const raw = await readRaw(id)
          assert.equal(raw.password, 'pw-A')
          assert.equal(raw.port, 2200)
          assert.equal(raw.label, 'L')
          assert.equal(fake.connects, 2)
          assert.equal(revisions.size, 2, 'two identities, two revisions')
          assert.ok(!revisions.has(1))
        })

        it('an update racing a delete does not resurrect the engine', async () => {
          const { id } = await seed({})
          fake.delay = 100
          const update = docker.updateDockerEngine(id, { password: 'late' })
          await sleep(10)
          await docker.deleteDockerEngine(id)
          await update // it ran first, under the lock
          assert.equal(await readRaw(id), undefined)
          // queued after the delete: noSuchObject, nothing written
          const { id: id2 } = await seed({})
          const deleted = docker.deleteDockerEngine(id2)
          const updated = docker.updateDockerEngine(id2, { label: 'late' })
          await deleted
          await assert.rejects(updated, noSuchObject.is)
          assert.equal(await readRaw(id2), undefined)
        })

        it('one engine per VM: concurrent creates on the same VM, only one is saved', async () => {
          fake.delay = 50
          const results = await Promise.allSettled([
            docker.createDockerEngine({ $VM: VM_ID, username: 'u', password: 'p', hostKeyFingerprint: FINGERPRINT }),
            docker.createDockerEngine({ $VM: VM_ID, username: 'u', password: 'p', hostKeyFingerprint: FINGERPRINT }),
          ])
          assert.deepEqual(
            results.map(_ => _.status),
            ['fulfilled', 'rejected']
          )
          assert.equal(results[1].reason.code, 16)
          assert.equal(fake.connects, 1, 'the second one fails before connecting')
          assert.equal((await docker.getAllDockerEngines()).length, 1)
        })

        it('an identity update which fails to connect saves nothing', async () => {
          const { id } = await seed({})
          fake.connect = async () => {
            throw new DockerError('SSH_AUTH_FAILED', 'SSH authentication failed')
          }
          await assert.rejects(docker.updateDockerEngine(id, { privateKey: 'wrong key' }), isCode('SSH_AUTH_FAILED'))
          assert.equal((await readRaw(id)).privateKey, PRIVATE_KEY)
          assert.equal((await readRaw(id)).revision, 0)
        })

        it('a stale record never gets the connection of other parameters (keyed on the parameters)', async () => {
          const { id } = await seed({})
          fake.connect = async function () {}
          await docker.getDockerEngineInfo(id).catch(() => {})
          const connects = fake.connects
          // same record: the pooled connection is reused
          await docker.getDockerEngineInfo(id).catch(() => {})
          assert.equal(fake.connects, connects)
          // other parameters, same revision (as a stale snapshot would have)
          await seedDb.update({ ...(await readRaw(id)), port: 2201 })
          await docker.getDockerEngineInfo(id).catch(() => {})
          assert.equal(fake.connects, connects + 1)
          await emit('stop')
        })

        it('#pinHostKey only writes the pin, over the latest record', async () => {
          const lax = await createDocker({ redis, crypto, config: { docker: { strictHostKeyChecking: false } } })
          try {
            const { id } = await seed({ hostKeyFingerprint: undefined, hostKeyAlgorithm: undefined })
            fake.delay = 50
            const test = lax.docker.testDockerEngine(id)
            await sleep(10)
            await lax.docker.updateDockerEngine(id, { label: 'meanwhile' })
            assert.equal((await test).ok, true)
            const raw = await readRaw(id)
            assert.equal(raw.label, 'meanwhile')
            assert.equal(raw.hostKeyFingerprint, FINGERPRINT)
            assert.equal(raw.hostKeyAlgorithm, 'ssh-ed25519')
          } finally {
            await lax.emit('stop')
          }
        })
      })

      describe('SSH cooldown (fixes)', () => {
        const failWith = (code, causeMessage) => {
          fake.connect = async () => {
            throw new DockerError(code, code, {
              cause: causeMessage === undefined ? undefined : new Error(causeMessage),
            })
          }
        }

        it('after an authentication failure, the same parameters are refused (test, update, create), others are tried', async () => {
          const { id } = await seed({})
          failWith('SSH_AUTH_FAILED')
          assert.equal((await docker.testDockerEngine(id)).error.code, 'SSH_AUTH_FAILED')
          assert.equal(fake.connects, 1)

          await assert.rejects(docker.testDockerEngine(id), error => {
            assert.equal(error.code, 'SSH_COOLDOWN')
            assert.equal(error.data.lastCode, 'SSH_AUTH_FAILED')
            assert.ok(error.data.retryAfter >= 1 && error.data.retryAfter <= 10)
            return true
          })
          // the same address and parameters on create
          await assert.rejects(
            docker.createDockerEngine({
              host: '192.0.2.10',
              username: 'docker',
              password: 'secret-password',
              privateKey: PRIVATE_KEY,
              passphrase: 'secret-passphrase',
              hostKeyFingerprint: FINGERPRINT,
            }),
            isCode('SSH_COOLDOWN')
          )
          assert.equal(fake.connects, 1, 'refused without connecting')

          // a label-only update does not connect: allowed
          await docker.updateDockerEngine(id, { label: 'x' })
          // changed parameters: tried
          fake.reset()
          await docker.updateDockerEngine(id, { privateKey: 'fixed key' })
          assert.equal(fake.connects, 1)
        })

        it('the TOFU confirmation (acceptUnknownHostKey) is not refused after HOST_KEY_UNKNOWN', async () => {
          const params = { host: '192.0.2.20', username: 'u', password: 'p' }
          failWith('HOST_KEY_UNKNOWN')
          await assert.rejects(docker.createDockerEngine(params), isCode('HOST_KEY_UNKNOWN'))
          await assert.rejects(docker.createDockerEngine(params), isCode('SSH_COOLDOWN'))
          fake.reset()
          await docker.createDockerEngine({ ...params, acceptUnknownHostKey: true })
        })

        it('a handshake lost soon after failures → SSH_REFUSED_PENALTY', async () => {
          const { id } = await seed({})
          failWith('SSH_AUTH_FAILED')
          await docker.testDockerEngine(id)
          failWith('SSH_ERROR', 'Connection lost before handshake')
          await assert.rejects(docker.updateDockerEngine(id, { password: 'other' }), error => {
            assert.equal(error.code, 'SSH_REFUSED_PENALTY')
            assert.match(error.message, /PerSourcePenalties/)
            return true
          })
        })

        it('authFailureCooldown = 0 disables it', async () => {
          const off = await createDocker({ redis, crypto, config: { docker: { authFailureCooldown: '0s' } } })
          const { id } = await seed({})
          failWith('SSH_AUTH_FAILED')
          await off.docker.testDockerEngine(id)
          assert.equal((await off.docker.testDockerEngine(id)).error.code, 'SSH_AUTH_FAILED')
          await off.emit('stop')
        })
      })

      describe('logs are bounded in time (fixes)', () => {
        let originalRequestStream
        before(() => {
          originalRequestStream = DockerConnection.prototype.requestStream
        })
        after(() => {
          DockerConnection.prototype.requestStream = originalRequestStream
        })

        const frame = text => {
          const payload = Buffer.from(text)
          const header = Buffer.from([1, 0, 0, 0, 0, 0, 0, 0])
          header.writeUInt32BE(payload.length, 4)
          return Buffer.concat([header, payload])
        }

        const stubBody = feed => {
          DockerConnection.prototype.requestStream = async () => {
            const body = new Readable({ read() {} })
            body.headers = { 'content-type': 'application/vnd.docker.multiplexed-stream' }
            feed(body)
            return body
          }
        }

        it('a trickling body: cut at logsTimeout, entries kept, the pooled connection released', async () => {
          const short = await createDocker({
            redis,
            crypto,
            config: { docker: { logsTimeout: '500ms', logsIdleTimeout: '10s', maxConnections: 1 } },
          })
          try {
            const a = await seed({})
            const b = await seed({ host: '192.0.2.11' })
            let timer
            stubBody(body => {
              body.push(frame('2026-09-24T12:00:00Z first\n'))
              timer = setInterval(() => body.push(frame('2026-09-24T12:00:01Z tick\n')), 100)
            })
            const start = Date.now()
            const logs = await short.docker.getDockerContainerLogs(`${a.id}_${'a'.repeat(64)}`)
            clearInterval(timer)
            assert.ok(Date.now() - start < 2e3)
            assert.equal(logs.timedOut, true)
            assert.equal(logs.truncated, true)
            assert.equal(logs.entries[0].message, 'first')
            assert.ok(logs.entries.length >= 2)
            // the only pool slot is free again: another engine can be used
            stubBody(body => body.push(null))
            const other = await short.docker.getDockerContainerLogs(`${b.id}_${'a'.repeat(64)}`)
            assert.deepEqual(other.entries, [])
          } finally {
            await short.emit('stop')
          }
        })

        it('a stalled body: cut at logsIdleTimeout', async () => {
          const short = await createDocker({
            redis,
            crypto,
            config: { docker: { logsTimeout: '10s', logsIdleTimeout: '300ms' } },
          })
          try {
            const a = await seed({})
            stubBody(body => body.push(frame('2026-09-24T12:00:00Z only\n')))
            const start = Date.now()
            const logs = await short.docker.getDockerContainerLogs(`${a.id}_${'a'.repeat(64)}`)
            assert.ok(Date.now() - start < 2e3)
            assert.deepEqual(
              { timedOut: logs.timedOut, truncated: logs.truncated, messages: logs.entries.map(_ => _.message) },
              { timedOut: true, truncated: true, messages: ['only'] }
            )
          } finally {
            await short.emit('stop')
          }
        })

        it('an invalid frame followed by more data fails instead of hanging', async () => {
          const a = await seed({})
          stubBody(body => {
            body.push(frame('2026-09-24T12:00:00Z ok\n'))
            setTimeout(() => body.push(Buffer.from([7, 0, 0, 0, 0, 0, 0, 1, 120])), 10)
            setTimeout(() => body.push(frame('2026-09-24T12:00:01Z more\n')), 30)
          })
          await assert.rejects(docker.getDockerContainerLogs(`${a.id}_${'a'.repeat(64)}`), /unknown stream type 7/)
          await emit('stop')
        })

        it('a complete body: timedOut false', async () => {
          const a = await seed({})
          stubBody(body => {
            body.push(frame('2026-09-24T12:00:00Z done\n'))
            body.push(null)
          })
          const logs = await docker.getDockerContainerLogs(`${a.id}_${'a'.repeat(64)}`)
          assert.equal(logs.timedOut, false)
          assert.equal(logs.truncated, false)
          await emit('stop')
        })
      })

      describe('config import (fixes)', () => {
        const getImporter = app => app.configManagers.dockerEngines.imp

        it('validates everything before writing, then writes with new revisions', async () => {
          const { app, docker: d } = await createDocker({ redis, crypto, config: {} })
          const existing = await seed({ vm: VM_ID })
          const record = {
            id: 'imported-1',
            host: '192.0.2.30',
            username: 'u',
            password: 'p',
            hostKeyFingerprint: FINGERPRINT,
            revision: 0,
          }
          for (const invalid of [
            [record, { ...record, id: 'imported-2', port: 'x' }],
            [record, { id: 'imported-2', username: 'u' }],
            [record, { ...record, id: 'imported-2', unknown: 1 }],
            [record, record],
          ]) {
            await assert.rejects(getImporter(app)(invalid), { code: 10 })
          }
          // a VM taken by an engine which is not imported
          await assert.rejects(getImporter(app)([record, { ...record, id: 'imported-2', vm: VM_ID }]), { code: 16 })
          assert.equal((await d.getAllDockerEngines()).length, 1, 'nothing written')

          await getImporter(app)([record, { ...existing, label: 'moved', vm: VM_ID }])
          const imported = await seedDb.first('imported-1')
          assert.match(imported.revision, /^[0-9a-f]{16}$/)
          assert.equal(imported.port, 22)
          assert.equal((await seedDb.first(existing.id)).label, 'moved')
        })
      })

      describe('containers: parameters checked before any connection', () => {
        it('getDockerContainers()', async () => {
          await assert.rejects(docker.getDockerContainers(), { code: 10 })
          await assert.rejects(docker.getDockerContainers({ engines: ['nope'] }), noSuchObject.is)
          const { id } = await seed({})
          await assert.rejects(docker.getDockerContainers({ engines: [id], stats: true }), { code: 10 })
          const empty = await docker.getDockerContainers({ engines: [] })
          assert.deepEqual(empty.containers, [])
          assert.deepEqual(empty.errors, [])
          assert.equal(typeof empty.asOf, 'number')
        })

        it('getDockerContainer(): malformed id or unknown engine → noSuchObject', async () => {
          const dockerId = 'a'.repeat(64)
          for (const id of ['nope', `nope_${dockerId}`, 'x_abc', `${VM_ID}${dockerId}`]) {
            await assert.rejects(docker.getDockerContainer(id), noSuchObject.is, id)
          }
        })

        it('runDockerContainerAction() and deleteDockerContainer(): unknown action or container', async () => {
          const { id } = await seed({})
          const containerId = `${id}_${'a'.repeat(64)}`
          await assert.rejects(docker.runDockerContainerAction(containerId, 'kill'), { code: 10 })
          await assert.rejects(docker.runDockerContainerAction(`nope_${'a'.repeat(64)}`, 'start'), noSuchObject.is)
          await assert.rejects(docker.deleteDockerContainer(`nope_${'a'.repeat(64)}`), noSuchObject.is)
        })

        it('getDockerContainerLogs(): bounded tail, at least one stream', async () => {
          const { id } = await seed({})
          const containerId = `${id}_${'a'.repeat(64)}`
          for (const opts of [{ tail: 10001 }, { tail: -1 }, { tail: 1.5 }, { stdout: false, stderr: false }]) {
            await assert.rejects(docker.getDockerContainerLogs(containerId, opts), { code: 10 }, JSON.stringify(opts))
          }
          await assert.rejects(docker.getDockerContainerLogs(containerId, { since: 'not a date' }), { code: 10 })
        })
      })
    })
  }
})

// ===================================================================

describe('Docker mixin against a real SSH server and dockerd', { skip: skipIntegration }, () => {
  let redis, docker, emit, privateKey, badPrivateKey, tmp

  const baseParams = () => ({
    host: sshHost,
    port: Number(sshPort),
    username: sshUser,
    privateKey,
    socketPath,
  })

  const createTrusted = extra =>
    docker.createDockerEngine({ ...baseParams(), hostKeyFingerprint: fingerprint, ...extra })

  // writes a record directly, bypassing the checks of updateDockerEngine()
  // (which would refuse parameters it cannot connect with)
  const writeRaw = async (id, props) => {
    const db = new DockerEngines({ connection: redis, namespace: NAMESPACE, indexes: ['vm'] })
    await db.update({ ...(await db.first(id)), ...props })
  }

  before(async () => {
    privateKey = readFileSync(keyPath, 'utf8')
    badPrivateKey = readFileSync(badKeyPath, 'utf8')
    tmp = mkdtempSync(join(tmpdir(), 'xo-docker-test-'))
    redis = createClient({ url: redisUrl })
    await redis.connect()
    await redis.select(Number(redisDb) + 1)
    await redis.flushDb()
    ;({ docker, emit } = await createDocker({
      redis,
      // the cooldown is tested separately, it would make the failures of a
      // test leak into the next ones
      config: { docker: { connectTimeout: '5s', requestTimeout: '15s', authFailureCooldown: '0s' } },
    }))
  })

  after(async () => {
    await emit?.('stop')
    await redis?.flushDb()
    await redis?.quit()
    if (tmp !== undefined) {
      rmSync(tmp, { recursive: true, force: true })
    }
  })

  describe('host key: TOFU', () => {
    beforeEach(async () => {
      for (const { id } of await docker.getAllDockerEngines()) {
        await docker.deleteDockerEngine(id)
      }
    })

    it('without fingerprint: HOST_KEY_UNKNOWN with the observed key, nothing saved; then accepted and pinned', async () => {
      await assert.rejects(docker.createDockerEngine(baseParams()), error => {
        assert.equal(error.code, 'HOST_KEY_UNKNOWN')
        assert.equal(error.data.fingerprint, fingerprint)
        assert.equal(error.data.algorithm, 'ssh-ed25519')
        return true
      })
      assert.deepEqual(await docker.getAllDockerEngines(), [])

      const engine = await docker.createDockerEngine({ ...baseParams(), acceptUnknownHostKey: true })
      assert.equal(engine.hostKeyFingerprint, fingerprint)
      assert.equal(engine.hostKeyAlgorithm, 'ssh-ed25519')
      assertNoSecrets(engine)
      // acceptUnknownHostKey is transient
      const raw = await new DockerEngines({ connection: redis, namespace: NAMESPACE, indexes: ['vm'] }).first(engine.id)
      assert.equal(raw.hostKeyFingerprint, fingerprint)
      assert.equal('acceptUnknownHostKey' in raw, false)

      // the pin is verified afterwards
      assert.equal((await docker.getDockerEngineInfo(engine.id)).status, 'connected')
    })

    it('a pasted fingerprint is verified on create (with or without the SHA256: prefix)', async () => {
      await assert.rejects(createTrusted({ hostKeyFingerprint: WRONG_FINGERPRINT }), error => {
        assert.equal(error.code, 'HOST_KEY_MISMATCH')
        assert.equal(error.data.actual, fingerprint)
        return true
      })
      assert.deepEqual(await docker.getAllDockerEngines(), [])
      const engine = await createTrusted({ hostKeyFingerprint: fingerprint.slice(7) })
      assert.equal(engine.hostKeyFingerprint, fingerprint)
      assert.equal(engine.hostKeyAlgorithm, 'ssh-ed25519')
    })

    it('a wrong pasted fingerprint on update is refused, nothing saved (fixes)', async () => {
      const { id } = await createTrusted()
      await assert.rejects(docker.updateDockerEngine(id, { hostKeyFingerprint: WRONG_FINGERPRINT }), error => {
        assert.equal(error.code, 'HOST_KEY_MISMATCH')
        assert.equal(error.data.actual, fingerprint)
        return true
      })
      assert.equal((await docker.getDockerEngine(id)).hostKeyFingerprint, fingerprint)
    })

    it('a changed host key → info status host-key-mismatch', async () => {
      const { id } = await createTrusted()
      await writeRaw(id, { hostKeyFingerprint: WRONG_FINGERPRINT })
      const info = await docker.getDockerEngineInfo(id)
      assert.equal(info.status, 'host-key-mismatch')
      assert.equal(info.error.code, 'HOST_KEY_MISMATCH')
      assert.equal(info.error.data.actual, fingerprint)
    })

    it('clearing the pin re-runs TOFU on update', async () => {
      const { id } = await createTrusted()
      await assert.rejects(docker.updateDockerEngine(id, { hostKeyFingerprint: null }), isCode('HOST_KEY_UNKNOWN'))
      assert.equal((await docker.getDockerEngine(id)).hostKeyFingerprint, fingerprint, 'nothing saved')
      const engine = await docker.updateDockerEngine(id, { hostKeyFingerprint: null, acceptUnknownHostKey: true })
      assert.equal(engine.hostKeyFingerprint, fingerprint)
    })

    it('strictHostKeyChecking = false: an unknown key is accepted and pinned', async () => {
      const lax = await createDocker({ redis, config: { docker: { strictHostKeyChecking: false } } })
      try {
        const engine = await lax.docker.createDockerEngine(baseParams())
        assert.equal(engine.hostKeyFingerprint, fingerprint)
        // still pinned: a mismatch is refused
        await assert.rejects(
          lax.docker.updateDockerEngine(engine.id, { hostKeyFingerprint: WRONG_FINGERPRINT }),
          isCode('HOST_KEY_MISMATCH')
        )
        await writeRaw(engine.id, { hostKeyFingerprint: WRONG_FINGERPRINT })
        assert.equal((await lax.docker.getDockerEngineInfo(engine.id)).status, 'host-key-mismatch')
      } finally {
        await lax.emit('stop')
      }
    })
  })

  describe('read-only methods', () => {
    let engineId

    before(async () => {
      engineId = (await createTrusted({ label: 'local rootless' })).id
    })

    it('testDockerEngine()', async () => {
      const result = await docker.testDockerEngine(engineId)
      assert.deepEqual(
        { ...result, engineVersion: typeof result.engineVersion },
        {
          ok: true,
          apiVersion: '1.43',
          engineVersion: 'string',
          fingerprint,
          algorithm: 'ssh-ed25519',
        }
      )
    })

    it('getDockerEngineInfo(): status connected, counters, compose summary', async () => {
      const before = Date.now()
      const info = await docker.getDockerEngineInfo(engineId)
      assert.equal(info.status, 'connected')
      assert.ok(info.asOf >= before)
      assert.match(info.engineVersion, /^\d+\.\d+/)
      assert.equal(typeof info.daemonId, 'string')
      assert.equal(info.apiVersion, '1.43', 'the negotiated version')
      assert.match(info.daemonApiVersion, /^1\.\d+$/)
      assert.equal('id' in info, false)
      assert.ok(info.containers.total >= 7)
      assert.ok(info.containers.running >= 1)
      assert.ok(info.containers.paused >= 1)
      assert.equal(info.rootless, true)
      const demo = info.compose.projects.find(_ => _.name === 'demo')
      assert.deepEqual(demo, { name: 'demo', containers: 2, running: 2 })

      // the pooled connection is reported passively
      assert.equal((await docker.getDockerEngine(engineId)).connectionStatus, 'connected')
    })

    it('getDockerContainers(): composite ids, relations, tier 2 details for running containers, cache', async () => {
      const { containers, errors, asOf } = await docker.getDockerContainers({ engines: [engineId] })
      assert.deepEqual(errors, [])
      assert.equal(typeof asOf, 'number')
      const byName = Object.fromEntries(containers.map(_ => [_.name, _]))
      for (const name of ['xo-nginx', 'xo-exited', 'xo-tty', 'xo-paused', 'xo-healthy', 'xo-unhealthy', 'demo-web-1']) {
        assert.ok(byName[name] !== undefined, name)
      }
      const nginx = byName['xo-nginx']
      assert.match(nginx.dockerId, /^[0-9a-f]{64}$/)
      assert.equal(nginx.id, `${engineId}_${nginx.dockerId}`)
      assert.equal(nginx.$engine, engineId)
      assert.equal('$VM' in nginx, false)
      assert.equal('$pool' in nginx, false)
      assert.equal(nginx.state, 'running')
      assert.match(nginx.status, /^Up /)
      assert.equal(typeof nginx.startedAt, 'number', 'running containers are inspected')
      assert.equal(nginx.tty, false)
      assert.deepEqual(
        nginx.ports.find(_ => _.publicPort === 8080),
        { ip: '0.0.0.0', privatePort: 80, publicPort: 8080, protocol: 'tcp' }
      )
      assert.equal(byName['xo-exited'].exitCode, 3)
      assert.equal(byName['xo-exited'].startedAt, undefined, 'stopped containers are not inspected')
      assert.equal(byName['xo-healthy'].health, 'healthy')
      assert.equal(byName['demo-web-1'].compose.project, 'demo')

      // cached per engine
      assert.equal((await docker.getDockerContainers({ engines: [engineId] })).asOf, asOf)
      assert.ok((await docker.getDockerContainers({ engines: [engineId], forceRefresh: true })).asOf >= asOf)

      const running = await docker.getDockerContainers({ engines: [engineId], all: false })
      assert.ok(running.containers.every(_ => _.state === 'running' || _.state === 'paused'))
      assert.ok(!running.containers.some(_ => _.name === 'xo-exited'))
    })

    it('getDockerContainers(): partial results with per-engine errors', async () => {
      const broken = await createTrusted({ socketPath })
      await writeRaw(broken.id, { privateKey: badPrivateKey })
      const { containers, errors } = await docker.getDockerContainers({ engines: [engineId, broken.id] })
      assert.ok(containers.length >= 7)
      assert.ok(containers.every(_ => _.$engine === engineId))
      assert.deepEqual(errors, [{ $engine: broken.id, code: 'SSH_AUTH_FAILED', message: 'SSH authentication failed' }])
      await docker.deleteDockerEngine(broken.id)
    })

    it('getDockerContainer(): cached (inspected), inspected on demand, unknown', async () => {
      const { containers } = await docker.getDockerContainers({ engines: [engineId] })
      const nginx = containers.find(_ => _.name === 'xo-nginx')
      assert.deepEqual(await docker.getDockerContainer(nginx.id), nginx)

      const exited = containers.find(_ => _.name === 'xo-exited')
      const inspected = await docker.getDockerContainer(exited.id)
      assert.equal(inspected.id, exited.id)
      assert.equal(inspected.$engine, engineId)
      assert.equal(inspected.exitCode, 3)
      assert.equal(typeof inspected.finishedAt, 'number')
      assert.equal(inspected.tty, false)

      const tty = await docker.getDockerContainer(containers.find(_ => _.name === 'xo-tty').id)
      assert.equal(tty.tty, true)

      await assert.rejects(docker.getDockerContainer(`${engineId}_${'0'.repeat(64)}`), noSuchObject.is)
    })

    describe('getDockerContainerLogs()', () => {
      let ids
      before(async () => {
        const { containers } = await docker.getDockerContainers({ engines: [engineId] })
        ids = Object.fromEntries(containers.map(_ => [_.name, _.id]))
      })

      it('xo-exited: multiplexed stream, timestamps', async () => {
        const { entries, truncated, timedOut, asOf } = await docker.getDockerContainerLogs(ids['xo-exited'])
        assert.equal(truncated, false)
        assert.equal(timedOut, false)
        assert.equal(typeof asOf, 'number')
        assert.equal(entries.length, 1)
        assert.equal(entries[0].stream, 'stdout')
        assert.equal(entries[0].message, 'failing on purpose')
        assert.match(entries[0].timestamp, /^\d{4}-\d\d-\d\dT[\d:.]+Z$/)
      })

      it('xo-nginx: stdout and stderr, filters, tail', async () => {
        const { entries } = await docker.getDockerContainerLogs(ids['xo-nginx'])
        assert.ok(entries.some(_ => _.stream === 'stdout'))
        assert.ok(entries.some(_ => _.stream === 'stderr'))

        const stderr = await docker.getDockerContainerLogs(ids['xo-nginx'], { stdout: false })
        assert.ok(stderr.entries.length > 0 && stderr.entries.every(_ => _.stream === 'stderr'))

        const tail = await docker.getDockerContainerLogs(ids['xo-nginx'], { tail: 2, timestamps: false })
        assert.equal(tail.entries.length, 2)
        assert.ok(tail.entries.every(_ => _.timestamp === undefined))

        const future = await docker.getDockerContainerLogs(ids['xo-nginx'], { since: Date.now() + 3600e3 })
        assert.deepEqual(future.entries, [])
      })

      it('xo-tty: raw stream', async () => {
        const { entries } = await docker.getDockerContainerLogs(ids['xo-tty'])
        assert.deepEqual(
          entries.map(_ => [_.stream, _.message]),
          [
            ['stdout', 'tty line one'],
            ['stdout', 'tty line two'],
            ['stdout', 'no newline at end'],
          ]
        )
      })

      it('is cut at maxLogsSize', async () => {
        const small = await createDocker({ redis, config: { docker: { maxLogsSize: 200 } } })
        try {
          // same records, other mixin instance
          const { entries, truncated } = await small.docker.getDockerContainerLogs(ids['xo-nginx'])
          assert.equal(truncated, true)
          assert.ok(entries.length >= 1)
          assert.ok(entries.reduce((sum, _) => sum + _.message.length, 0) < 200)
        } finally {
          await small.emit('stop')
        }
      })

      it('unknown container → noSuchObject', async () => {
        await assert.rejects(docker.getDockerContainerLogs(`${engineId}_${'0'.repeat(64)}`), noSuchObject.is)
      })
    })
  })

  describe('container actions and removal', () => {
    const NAME = 'xo-test-mixin-actions'
    let engineId, containerId

    // straight to the local Docker socket, to create the throwaway container
    const dockerApi = (method, path, body) =>
      new Promise((resolve, reject) => {
        const req = httpRequest({ socketPath, method, path, headers: { 'content-type': 'application/json' } }, res => {
          const chunks = []
          res.on('data', chunk => chunks.push(chunk))
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString()
            resolve({ statusCode: res.statusCode, body: text === '' ? undefined : JSON.parse(text) })
          })
        })
        req.on('error', reject)
        req.end(body === undefined ? undefined : JSON.stringify(body))
      })

    const getState = async () => (await docker.getDockerContainer(containerId)).state

    before(async () => {
      engineId = (await createTrusted()).id
      await dockerApi('DELETE', `/containers/${NAME}?force=1`)
      const { statusCode, body } = await dockerApi('POST', `/containers/create?name=${NAME}`, {
        Image: 'alpine',
        Cmd: ['sleep', '1d'],
        Labels: { 'xo-test': 'throwaway' },
      })
      assert.equal(statusCode, 201, JSON.stringify(body))
      containerId = `${engineId}_${body.Id}`
    })

    after(async () => {
      await dockerApi('DELETE', `/containers/${NAME}?force=1`)
    })

    it('start, stop, restart, pause, unpause; the cached list follows', async () => {
      // warm the cache: the container is `created`
      const listed = await docker.getDockerContainers({ engines: [engineId] })
      assert.equal(listed.containers.find(_ => _.id === containerId).state, 'created')

      await docker.runDockerContainerAction(containerId, 'start')
      assert.equal(
        (await docker.getDockerContainers({ engines: [engineId] })).containers.find(_ => _.id === containerId).state,
        'running'
      )
      // already started: no-op (304)
      await docker.runDockerContainerAction(containerId, 'start')

      await docker.runDockerContainerAction(containerId, 'pause')
      assert.equal(await getState(), 'paused')
      // already paused: Docker answers 409
      await assert.rejects(docker.runDockerContainerAction(containerId, 'pause'), error => {
        assert.equal(error.code, 'DOCKER_API_ERROR')
        assert.equal(error.data.statusCode, 409)
        return true
      })
      await docker.runDockerContainerAction(containerId, 'unpause')
      assert.equal(await getState(), 'running')

      const { startedAt } = await docker.getDockerContainer(containerId)
      await docker.runDockerContainerAction(containerId, 'restart')
      const restarted = await docker.getDockerContainer(containerId)
      assert.equal(restarted.state, 'running')
      assert.ok(restarted.startedAt > startedAt)

      await docker.runDockerContainerAction(containerId, 'stop')
      assert.equal(await getState(), 'exited')
      // already stopped: no-op (304)
      await docker.runDockerContainerAction(containerId, 'stop')
    })

    it('deleteDockerContainer(): force needed while running, then gone', async () => {
      await docker.runDockerContainerAction(containerId, 'start')
      await assert.rejects(docker.deleteDockerContainer(containerId), error => {
        assert.equal(error.code, 'DOCKER_API_ERROR')
        assert.equal(error.data.statusCode, 409)
        return true
      })
      await docker.deleteDockerContainer(containerId, { force: true, removeVolumes: true })
      await assert.rejects(docker.getDockerContainer(containerId), noSuchObject.is)
      assert.equal(
        (await docker.getDockerContainers({ engines: [engineId] })).containers.some(_ => _.id === containerId),
        false
      )
      await assert.rejects(docker.deleteDockerContainer(containerId), noSuchObject.is)
      await assert.rejects(docker.runDockerContainerAction(containerId, 'start'), noSuchObject.is)
    })
  })

  describe('failures', () => {
    it('a wrong new key on update: SSH_AUTH_FAILED, nothing saved; a label-only update does not connect (fixes)', async () => {
      const { id } = await createTrusted()
      await assert.rejects(docker.updateDockerEngine(id, { privateKey: badPrivateKey }), isCode('SSH_AUTH_FAILED'))
      assert.equal((await docker.getDockerEngineInfo(id)).status, 'connected', 'the stored key is kept')
      // an unreachable engine can still be renamed
      await writeRaw(id, { port: await getClosedPort() })
      assert.equal((await docker.updateDockerEngine(id, { label: 'renamed' })).label, 'renamed')
      await docker.deleteDockerEngine(id)
    })

    it('a wrong key: info status auth-failed, then exposed passively', async () => {
      const { id } = await createTrusted()
      await writeRaw(id, { privateKey: badPrivateKey })
      const info = await docker.getDockerEngineInfo(id)
      assert.equal(info.status, 'auth-failed')
      assert.equal(info.error.code, 'SSH_AUTH_FAILED')
      const engine = await docker.getDockerEngine(id)
      assert.equal(engine.connectionStatus, 'error')
      assert.deepEqual(engine.error, { code: 'SSH_AUTH_FAILED', message: 'SSH authentication failed' })
      const test = await docker.testDockerEngine(id)
      assert.equal(test.ok, false)
      assert.equal(test.error.code, 'SSH_AUTH_FAILED')
      assert.equal(test.diagnostic, undefined)
      await docker.deleteDockerEngine(id)
    })

    it('a wrong key on create: SSH_AUTH_FAILED, nothing saved', async () => {
      const count = (await docker.getAllDockerEngines()).length
      await assert.rejects(createTrusted({ privateKey: badPrivateKey }), isCode('SSH_AUTH_FAILED'))
      assert.equal((await docker.getAllDockerEngines()).length, count)
    })

    describe('Docker socket diagnostics (socket probe)', () => {
      let engineId
      before(async () => {
        engineId = (await createTrusted()).id
      })

      // an update to a wrong socket fails with the diagnostic, then the test
      // of a record with this socket gives the same one
      const diagnose = async path => {
        let diagnostic
        const previous = (await docker.getDockerEngine(engineId)).socketPath
        await assert.rejects(docker.updateDockerEngine(engineId, { socketPath: path }), error => {
          assert.equal(error.code, 'DOCKER_SOCKET_UNREACHABLE')
          diagnostic = error.data.diagnostic
          return true
        })
        assert.equal((await docker.getDockerEngine(engineId)).socketPath, previous, 'nothing saved')
        await writeRaw(engineId, { socketPath: path })
        const result = await docker.testDockerEngine(engineId)
        assert.equal(result.ok, false)
        assert.equal(result.error.code, 'DOCKER_SOCKET_UNREACHABLE')
        assert.equal(result.fingerprint, fingerprint)
        assert.deepEqual(result.diagnostic, diagnostic)
        return result.diagnostic
      }

      it('socket missing', async () => {
        const diagnostic = await diagnose(join(tmp, "does not ' exist.sock"))
        assert.equal(diagnostic.code, 'socket-missing')
        // the steady state reports the generic error
        const info = await docker.getDockerEngineInfo(engineId)
        assert.equal(info.status, 'unreachable')
        assert.equal(info.error.code, 'DOCKER_SOCKET_UNREACHABLE')
      })

      it('not a socket', async () => {
        const path = join(tmp, 'file')
        writeFileSync(path, '')
        assert.equal((await diagnose(path)).code, 'not-a-socket')
      })

      it('permission denied', async () => {
        const path = join(tmp, 'denied.sock')
        const server = createServer()
        await new Promise(resolve => server.listen(path, resolve))
        try {
          chmodSync(path, 0)
          assert.equal((await diagnose(path)).code, 'permission-denied')
        } finally {
          await new Promise(resolve => server.close(resolve))
        }
      })

      it('socket accessible: forwarding disabled (or nothing listening) is the remaining cause', async () => {
        // a socket bound but not listening: accessible, connection refused
        const path = join(tmp, 'stale.sock')
        execFileSync('python3', ['-c', 'import socket, sys; socket.socket(socket.AF_UNIX).bind(sys.argv[1])', path])
        assert.equal((await diagnose(path)).code, 'forwarding-disabled')
      })

      it(
        'AllowStreamLocalForwarding no: create fails with the forwarding-disabled diagnostic',
        { skip: noForwardingPort === undefined ? 'XO_DOCKER_TEST_SSH_NOFWD_PORT is not set' : false },
        async () => {
          await assert.rejects(
            docker.createDockerEngine({ ...baseParams(), port: Number(noForwardingPort), acceptUnknownHostKey: true }),
            error => {
              assert.equal(error.code, 'DOCKER_SOCKET_UNREACHABLE')
              assert.equal(error.data.diagnostic.code, 'forwarding-disabled')
              return true
            }
          )
        }
      )
    })
  })

  it('cooldown after an authentication failure: same parameters refused, fixed ones accepted (fixes)', async () => {
    const instance = await createDocker({ redis, config: { docker: { authFailureCooldown: '3s' } } })
    try {
      const params = { ...baseParams(), hostKeyFingerprint: fingerprint, privateKey: badPrivateKey }
      await assert.rejects(instance.docker.createDockerEngine(params), isCode('SSH_AUTH_FAILED'))
      await assert.rejects(instance.docker.createDockerEngine(params), error => {
        assert.equal(error.code, 'SSH_COOLDOWN')
        assert.equal(error.data.lastCode, 'SSH_AUTH_FAILED')
        assert.ok(error.data.retryAfter <= 3)
        return true
      })
      const { id } = await instance.docker.createDockerEngine({ ...params, privateKey })
      await instance.docker.deleteDockerEngine(id)
    } finally {
      await instance.emit('stop')
    }
  })

  it('the stop hook closes the pooled connections', async () => {
    const instance = await createDocker({ redis, config: {} })
    const { id } = await instance.docker.createDockerEngine({ ...baseParams(), hostKeyFingerprint: fingerprint })
    assert.equal((await instance.docker.getDockerEngineInfo(id)).status, 'connected')
    assert.equal((await instance.docker.getDockerEngine(id)).connectionStatus, 'connected')
    await instance.emit('stop')
    assert.equal((await instance.docker.getDockerEngine(id)).connectionStatus, 'idle')
    await instance.docker.deleteDockerEngine(id)
  })
})
