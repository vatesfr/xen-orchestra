// Integration tests against a real Docker daemon reached through a real SSH
// server.
//
// Skipped unless the following environment variables are set:
//
// - XO_DOCKER_TEST_SSH_HOST
// - XO_DOCKER_TEST_SSH_PORT (default: 22)
// - XO_DOCKER_TEST_SSH_USER
// - XO_DOCKER_TEST_SSH_KEY: path of an authorized private key
// - XO_DOCKER_TEST_SSH_BAD_KEY: path of a private key which is NOT authorized
// - XO_DOCKER_TEST_SSH_FINGERPRINT: host key fingerprint (`SHA256:…`, ED25519)
// - XO_DOCKER_TEST_SOCKET: path of the Docker socket on the SSH host
// - XO_DOCKER_TEST_SSH_NOFWD_PORT (optional): port of an SSH server on the same
//   host with `AllowStreamLocalForwarding no` and the same authorized key

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import test from 'node:test'
import { Client } from 'ssh2'

import { DockerConnection, MAX_API_VERSION } from './connection.mjs'
import {
  DOCKER_SOCKET_UNREACHABLE,
  HOST_KEY_MISMATCH,
  HOST_KEY_UNKNOWN,
  CONNECTION_CLOSED,
  SSH_AUTH_FAILED,
  SSH_UNREACHABLE,
  TIMEOUT,
} from './errors.mjs'

const { after, before, describe, it } = test

const {
  XO_DOCKER_TEST_SSH_HOST: host,
  XO_DOCKER_TEST_SSH_PORT: port = '22',
  XO_DOCKER_TEST_SSH_USER: username,
  XO_DOCKER_TEST_SSH_KEY: keyPath,
  XO_DOCKER_TEST_SSH_BAD_KEY: badKeyPath,
  XO_DOCKER_TEST_SSH_FINGERPRINT: fingerprint,
  XO_DOCKER_TEST_SOCKET: socketPath,
  XO_DOCKER_TEST_SSH_NOFWD_PORT: noForwardingPort,
} = process.env

const skip = host === undefined ? 'XO_DOCKER_TEST_SSH_HOST is not set' : false

// a local TCP port on which nothing listens
async function getClosedPort() {
  const server = createServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  await new Promise(resolve => server.close(resolve))
  return port
}

describe('DockerConnection (real SSH + dockerd)', { skip }, () => {
  let privateKey, badPrivateKey
  const connections = []

  before(() => {
    privateKey = readFileSync(keyPath)
    badPrivateKey = readFileSync(badKeyPath)
  })

  after(async () => {
    await Promise.all(connections.map(connection => connection.close()))
  })

  const createConnection = (opts, internals) => {
    const connection = new DockerConnection(
      {
        host,
        port: Number(port),
        username,
        privateKey,
        socketPath,
        hostKeyFingerprint: fingerprint,
        connectTimeout: 5e3,
        requestTimeout: 10e3,
        ...opts,
      },
      internals
    )
    connections.push(connection)
    return connection
  }

  describe('with the right fingerprint', () => {
    let connection
    before(async () => {
      connection = createConnection()
      await connection.connect()
    })

    it('negotiates the API version', () => {
      assert.equal(connection.apiVersion, MAX_API_VERSION)
      assert.match(connection.engineVersion, /^\d+\.\d+/)
      assert.equal(connection.observedHostKey.fingerprint, fingerprint)
    })

    it('GET /version', async () => {
      const { statusCode, body } = await connection.request({ path: '/version' })
      assert.equal(statusCode, 200)
      assert.equal(body.Version, connection.engineVersion)
    })

    it('GET /containers/json?all=1', async () => {
      const { body } = await connection.request({ path: '/containers/json', query: { all: 1 } })
      assert.ok(Array.isArray(body))
      for (const container of body) {
        assert.equal(typeof container.Id, 'string')
      }
    })

    it('GET /info', async () => {
      const { body } = await connection.request({ path: '/info' })
      assert.equal(typeof body.ID, 'string')
      assert.equal(typeof body.Containers, 'number')
    })

    it('handles 10 concurrent requests', async () => {
      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) => connection.request({ path: i % 2 === 0 ? '/info' : '/containers/json' }))
      )
      for (const { statusCode } of results) {
        assert.equal(statusCode, 200)
      }
    })

    it('reports Docker errors', async () => {
      await assert.rejects(connection.request({ path: '/containers/xo-does-not-exist/json' }), error => {
        assert.equal(error.code, 'DOCKER_API_ERROR')
        assert.equal(error.data.statusCode, 404)
        assert.match(error.message, /No such container/)
        return true
      })
    })
  })

  it('times out with TIMEOUT on a long-lived request and stays usable', async () => {
    const connection = createConnection({ requestTimeout: 500 })
    await connection.connect()
    // `/events` never ends by itself
    await assert.rejects(connection.request({ path: '/events' }), { code: TIMEOUT })
    const controller = new AbortController()
    const events = await connection.requestStream({ path: '/events', signal: controller.signal })
    // the stream outlives requestTimeout
    await new Promise(resolve => setTimeout(resolve, 700))
    assert.equal(events.destroyed, false)
    controller.abort()
    const { statusCode } = await connection.request({ path: '/_ping' })
    assert.equal(statusCode, 200)
  })

  it('recovers from SSH connection losses (no reuse of dead keep-alive channels, no leaked slots)', async () => {
    const clients = []
    const connection = createConnection(
      { requestTimeout: 2e3 },
      {
        createClient: () => {
          const client = new Client()
          clients.push(client)
          return client
        },
      }
    )
    // more drops than the max number of free sockets and concurrent requests
    for (let i = 0; i < 5; ++i) {
      await Promise.all([connection.request({ path: '/_ping' }), connection.request({ path: '/_ping' })])
      // simulate a network failure
      clients.at(-1)._sock.destroy()
      await new Promise(resolve => setTimeout(resolve, 100))
      const start = Date.now()
      const results = await Promise.all(
        Array.from({ length: 3 }, () => connection.request({ path: '/_ping' }).then(({ statusCode }) => statusCode))
      )
      assert.deepEqual(results, [200, 200, 200])
      assert.ok(Date.now() - start < 2e3)
    }
    assert.equal(clients.length, 6)
  })

  it('close() rejects queued requests with CONNECTION_CLOSED and does not reconnect', async () => {
    const clients = []
    const connection = createConnection(
      {},
      {
        createClient: () => {
          const client = new Client()
          clients.push(client)
          return client
        },
      }
    )
    await connection.connect()
    const results = Array.from({ length: 20 }, () =>
      connection.request({ path: '/containers/json', query: { all: 1 } }).then(
        () => 'ok',
        error => error.code
      )
    )
    await connection.close()
    for (const result of await Promise.all(results)) {
      assert.equal(result, CONNECTION_CLOSED)
    }
    await new Promise(resolve => setTimeout(resolve, 200))
    assert.equal(clients.length, 1)
    assert.equal(clients[0]._sock.destroyed, true)
  })

  it('fails with HOST_KEY_MISMATCH on a wrong fingerprint', async () => {
    const connection = createConnection({ hostKeyFingerprint: 'SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' })
    await assert.rejects(connection.connect(), error => {
      assert.equal(error.code, HOST_KEY_MISMATCH)
      assert.equal(error.data.expected, 'SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
      assert.equal(error.data.actual, fingerprint)
      return true
    })
  })

  it('fails with HOST_KEY_UNKNOWN without fingerprint', async () => {
    const connection = createConnection({ hostKeyFingerprint: undefined })
    await assert.rejects(connection.connect(), error => {
      assert.equal(error.code, HOST_KEY_UNKNOWN)
      assert.equal(error.data.fingerprint, fingerprint)
      assert.equal(error.data.algorithm, 'ssh-ed25519')
      return true
    })
    assert.equal(connection.observedHostKey.fingerprint, fingerprint)
  })

  it('accepts an unknown host key when asked to', async () => {
    const connection = createConnection({ hostKeyFingerprint: undefined, acceptUnknownHostKey: true })
    await connection.connect()
    assert.equal(connection.observedHostKey.fingerprint, fingerprint)
  })

  it('fails with SSH_AUTH_FAILED with a bad key', async () => {
    const connection = createConnection({ privateKey: badPrivateKey })
    await assert.rejects(connection.connect(), error => {
      assert.equal(error.code, SSH_AUTH_FAILED)
      assert.doesNotMatch(JSON.stringify(error.data) + JSON.stringify(error.cause), /PRIVATE KEY/)
      return true
    })
  })

  it('fails with DOCKER_SOCKET_UNREACHABLE with a wrong socket path', async () => {
    const connection = createConnection({ socketPath: '/xo-does-not-exist/docker.sock' })
    await assert.rejects(connection.connect(), { code: DOCKER_SOCKET_UNREACHABLE })
  })

  it('fails with SSH_UNREACHABLE on a closed port', async () => {
    const connection = createConnection({ port: await getClosedPort() })
    await assert.rejects(connection.connect(), { code: SSH_UNREACHABLE })
  })

  it(
    'fails with DOCKER_SOCKET_UNREACHABLE when stream local forwarding is disabled (OpenSSH answers CONNECT_FAILED)',
    { skip: noForwardingPort === undefined ? 'XO_DOCKER_TEST_SSH_NOFWD_PORT is not set' : false },
    async () => {
      const connection = createConnection({
        port: Number(noForwardingPort),
        hostKeyFingerprint: undefined,
        acceptUnknownHostKey: true,
      })
      await assert.rejects(connection.connect(), error => {
        assert.equal(error.code, DOCKER_SOCKET_UNREACHABLE)
        assert.equal(error.data.reason, 2)
        assert.equal(error.data.description, 'open failed')
        return true
      })
    }
  )
})
