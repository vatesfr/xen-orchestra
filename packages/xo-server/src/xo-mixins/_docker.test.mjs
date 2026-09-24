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
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, beforeEach, describe, it } from 'node:test'
import { parseDuration } from '@vates/parse-duration'
import { createClient } from 'redis'
import { noSuchObject } from 'xo-common/api-errors.js'

import CryptoCredentials from './crypto-credentials.mjs'
import Docker from './docker.mjs'
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

// ===================================================================

describe('Docker mixin: engines CRUD (redis, no SSH)', { skip: skipRedis }, () => {
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
      let docker, emit, seedDb

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
        await redis.flushDb()
        const crypto = encrypted ? await createCrypto() : null
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

        it('replaces a secret and bumps the revision', async () => {
          const { id } = await seed({})
          await docker.updateDockerEngine(id, { privateKey: 'new-key' })
          const raw = await readRaw(id)
          assert.equal(raw.privateKey, 'new-key')
          assert.equal(raw.revision, 1)
          await docker.updateDockerEngine(id, { host: '192.0.2.11' })
          assert.equal((await readRaw(id)).revision, 2)
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

        it('a pasted fingerprint replaces the pin and forgets the algorithm', async () => {
          const { id } = await seed({})
          const engine = await docker.updateDockerEngine(id, { hostKeyFingerprint: WRONG_FINGERPRINT.slice(7) })
          assert.equal(engine.hostKeyFingerprint, WRONG_FINGERPRINT)
          assert.equal('hostKeyAlgorithm' in engine, false)
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

        // an update of the connection settings forgets the failure
        await docker.updateDockerEngine(id, { port: 2222 })
        assert.equal((await docker.getDockerEngine(id)).connectionStatus, 'idle')
        await emit('stop')
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
      config: { docker: { connectTimeout: '5s', requestTimeout: '15s' } },
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

    it('a changed host key → info status host-key-mismatch', async () => {
      const { id } = await createTrusted()
      await docker.updateDockerEngine(id, { hostKeyFingerprint: WRONG_FINGERPRINT })
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
        await lax.docker.updateDockerEngine(engine.id, { hostKeyFingerprint: WRONG_FINGERPRINT })
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
      await docker.updateDockerEngine(broken.id, { privateKey: badPrivateKey })
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
        const { entries, truncated, asOf } = await docker.getDockerContainerLogs(ids['xo-exited'])
        assert.equal(truncated, false)
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

  describe('failures', () => {
    it('a wrong key: info status auth-failed, then exposed passively', async () => {
      const { id } = await createTrusted()
      await docker.updateDockerEngine(id, { privateKey: badPrivateKey })
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

      const diagnose = async path => {
        await docker.updateDockerEngine(engineId, { socketPath: path })
        const result = await docker.testDockerEngine(engineId)
        assert.equal(result.ok, false)
        assert.equal(result.error.code, 'DOCKER_SOCKET_UNREACHABLE')
        assert.equal(result.fingerprint, fingerprint)
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
