import assert from 'node:assert/strict'
import { EventEmitter, once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { connect as netConnect } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  compareApiVersions,
  computeFingerprint,
  DockerConnection,
  getKeyAlgorithm,
  MAX_API_VERSION,
  negotiateApiVersion,
  normalizeFingerprint,
  verifyHostKey,
} from './connection.mjs'
import {
  DOCKER_API_ERROR,
  DOCKER_API_VERSION_UNSUPPORTED,
  DOCKER_SOCKET_UNREACHABLE,
  HOST_KEY_MISMATCH,
  HOST_KEY_UNKNOWN,
  SSH_AUTH_FAILED,
  TIMEOUT,
} from './errors.mjs'

const { after, before, beforeEach, describe, it } = test

// generated with `ssh-keygen -t ed25519`, fingerprints from `ssh-keygen -lf`
const ED25519_KEY = 'AAAAC3NzaC1lZDI1NTE5AAAAIDIKbtnnl0BlnKuKjKJoUJOsCWA910CX/XMkuMh4Ornr'
const ED25519_FINGERPRINT = 'SHA256:xo1L4JygV0hw5XQ+LHcn2iI3C9GvGsDRBNh+q7iQazs'
const RSA_KEY =
  'AAAAB3NzaC1yc2EAAAADAQABAAAAgQDgLtqnXodwWvIQMujeXcGidrnppkGG5W+gk9bZHwi054aQfV3LNEZtq7wctk2EYeyVzZgFmcGOsfhu+L578Xe09zj92SovHsu9a+V1FxjAbRrnZMdG4bGSXyimSrGyM1XdzSs6dmh7gaX4DY2+peLkoAtObD6WwpvK0tfhYOFpkQ=='
const RSA_FINGERPRINT = 'SHA256:oADNJ8NlHsMYm0YHHYG3FN/qcWHowk7e/7L9V/Rm6yk'

describe('host key fingerprint', () => {
  it('matches ssh-keygen -lf', () => {
    assert.equal(computeFingerprint(Buffer.from(ED25519_KEY, 'base64')), ED25519_FINGERPRINT)
    assert.equal(computeFingerprint(Buffer.from(RSA_KEY, 'base64')), RSA_FINGERPRINT)
  })

  it('extracts the key algorithm', () => {
    assert.equal(getKeyAlgorithm(Buffer.from(ED25519_KEY, 'base64')), 'ssh-ed25519')
    assert.equal(getKeyAlgorithm(Buffer.from(RSA_KEY, 'base64')), 'ssh-rsa')
    assert.equal(getKeyAlgorithm(Buffer.from([0, 0, 0, 10, 1])), undefined)
  })

  it('normalizes user input', () => {
    assert.equal(normalizeFingerprint(' xo1L4JygV0hw5XQ+LHcn2iI3C9GvGsDRBNh+q7iQazs= '), ED25519_FINGERPRINT)
    assert.equal(normalizeFingerprint(ED25519_FINGERPRINT), ED25519_FINGERPRINT)
  })

  it('verifyHostKey() accepts the expected key', () => {
    assert.deepEqual(verifyHostKey(Buffer.from(ED25519_KEY, 'base64'), { expectedFingerprint: ED25519_FINGERPRINT }), {
      fingerprint: ED25519_FINGERPRINT,
      algorithm: 'ssh-ed25519',
    })
  })

  it('verifyHostKey() rejects a missing fingerprint with HOST_KEY_UNKNOWN', () => {
    assert.throws(
      () => verifyHostKey(Buffer.from(ED25519_KEY, 'base64'), {}),
      error =>
        error.code === HOST_KEY_UNKNOWN &&
        error.data.fingerprint === ED25519_FINGERPRINT &&
        error.data.algorithm === 'ssh-ed25519'
    )
  })

  it('verifyHostKey() accepts an unknown key when asked to', () => {
    assert.equal(
      verifyHostKey(Buffer.from(ED25519_KEY, 'base64'), { acceptUnknownHostKey: true }).fingerprint,
      ED25519_FINGERPRINT
    )
  })

  it('verifyHostKey() rejects another key with HOST_KEY_MISMATCH', () => {
    assert.throws(
      () => verifyHostKey(Buffer.from(ED25519_KEY, 'base64'), { expectedFingerprint: RSA_FINGERPRINT }),
      error =>
        error.code === HOST_KEY_MISMATCH &&
        error.data.expected === RSA_FINGERPRINT &&
        error.data.actual === ED25519_FINGERPRINT
    )
  })
})

describe('DockerConnection (real ssh2 client, no network)', () => {
  it('fails with SSH_AUTH_FAILED on an unparsable private key, without leaking it', async () => {
    const connection = new DockerConnection({
      host: '127.0.0.1',
      username: 'user',
      privateKey: 'not a key: TOP-SECRET',
      passphrase: 'hunter2',
    })
    await assert.rejects(connection.connect(), error => {
      assert.equal(error.code, SSH_AUTH_FAILED)
      assert.doesNotMatch(
        JSON.stringify({ ...error, cause: error.cause, message: error.cause.message }),
        /TOP-SECRET|hunter2/
      )
      return true
    })
    // must not wait for a `close` which will never come
    const start = Date.now()
    await connection.close()
    assert.ok(Date.now() - start < 1e3)
  })
})

describe('negotiateApiVersion()', () => {
  it('compares versions numerically', () => {
    assert.ok(compareApiVersions('1.9', '1.10') < 0)
    assert.ok(compareApiVersions('1.43', '1.43') === 0)
    assert.ok(compareApiVersions('2.0', '1.99') > 0)
  })

  it('uses the lowest of the max versions', () => {
    assert.equal(negotiateApiVersion({ ApiVersion: '1.47', MinAPIVersion: '1.24' }), MAX_API_VERSION)
    assert.equal(negotiateApiVersion({ ApiVersion: '1.41', MinAPIVersion: '1.12' }), '1.41')
  })

  it('rejects a too old daemon', () => {
    assert.throws(() => negotiateApiVersion({ ApiVersion: '1.23' }), { code: DOCKER_API_VERSION_UNSUPPORTED })
  })

  it('rejects a daemon which does not support our max version', () => {
    assert.throws(() => negotiateApiVersion({ ApiVersion: '1.51', MinAPIVersion: '1.44' }), {
      code: DOCKER_API_VERSION_UNSUPPORTED,
    })
  })

  it('rejects an invalid answer', () => {
    assert.throws(() => negotiateApiVersion({}), { code: DOCKER_API_VERSION_UNSUPPORTED })
  })
})

/**
 * Minimal stand-in for `ssh2.Client`: channels are plain connections to a
 * local Unix socket.
 */
class FakeSshClient extends EventEmitter {
  channelsOpened = 0
  connectConfig
  openError

  connect(config) {
    this.connectConfig = config
    process.nextTick(() => this.emit('ready'))
    return this
  }

  openssh_forwardOutStreamLocal(socketPath, cb) {
    if (this.openError !== undefined) {
      process.nextTick(cb, this.openError)
      return this
    }
    ++this.channelsOpened
    const socket = netConnect(socketPath)
    socket.once('connect', () => cb(undefined, socket))
    socket.once('error', cb)
    return this
  }

  end() {
    process.nextTick(() => this.emit('close'))
    return this
  }
}

describe('DockerConnection (fake daemon)', () => {
  let dir, socketPath, server, handler, requests

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'xo-docker-test-'))
    socketPath = join(dir, 'docker.sock')
    server = createServer((req, res) => {
      requests.push(req.url)
      handler(req, res)
    })
    server.listen(socketPath)
    await once(server, 'listening')
  })

  after(async () => {
    server.closeAllConnections()
    server.close()
    await rm(dir, { recursive: true, force: true })
  })

  const json = (res, statusCode, body) => {
    res.writeHead(statusCode, { 'content-type': 'application/json' })
    res.end(JSON.stringify(body))
  }

  const defaultHandler = (req, res) => {
    if (req.url === '/version') {
      return json(res, 200, { Version: '27.3.1', ApiVersion: '1.47', MinAPIVersion: '1.24' })
    }
    if (req.url.startsWith(`/v${MAX_API_VERSION}/containers/json`)) {
      return json(res, 200, [{ Id: 'abc', Names: ['/foo'] }])
    }
    if (req.url === `/v${MAX_API_VERSION}/containers/missing/json`) {
      return json(res, 404, { message: 'No such container: missing' })
    }
    if (req.url === `/v${MAX_API_VERSION}/echo`) {
      const chunks = []
      req.on('data', chunk => chunks.push(chunk))
      req.on('end', () => json(res, 201, { method: req.method, body: JSON.parse(Buffer.concat(chunks)) }))
      return
    }
    if (req.url === `/v${MAX_API_VERSION}/logs`) {
      res.writeHead(200, { 'content-type': 'application/vnd.docker.raw-stream' })
      res.end('line 1\nline 2\n')
      return
    }
    if (req.url === `/v${MAX_API_VERSION}/hang`) {
      // never answers
      return
    }
    res.writeHead(500)
    res.end()
  }

  beforeEach(() => {
    handler = defaultHandler
    requests = []
  })

  const createConnection = (opts = {}) => {
    const client = new FakeSshClient()
    const connection = new DockerConnection(
      {
        host: 'fake',
        username: 'user',
        password: 'secret',
        hostKeyFingerprint: ED25519_FINGERPRINT,
        socketPath,
        requestTimeout: 1e3,
        ...opts,
      },
      { createClient: () => client }
    )
    return { client, connection }
  }

  it('configures ssh2 as expected', async () => {
    const { client, connection } = createConnection()
    await connection.connect()
    const { connectConfig } = client
    assert.equal(connectConfig.port, 22)
    assert.equal(connectConfig.keepaliveInterval, 10e3)
    assert.equal(connectConfig.keepaliveCountMax, 3)
    assert.equal(connectConfig.hostHash, undefined)
    assert.equal(typeof connectConfig.hostVerifier, 'function')
    assert.equal(connectConfig.hostVerifier(Buffer.from(ED25519_KEY, 'base64')), true)
    assert.equal(connectConfig.hostVerifier(Buffer.from(RSA_KEY, 'base64')), false)
    assert.equal(connection.observedHostKey.fingerprint, RSA_FINGERPRINT)
    await connection.close()
  })

  it('negotiates the API version once and prefixes paths', async () => {
    const { connection } = createConnection()
    const results = await Promise.all([
      connection.request({ path: '/containers/json', query: { all: 1, filters: { status: ['running'] } } }),
      connection.request({ path: '/containers/json' }),
      connection.request({ path: '/containers/json' }),
    ])
    assert.equal(connection.apiVersion, MAX_API_VERSION)
    assert.equal(connection.engineVersion, '27.3.1')
    assert.equal(requests.filter(url => url === '/version').length, 1)
    assert.equal(
      requests.find(url => url.includes('filters')),
      `/v${MAX_API_VERSION}/containers/json?all=1&filters=%7B%22status%22%3A%5B%22running%22%5D%7D`
    )
    for (const { statusCode, body } of results) {
      assert.equal(statusCode, 200)
      assert.deepEqual(body, [{ Id: 'abc', Names: ['/foo'] }])
    }
    await connection.close()
  })

  it('uses the daemon version when lower than ours', async () => {
    handler = (req, res) =>
      req.url === '/version'
        ? json(res, 200, { Version: '20.10.0', ApiVersion: '1.41', MinAPIVersion: '1.12' })
        : json(res, 200, { url: req.url })
    const { connection } = createConnection()
    const { body } = await connection.request({ path: '/info' })
    assert.equal(body.url, '/v1.41/info')
    await connection.close()
  })

  it('fails with DOCKER_API_VERSION_UNSUPPORTED and retries negotiation later', async () => {
    handler = (req, res) => json(res, 200, { Version: '1.11', ApiVersion: '1.23' })
    const { connection } = createConnection()
    await assert.rejects(connection.connect(), { code: DOCKER_API_VERSION_UNSUPPORTED })
    await assert.rejects(connection.request({ path: '/info' }), { code: DOCKER_API_VERSION_UNSUPPORTED })
    assert.equal(requests.filter(url => url === '/version').length, 2)
    await connection.close()
  })

  it('reuses channels across sequential requests (keep-alive)', async () => {
    const { client, connection } = createConnection()
    for (let i = 0; i < 5; ++i) {
      await connection.request({ path: '/containers/json' })
    }
    // 1 for /version + 5 requests, all on the same channel
    assert.equal(requests.length, 6)
    assert.equal(client.channelsOpened, 1)
    await connection.close()
  })

  it('opens several channels for concurrent requests', async () => {
    const { client, connection } = createConnection()
    await connection.connect()
    await Promise.all(Array.from({ length: 10 }, () => connection.request({ path: '/containers/json' })))
    // bounded by maxSockets
    assert.ok(client.channelsOpened > 1 && client.channelsOpened <= 8, `${client.channelsOpened} channels`)
    await connection.close()
  })

  it('sends JSON bodies', async () => {
    const { connection } = createConnection()
    const { statusCode, body } = await connection.request({ method: 'POST', path: '/echo', body: { foo: 'bar' } })
    assert.equal(statusCode, 201)
    assert.deepEqual(body, { method: 'POST', body: { foo: 'bar' } })
    await connection.close()
  })

  it('returns a Buffer for non-JSON responses', async () => {
    const { connection } = createConnection()
    const { body } = await connection.request({ path: '/logs' })
    assert.ok(Buffer.isBuffer(body))
    assert.equal(body.toString(), 'line 1\nline 2\n')
    await connection.close()
  })

  it('streams responses', async () => {
    const { connection } = createConnection()
    const response = await connection.requestStream({ path: '/logs' })
    const chunks = []
    for await (const chunk of response) {
      chunks.push(chunk)
    }
    assert.equal(Buffer.concat(chunks).toString(), 'line 1\nline 2\n')
    await connection.close()
  })

  it('fails with DOCKER_API_ERROR on non-2xx', async () => {
    const { connection } = createConnection()
    await assert.rejects(connection.request({ path: '/containers/missing/json' }), error => {
      assert.equal(error.code, DOCKER_API_ERROR)
      assert.equal(error.data.statusCode, 404)
      assert.equal(error.message, 'No such container: missing')
      return true
    })
    await assert.rejects(connection.requestStream({ path: '/containers/missing/json' }), {
      code: DOCKER_API_ERROR,
      data: {
        host: 'fake',
        port: 22,
        socketPath,
        path: '/containers/missing/json',
        statusCode: 404,
        message: 'No such container: missing',
      },
    })
    await connection.close()
  })

  it('times out with TIMEOUT (requestTimeout)', async () => {
    const { connection } = createConnection({ requestTimeout: 200 })
    await connection.connect()
    const start = Date.now()
    await assert.rejects(connection.request({ path: '/hang' }), { code: TIMEOUT })
    const duration = Date.now() - start
    assert.ok(duration >= 150 && duration < 1e3, `${duration}ms`)
    await assert.rejects(connection.requestStream({ path: '/hang' }), { code: TIMEOUT })
    // the connection is still usable
    await connection.request({ path: '/containers/json' })
    await connection.close()
  })

  it('aborts with TIMEOUT (caller signal)', async () => {
    const { connection } = createConnection({ requestTimeout: 10e3 })
    await connection.connect()
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 50)
    await assert.rejects(connection.request({ path: '/hang', signal: controller.signal }), { code: TIMEOUT })
    await assert.rejects(connection.request({ path: '/hang', signal: AbortSignal.abort() }), { code: TIMEOUT })
    await connection.close()
  })

  it('maps channel open failures', async () => {
    const { client, connection } = createConnection()
    client.openError = Object.assign(new Error('(SSH) Channel open failure: open failed'), { reason: 2 })
    await assert.rejects(connection.connect(), error => {
      assert.equal(error.code, DOCKER_SOCKET_UNREACHABLE)
      assert.equal(error.data.socketPath, socketPath)
      assert.doesNotMatch(JSON.stringify(error.data), /secret/)
      return true
    })
    await connection.close()
  })

  it('reconnects after the SSH connection has been closed', async () => {
    let clients = 0
    const connection = new DockerConnection(
      { host: 'fake', username: 'user', hostKeyFingerprint: ED25519_FINGERPRINT, socketPath },
      {
        createClient: () => {
          ++clients
          return new FakeSshClient()
        },
      }
    )
    await connection.request({ path: '/containers/json' })
    await connection.close()
    await connection.request({ path: '/containers/json' })
    assert.equal(clients, 2)
    await connection.close()
  })
})
