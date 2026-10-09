import assert from 'node:assert/strict'
import { EventEmitter, once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { connect as netConnect, type Socket } from 'node:net'
import { Duplex } from 'node:stream'
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
  parseFingerprint,
  verifyHostKey,
  type DockerConnectionOptions,
} from './connection.mjs'
import {
  DOCKER_API_ERROR,
  DOCKER_API_VERSION_UNSUPPORTED,
  DOCKER_SOCKET_UNREACHABLE,
  HOST_KEY_MISMATCH,
  CONNECTION_CLOSED,
  HOST_KEY_UNKNOWN,
  SSH_AUTH_FAILED,
  TIMEOUT,
  type DockerError,
} from './errors.mjs'
import type { ClientCallback, ClientChannel, ConnectConfig } from 'ssh2'

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

  it('parses a whole ssh-keygen -l line, taking the algorithm from its type', () => {
    const fp = ED25519_FINGERPRINT
    assert.deepEqual(parseFingerprint(`256 ${fp} root@host (ED25519)`), { fingerprint: fp, algorithm: 'ssh-ed25519' })
    assert.deepEqual(parseFingerprint(` 384 ${fp} a comment with spaces (ECDSA) `), {
      fingerprint: fp,
      algorithm: 'ecdsa-sha2-nistp384',
    })
    assert.deepEqual(parseFingerprint(`3072 ${fp} no comment (RSA)`), { fingerprint: fp, algorithm: 'ssh-rsa' })
    assert.deepEqual(parseFingerprint(`256 ${fp} (ED25519)`), { fingerprint: fp, algorithm: 'ssh-ed25519' })
    assert.deepEqual(parseFingerprint(`256 ${fp} (FOO)`), { fingerprint: fp, algorithm: undefined })
    assert.deepEqual(parseFingerprint(fp.slice('SHA256:'.length) + '='), { fingerprint: fp, algorithm: undefined })
  })

  it('verifyHostKey() mentions the presented algorithm on HOST_KEY_MISMATCH', () => {
    assert.throws(() => verifyHostKey(Buffer.from(RSA_KEY, 'base64'), { expectedFingerprint: ED25519_FINGERPRINT }), {
      code: HOST_KEY_MISMATCH,
      message: /\(ssh-rsa\)/,
    })
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
      (error: DockerError) =>
        error.code === HOST_KEY_UNKNOWN &&
        error.data!.fingerprint === ED25519_FINGERPRINT &&
        error.data!.algorithm === 'ssh-ed25519'
    )
  })

  it('verifyHostKey() treats a null fingerprint as missing', () => {
    assert.throws(() => verifyHostKey(Buffer.from(ED25519_KEY, 'base64'), { expectedFingerprint: null }), {
      code: HOST_KEY_UNKNOWN,
    })
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
      (error: DockerError) =>
        error.code === HOST_KEY_MISMATCH &&
        error.data!.expected === RSA_FINGERPRINT &&
        error.data!.actual === ED25519_FINGERPRINT
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
    await assert.rejects(connection.connect(), (error: DockerError) => {
      assert.equal(error.code, SSH_AUTH_FAILED)
      assert.doesNotMatch(
        JSON.stringify({ ...error, cause: error.cause, message: error.cause!.message }),
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

  it('negotiates 1.44 with Docker 29 (MinAPIVersion 1.44)', () => {
    assert.equal(negotiateApiVersion({ ApiVersion: '1.52', MinAPIVersion: '1.44' }), '1.44')
  })

  it("uses the daemon's oldest version, with a warning, when it does not support our max version", () => {
    const symbol = Symbol.for('@xen-orchestra/log')
    const global = globalThis as unknown as Record<symbol, unknown>
    const transport = global[symbol]
    const logs: { level: number; message: string }[] = []
    global[symbol] = (log: { level: number; message: string }) => logs.push(log)
    try {
      assert.equal(negotiateApiVersion({ ApiVersion: '1.52', MinAPIVersion: '1.45' }), '1.45')
    } finally {
      global[symbol] = transport
    }
    assert.equal(logs.length, 1)
    assert.match(logs[0].message, /does not support the API version/)
  })

  it('ignores an inconsistent MinAPIVersion', () => {
    assert.equal(negotiateApiVersion({ ApiVersion: '1.52', MinAPIVersion: '1.60' }), MAX_API_VERSION)
    assert.equal(negotiateApiVersion({ ApiVersion: '1.52', MinAPIVersion: 'x' }), MAX_API_VERSION)
  })

  it('rejects an invalid answer', () => {
    assert.throws(() => negotiateApiVersion({}), { code: DOCKER_API_VERSION_UNSUPPORTED })
  })
})

/**
 * Minimal stand-in for `ssh2.Client`: channels are plain connections to a
 * local Unix socket.
 */
/**
 * Mimic an ssh2 channel whose SSH connection is gone: writes are swallowed,
 * nothing is ever received, and `destroy()` emits neither `close` nor `error`
 * (like ssh2's Channel#destroy() once the connection is lost).
 */
function createDeadChannel() {
  const channel = new Duplex({
    read() {},
    write(chunk, encoding, cb) {
      cb()
    },
  })
  channel.destroy = function (this: Duplex) {
    return this
  }
  return channel
}

// what `DockerConnection` passes to ssh2: its `hostVerifier` is synchronous
type FakeConnectConfig = Omit<ConnectConfig, 'hostVerifier'> & { hostVerifier?: (keyBlob: Buffer) => boolean }

class FakeSshClient extends EventEmitter {
  channels: Socket[] = []
  channelsOpened = 0
  connectConfig!: FakeConnectConfig
  // host key presented to the host verifier (if any)
  hostKey = Buffer.from(ED25519_KEY, 'base64')
  deadChannels = false
  // when false, end() does not emit close (unresponsive server)
  endEmitsClose = true
  openError: Error | undefined
  _sock: { destroyed: boolean; destroy: () => boolean } = {
    destroyed: false,
    destroy: () => (this._sock.destroyed = true),
  }

  connect(config: FakeConnectConfig) {
    this.connectConfig = config
    process.nextTick(() => {
      if (config.hostVerifier !== undefined && !config.hostVerifier(this.hostKey)) {
        this.emit('error', Object.assign(new Error('Host denied (verification failed)'), { level: 'handshake' }))
        this.emit('close')
        return
      }
      this.emit('ready')
    })
    return this
  }

  openssh_forwardOutStreamLocal(socketPath: string, cb: (error: Error | undefined, channel: Duplex) => void) {
    if (this.openError !== undefined) {
      process.nextTick(cb, this.openError)
      return this
    }
    ++this.channelsOpened
    if (this.deadChannels) {
      process.nextTick(cb, undefined, createDeadChannel())
      return this
    }
    const socket = netConnect(socketPath)
    this.channels.push(socket)
    socket.once('connect', () => cb(undefined, socket))
    socket.once('error', cb)
    return this
  }

  // what ssh2 does to its channels when the connection is lost: they emit
  // `close` but stay writable
  simulateDrop() {
    for (const channel of this.channels) {
      channel.removeAllListeners('data')
      channel.pause()
      channel.write = (chunk: unknown, encoding?: unknown, cb?: () => void) => {
        if (typeof encoding === 'function') cb = encoding as () => void
        cb?.()
        return true
      }
      channel.destroy = function (this: Socket) {
        return this
      }
      channel.emit('close')
    }
    this.channels = []
  }

  end() {
    if (this.endEmitsClose) {
      process.nextTick(() => this.emit('close'))
    }
    return this
  }

  // part of `SshClient`, replaced by the tests which use it
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  exec(command: string, cb: ClientCallback): this {
    throw new Error('not implemented')
  }
}

describe('DockerConnection (fake daemon)', () => {
  let dir: string, socketPath: string, server: Server
  let handler: (req: IncomingMessage, res: ServerResponse) => void, requests: string[]

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'xo-docker-test-'))
    socketPath = join(dir, 'docker.sock')
    server = createServer((req, res) => {
      requests.push(req.url!)
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

  const json = (res: ServerResponse, statusCode: number, body: unknown) => {
    res.writeHead(statusCode, { 'content-type': 'application/json' })
    res.end(JSON.stringify(body))
  }

  const defaultHandler = (req: IncomingMessage, res: ServerResponse) => {
    if (req.url === '/version') {
      return json(res, 200, { Version: '27.3.1', ApiVersion: '1.47', MinAPIVersion: '1.24' })
    }
    if (req.url!.startsWith(`/v${MAX_API_VERSION}/containers/json`)) {
      return json(res, 200, [{ Id: 'abc', Names: ['/foo'] }])
    }
    if (req.url === `/v${MAX_API_VERSION}/containers/missing/json`) {
      return json(res, 404, { message: 'No such container: missing' })
    }
    if (req.url === `/v${MAX_API_VERSION}/echo`) {
      const chunks: Buffer[] = []
      req.on('data', chunk => chunks.push(chunk))
      req.on('end', () => json(res, 201, { method: req.method, body: JSON.parse(Buffer.concat(chunks).toString()) }))
      return
    }
    if (req.url === `/v${MAX_API_VERSION}/logs`) {
      res.writeHead(200, { 'content-type': 'application/vnd.docker.raw-stream' })
      res.end('line 1\nline 2\n')
      return
    }
    if (req.url === `/v${MAX_API_VERSION}/stream`) {
      // headers, then a body which never ends
      res.writeHead(200, { 'content-type': 'application/json' })
      res.write('{}\n')
      return
    }
    if (req.url!.startsWith('/v1.40/raw') || req.url!.startsWith(`/v${MAX_API_VERSION}/raw`)) {
      return json(res, 418, { url: req.url })
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

  const createConnection = (opts: Partial<DockerConnectionOptions> = {}) => {
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

  it('exec() times out when the session channel is never opened, and drops a late one', async () => {
    const { client, connection } = createConnection({ requestTimeout: 50 })
    let callback: ClientCallback | undefined
    client.exec = (command, cb) => {
      callback = cb
      return client
    }
    await assert.rejects(connection.exec('true'), { code: TIMEOUT })
    let destroyed = false
    const late = new Duplex({ read() {}, write: (chunk, encoding, cb) => cb() })
    late.destroy = function (this: Duplex) {
      destroyed = true
      return this
    }
    callback!(undefined, late as unknown as ClientChannel)
    assert.ok(destroyed)
    await connection.close()
  })

  it('exec() ends stdin and collects the output', async () => {
    const { client, connection } = createConnection()
    let stdinEnded = false
    client.exec = (command, cb) => {
      const channel = Object.assign(
        new Duplex({ read() {}, write: (chunk, encoding, cb) => cb(), final: cb => ((stdinEnded = true), cb()) }),
        { stderr: new EventEmitter() }
      )
      process.nextTick(cb, undefined, channel as unknown as ClientChannel)
      setImmediate(() => {
        channel.push('ok\n')
        channel.emit('exit', 0)
        channel.emit('close')
      })
      return client
    }
    assert.deepEqual(await connection.exec('true'), { code: 0, signal: undefined, stdout: 'ok\n', stderr: '' })
    assert.ok(stdinEnded)
    await connection.close()
  })

  it('reports a daemon closing the channel or answering garbage as DOCKER_API_ERROR', async () => {
    const { connection } = createConnection()
    await connection.connect()
    handler = req => req.socket.destroy()
    await assert.rejects(connection.request({ path: '/containers/json' }), { code: DOCKER_API_ERROR })
    handler = req => req.socket.end('garbage\r\n\r\n')
    await assert.rejects(connection.request({ path: '/containers/json' }), { code: DOCKER_API_ERROR })
    await connection.close()
  })

  it('caps a buffered response at 8 MiB by default, maxSize allows more', async () => {
    const { connection } = createConnection({ requestTimeout: 10e3 })
    await connection.connect()
    handler = (req, res) => {
      res.writeHead(200, { 'content-type': 'application/octet-stream' })
      res.end(Buffer.alloc(9 * 1024 * 1024))
    }
    await assert.rejects(connection.request({ path: '/big' }), { code: DOCKER_API_ERROR })
    const { body } = await connection.request({ path: '/big', maxSize: 16 * 1024 * 1024 })
    assert.equal((body as Buffer).length, 9 * 1024 * 1024)
    await connection.close()
  })

  it('drops keep-alive channels closed by an SSH connection loss (still writable)', async () => {
    const { client, connection } = createConnection()
    await Promise.all([
      connection.request({ path: '/containers/json' }),
      connection.request({ path: '/containers/json' }),
    ])
    const opened = client.channelsOpened
    client.simulateDrop()
    const results = await Promise.all([
      connection.request({ path: '/containers/json' }),
      connection.request({ path: '/containers/json' }),
    ])
    for (const { statusCode } of results) {
      assert.equal(statusCode, 200)
    }
    assert.ok(client.channelsOpened > opened)
    await connection.close()
  })

  it('settles and releases the slot when a channel never emits close or error', async () => {
    const { client, connection } = createConnection({ requestTimeout: 50 })
    await connection.connect()
    client.deadChannels = true
    // the channel used by the negotiation is now dead too
    client.simulateDrop()
    // more than the max concurrency: leaked slots would make the last ones
    // wait forever in the queue (they would still TIMEOUT, so check timing)
    for (let i = 0; i < 10; ++i) {
      const start = Date.now()
      await assert.rejects(connection.request({ path: '/containers/json' }), { code: TIMEOUT })
      assert.ok(Date.now() - start < 1e3)
    }
    client.deadChannels = false
    connection.request({ path: '/containers/json' }).catch(() => {})
    // a free slot is available immediately
    const { statusCode } = await connection.request({ path: '/containers/json', signal: AbortSignal.timeout(1e3) })
    assert.equal(statusCode, 200)
    await connection.close()
  })

  it('close() destroys the SSH socket when the server does not close the connection', async () => {
    const client = new FakeSshClient()
    client.endEmitsClose = false
    const connection = new DockerConnection(
      { host: 'fake', username: 'user', hostKeyFingerprint: ED25519_FINGERPRINT, socketPath },
      { createClient: () => client, closeTimeout: 50 }
    )
    await connection.connect()
    await connection.close()
    assert.equal(client._sock.destroyed, true)
  })

  it('close() rejects queued and in-flight requests with CONNECTION_CLOSED and does not reconnect', async () => {
    handler = (req: IncomingMessage, res: ServerResponse) =>
      req.url === '/version' ? defaultHandler(req, res) : setTimeout(() => json(res, 200, {}), 300).unref()
    let clients = 0
    const connection = new DockerConnection(
      { host: 'fake', username: 'user', hostKeyFingerprint: ED25519_FINGERPRINT, socketPath, requestTimeout: 5e3 },
      {
        createClient: () => {
          ++clients
          return new FakeSshClient()
        },
      }
    )
    await connection.connect()
    const results = Array.from({ length: 12 }, () =>
      connection.request({ path: '/slow' }).then(
        () => 'ok',
        error => error.code
      )
    )
    await new Promise(resolve => setTimeout(resolve, 50))
    await connection.close()
    assert.deepEqual(await Promise.all(results), Array(12).fill(CONNECTION_CLOSED))
    assert.equal(clients, 1)
    await connection.close()
  })

  it('accepts an unknown host key via acceptUnknownHostKey, without requesting an algorithm', async () => {
    const client = new FakeSshClient()
    const connection = new DockerConnection(
      { host: 'fake', username: 'user', socketPath, acceptUnknownHostKey: true, hostKeyFingerprint: null },
      { createClient: () => client }
    )
    await connection.connect()
    assert.equal(client.connectConfig.algorithms, undefined)
    assert.equal(connection.observedHostKey!.fingerprint, ED25519_FINGERPRINT)
    await connection.close()
  })

  it('requests the configured host key algorithm', async () => {
    const { client, connection } = createConnection({
      hostKeyAlgorithm: 'ssh-rsa',
      hostKeyFingerprint: RSA_FINGERPRINT,
    })
    client.hostKey = Buffer.from(RSA_KEY, 'base64')
    await connection.connect()
    assert.deepEqual(client.connectConfig.algorithms, { serverHostKey: ['rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa'] })
    await connection.close()
  })

  it('maps a missing host key type to HOST_KEY_MISMATCH when the algorithm is pinned', async () => {
    const { client, connection } = createConnection({
      hostKeyAlgorithm: 'ssh-rsa',
      hostKeyFingerprint: RSA_FINGERPRINT,
    })
    client.connect = function (this: FakeSshClient, config: FakeConnectConfig) {
      this.connectConfig = config
      process.nextTick(() => {
        this.emit(
          'error',
          Object.assign(new Error('Handshake failed: no matching host key format'), { level: 'handshake' })
        )
        this.emit('close')
      })
      return this
    }
    await assert.rejects(connection.connect(), (error: DockerError) => {
      assert.equal(error.code, HOST_KEY_MISMATCH)
      assert.equal(error.data!.expectedAlgorithm, 'ssh-rsa')
      return true
    })
  })

  it('treats a null hostKeyFingerprint as missing (HOST_KEY_UNKNOWN)', async () => {
    const { connection } = createConnection({ hostKeyFingerprint: null })
    await assert.rejects(connection.connect(), (error: DockerError) => {
      assert.equal(error.code, HOST_KEY_UNKNOWN)
      assert.equal(error.data!.fingerprint, ED25519_FINGERPRINT)
      return true
    })
  })

  it('the caller signal interrupts a pending API version negotiation', async () => {
    handler = () => {}
    const { connection } = createConnection({ requestTimeout: 10e3 })
    const start = Date.now()
    await assert.rejects(connection.request({ path: '/info', signal: AbortSignal.timeout(100) }), { code: TIMEOUT })
    assert.ok(Date.now() - start < 1e3)
    await connection.close()
  })

  it('reports TIMEOUT (not DOCKER_API_ERROR) when aborted while reading an error body', async () => {
    handler = (req: IncomingMessage, res: ServerResponse) => {
      if (req.url === '/version') {
        return defaultHandler(req, res)
      }
      res.writeHead(500, { 'content-type': 'application/json' })
      res.write('{"message":')
      // never ends
    }
    const { connection } = createConnection({ requestTimeout: 200 })
    await connection.connect()
    await assert.rejects(connection.request({ path: '/info' }), { code: TIMEOUT })
    await assert.rejects(connection.requestStream({ path: '/info' }), { code: TIMEOUT })
    await connection.close()
  })

  it('configures ssh2 as expected', async () => {
    const { client, connection } = createConnection()
    await connection.connect()
    const { connectConfig } = client
    assert.equal(connectConfig.port, 22)
    assert.equal(connectConfig.keepaliveInterval, 10e3)
    assert.equal(connectConfig.keepaliveCountMax, 3)
    assert.equal(connectConfig.hostHash, undefined)
    assert.equal(typeof connectConfig.hostVerifier, 'function')
    assert.equal(connectConfig.hostVerifier!(Buffer.from(ED25519_KEY, 'base64')), true)
    assert.equal(connectConfig.hostVerifier!(Buffer.from(RSA_KEY, 'base64')), false)
    assert.equal(connection.observedHostKey!.fingerprint, RSA_FINGERPRINT)
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
    handler = (req: IncomingMessage, res: ServerResponse) =>
      req.url === '/version'
        ? json(res, 200, { Version: '20.10.0', ApiVersion: '1.41', MinAPIVersion: '1.12' })
        : json(res, 200, { url: req.url })
    const { connection } = createConnection()
    const { body } = await connection.request({ path: '/info' })
    assert.equal((body as { url: string }).url, '/v1.41/info')
    await connection.close()
  })

  it('fails with DOCKER_API_VERSION_UNSUPPORTED and retries negotiation later', async () => {
    handler = (req: IncomingMessage, res: ServerResponse) => json(res, 200, { Version: '1.11', ApiVersion: '1.23' })
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

  it('long-lived streams do not use the request slots (phase 4)', async () => {
    const { client, connection } = createConnection()
    await connection.connect()
    const streams = await Promise.all(
      Array.from({ length: 20 }, () => connection.requestStream({ path: '/stream', longLived: true }))
    )
    // closing the connection aborts them
    streams.forEach(stream => stream.on('error', () => {}))
    assert.deepEqual(connection.activeRequests, { requests: 0, streams: 20 })
    // one channel per stream, on the same SSH connection
    assert.ok(client.channelsOpened >= 21, `${client.channelsOpened} channels`)
    // the regular requests are not starved
    await Promise.all(Array.from({ length: 10 }, () => connection.request({ path: '/containers/json' })))

    // a stream releases its slot when destroyed, and its channel is not reused
    streams[0].destroy()
    await once(streams[0], 'close')
    assert.equal(connection.activeRequests.streams, 19)

    await connection.close()
    // not `once()`: it rejects on `error`
    await Promise.all(
      streams.slice(1).map(stream => (stream.closed ? undefined : new Promise(resolve => stream.on('close', resolve))))
    )
    assert.deepEqual(connection.activeRequests, { requests: 0, streams: 0 })
  })

  it('raw requests: verbatim path and query, version prefix unless present, errors returned (phase 4)', async () => {
    const { connection } = createConnection()
    const read = async (response: IncomingMessage) => {
      const chunks: Buffer[] = []
      for await (const chunk of response) {
        chunks.push(chunk)
      }
      return JSON.parse(Buffer.concat(chunks).toString())
    }
    let response = await connection.requestStream({ path: '/raw?a=1&b=%2F', raw: true, longLived: true })
    assert.equal(response.statusCode, 418)
    assert.deepEqual(await read(response), { url: `/v${MAX_API_VERSION}/raw?a=1&b=%2F` })
    response = await connection.requestStream({ path: '/v1.40/raw', raw: true })
    assert.deepEqual(await read(response), { url: '/v1.40/raw' })
    await connection.close()
  })

  it('fails with DOCKER_API_ERROR on non-2xx', async () => {
    const { connection } = createConnection()
    await assert.rejects(connection.request({ path: '/containers/missing/json' }), (error: DockerError) => {
      assert.equal(error.code, DOCKER_API_ERROR)
      assert.equal(error.data!.statusCode, 404)
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

  it('reads at most 4 KiB of an error body and truncates the message (hostile daemon)', async () => {
    let written = 0
    handler = (req: IncomingMessage, res: ServerResponse) => {
      if (req.url === '/version') {
        return defaultHandler(req, res)
      }
      if (req.url!.endsWith('/object')) {
        return json(res, 500, { message: { toString: 'x' } })
      }
      if (req.url!.endsWith('/text')) {
        res.writeHead(500, { 'content-type': 'text/plain' })
        return res.end('y'.repeat(3000))
      }
      // a never-ending JSON error body
      res.writeHead(500, { 'content-type': 'application/json' })
      res.write('{"message":"')
      const chunk = 'x'.repeat(64 * 1024)
      const write = () => {
        let more = true
        while (more && !res.destroyed && written < 100 * 1024 * 1024) {
          written += chunk.length
          more = res.write(chunk)
        }
        if (!more) {
          res.once('drain', write)
        }
      }
      write()
    }
    const { connection } = createConnection({ requestTimeout: 5e3 })
    await connection.connect()
    const start = Date.now()
    for (const call of [
      () => connection.request({ path: '/flood' }),
      () => connection.requestStream({ path: '/flood' }),
    ]) {
      await assert.rejects(call(), (error: DockerError) => {
        assert.equal(error.code, DOCKER_API_ERROR)
        assert.equal(error.data!.statusCode, 500)
        assert.ok(written < 10 * 1024 * 1024, `${written} bytes written by the daemon`)
        assert.ok(error.message.length <= 1024, `message of ${error.message.length} chars`)
        assert.ok((error.data!.message as string).length <= 1024)
        return true
      })
    }
    assert.ok(Date.now() - start < 2e3, 'does not wait for the whole body')
    assert.ok(written < 10 * 1024 * 1024, `${written} bytes written by the daemon`)
    await assert.rejects(connection.request({ path: '/object' }), (error: DockerError) => {
      assert.equal(error.message, 'Docker API error 500')
      assert.equal(error.data!.message, undefined)
      return true
    })
    await assert.rejects(connection.request({ path: '/text' }), (error: DockerError) => {
      assert.ok(error.message.length <= 1024)
      assert.match(error.message, /^y+…$/)
      return true
    })
    // still usable
    handler = defaultHandler
    await connection.request({ path: '/containers/json' })
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
    await assert.rejects(connection.connect(), (error: DockerError) => {
      assert.equal(error.code, DOCKER_SOCKET_UNREACHABLE)
      assert.equal(error.data!.socketPath, socketPath)
      assert.doesNotMatch(JSON.stringify(error.data), /secret/)
      return true
    })
    await connection.close()
  })

  it('one instance = one SSH session: never reconnects after close()', async () => {
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
    assert.equal(connection.closed, true)
    await assert.rejects(connection.request({ path: '/containers/json' }), { code: CONNECTION_CLOSED })
    await assert.rejects(connection.connect(), { code: CONNECTION_CLOSED })
    assert.equal(clients, 1)
  })

  it('a lost SSH session closes the connection: requests fail with CONNECTION_CLOSED, onClose() is called once', async () => {
    handler = (req: IncomingMessage, res: ServerResponse) =>
      req.url === '/version' ? defaultHandler(req, res) : setTimeout(() => json(res, 200, {}), 300).unref()
    let clients = 0
    let client!: FakeSshClient
    const connection = new DockerConnection(
      { host: 'fake', username: 'user', hostKeyFingerprint: ED25519_FINGERPRINT, socketPath, requestTimeout: 5e3 },
      {
        createClient: () => {
          ++clients
          return (client = new FakeSshClient())
        },
      }
    )
    let closes = 0
    connection.onClose(() => ++closes)
    await connection.connect()
    // in-flight (8) and queued (4) requests
    const results = Array.from({ length: 12 }, () =>
      connection.request({ path: '/slow' }).then(
        () => 'ok',
        error => error.code
      )
    )
    await new Promise(resolve => setTimeout(resolve, 50))
    client.emit('close')
    assert.deepEqual(await Promise.all(results), Array(12).fill(CONNECTION_CLOSED))
    assert.equal(connection.closed, true)
    assert.deepEqual(connection.activeRequests, { requests: 0, streams: 0 })
    await assert.rejects(connection.request({ path: '/containers/json' }), { code: CONNECTION_CLOSED })
    await connection.close()
    assert.equal(closes, 1)
    assert.equal(clients, 1)
  })

  it('a failed SSH connection is not retried by the same instance', async () => {
    let clients = 0
    const connection = new DockerConnection(
      { host: 'fake', username: 'user', socketPath, hostKeyFingerprint: null },
      {
        createClient: () => {
          ++clients
          return new FakeSshClient()
        },
      }
    )
    let closes = 0
    connection.onClose(() => ++closes)
    await assert.rejects(connection.connect(), { code: HOST_KEY_UNKNOWN })
    await assert.rejects(connection.request({ path: '/containers/json' }), { code: HOST_KEY_UNKNOWN })
    assert.equal(clients, 1)
    await connection.close()
    assert.equal(closes, 0)
  })
})
