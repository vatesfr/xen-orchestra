// Integration tests of the logs demuxing and of the normalization against a
// real Docker daemon reached through a real SSH server.
//
// Same environment variables as `connection.integration.test.mjs` (skipped
// unless XO_DOCKER_TEST_SSH_HOST is set), and these containers on the daemon:
//
// - `xo-nginx`: running `nginx:alpine`, port 80 published on 8080
// - `xo-exited`: `alpine sh -c 'echo failing on purpose; exit 3'`, exited
// - `xo-tty`: `alpine` run with `-t`, exited, which printed `tty line one`,
//   `tty line two` (on stderr) and `no newline at end`

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import test from 'node:test'

import { DockerConnection } from './connection.mjs'
import { normalizeContainerInspect, normalizeContainerListEntry, normalizeContainerStats } from './normalize.mjs'
import { createLogLineParser, createStdcopyDemuxer, isMultiplexedStream } from './stdcopy.mjs'

const { after, before, describe, it } = test

const {
  XO_DOCKER_TEST_SSH_HOST: host,
  XO_DOCKER_TEST_SSH_PORT: port = '22',
  XO_DOCKER_TEST_SSH_USER: username,
  XO_DOCKER_TEST_SSH_KEY: keyPath,
  XO_DOCKER_TEST_SSH_FINGERPRINT: fingerprint,
  XO_DOCKER_TEST_SOCKET: socketPath,
} = process.env

const skip = host === undefined ? 'XO_DOCKER_TEST_SSH_HOST is not set' : false

describe('logs and stats (real SSH + dockerd)', { skip }, () => {
  let connection

  before(async () => {
    connection = new DockerConnection({
      host,
      port: Number(port),
      username,
      privateKey: readFileSync(keyPath),
      socketPath,
      hostKeyFingerprint: fingerprint,
      connectTimeout: 5e3,
      requestTimeout: 10e3,
    })
    await connection.connect()
  })

  after(async () => {
    await connection?.close()
  })

  async function inspect(name) {
    const { body } = await connection.request({ path: `/containers/${name}/json` })
    return normalizeContainerInspect(body)
  }

  async function getLogs(name, query = {}) {
    const container = await inspect(name)
    const response = await connection.requestStream({
      path: `/containers/${name}/logs`,
      query: { stdout: 1, stderr: 1, timestamps: 1, tail: 100, ...query },
    })
    const tty = !isMultiplexedStream(response.headers['content-type'], container.tty, connection.apiVersion)
    assert.equal(tty, container.tty, 'the content type agrees with Config.Tty')
    const demuxer = createStdcopyDemuxer({ tty })
    const entries = []
    await pipeline(response, demuxer, createLogLineParser(), async source => {
      for await (const entry of source) {
        entries.push(entry)
      }
    })
    assert.equal(demuxer.truncated, false)
    return { entries, contentType: response.headers['content-type'] }
  }

  const assertTimestamp = (timestamp, since) => {
    assert.match(timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?Z$/)
    const time = Date.parse(timestamp)
    assert.ok(time >= since && time <= Date.now() + 60e3, timestamp)
  }

  it('reads the logs of xo-exited', async () => {
    const container = await inspect('xo-exited')
    const { entries, contentType } = await getLogs('xo-exited')
    assert.equal(contentType, 'application/vnd.docker.multiplexed-stream')
    assert.equal(entries.length, 1)
    const [{ stream, timestamp, message }] = entries
    assert.equal(stream, 'stdout')
    assert.equal(message, 'failing on purpose')
    assertTimestamp(timestamp, container.startedAt - 1e3)
  })

  it('reads the logs of xo-nginx, stdout and stderr', async () => {
    const container = await inspect('xo-nginx')
    const { entries } = await getLogs('xo-nginx')
    assert.ok(entries.length > 5)
    for (const { stream, timestamp, message } of entries) {
      assert.ok(stream === 'stdout' || stream === 'stderr')
      // since its creation: it may have been restarted (e.g. by the REST proof)
      assertTimestamp(timestamp, container.createdAt - 1e3)
      assert.equal(typeof message, 'string')
      assert.ok(!message.includes('\n'))
    }
    // the entrypoint writes on stdout, nginx notices go to stderr
    assert.ok(entries.some(_ => _.stream === 'stdout' && _.message.includes('/docker-entrypoint.sh')))
    assert.ok(entries.some(_ => _.stream === 'stderr' && _.message.includes('[notice]')))
  })

  it('honours tail', async () => {
    const { entries } = await getLogs('xo-nginx', { tail: 2 })
    assert.equal(entries.length, 2)
  })

  it('reads the logs of a TTY container', async () => {
    const container = await inspect('xo-tty')
    const { entries, contentType } = await getLogs('xo-tty')
    assert.equal(contentType, 'application/vnd.docker.raw-stream')
    assert.deepEqual(
      entries.map(({ stream, message }) => [stream, message]),
      [
        ['stdout', 'tty line one'],
        ['stdout', 'tty line two'],
        ['stdout', 'no newline at end'],
      ]
    )
    for (const { timestamp } of entries) {
      assertTimestamp(timestamp, container.startedAt - 1e3)
    }
  })

  it('reads and normalizes the stats of xo-nginx (stream=false)', async () => {
    const container = await inspect('xo-nginx')
    const start = Date.now()
    const { body } = await connection.request({ path: '/containers/xo-nginx/stats', query: { stream: false } })
    const stats = normalizeContainerStats(body)
    // dockerd pre-reads a sample, precpu_stats is valid
    assert.equal(typeof stats.cpuPercent, 'number')
    assert.ok(stats.cpuPercent >= 0 && stats.cpuPercent <= 100 * stats.onlineCpus, String(stats.cpuPercent))
    assert.ok(stats.onlineCpus >= 1)
    assert.ok(stats.memoryUsage > 0 && stats.memoryUsage <= body.memory_stats.usage)
    assert.ok(stats.memoryLimit >= stats.memoryUsage)
    assert.ok(stats.memoryPercent > 0 && stats.memoryPercent <= 100)
    assert.ok(stats.pids >= 1)
    assert.ok(stats.networkRx >= 0)
    assert.ok(stats.sampledAt >= Math.max(container.startedAt, start - 5e3) && stats.sampledAt <= Date.now() + 60e3)
  })

  it('reads and normalizes streamed stats of xo-nginx (stream=true)', async () => {
    const controller = new AbortController()
    const response = await connection.requestStream({
      path: '/containers/xo-nginx/stats',
      query: { stream: true },
      signal: controller.signal,
    })
    const samples = []
    try {
      let buffer = ''
      for await (const chunk of response) {
        buffer += chunk
        let i
        while ((i = buffer.indexOf('\n')) !== -1) {
          samples.push(normalizeContainerStats(JSON.parse(buffer.slice(0, i))))
          buffer = buffer.slice(i + 1)
        }
        if (samples.length >= 2) {
          break
        }
      }
    } finally {
      controller.abort()
    }
    const [first, second] = samples
    // the first object of a stream has no previous CPU sample
    assert.equal(first.cpuPercent, null)
    assert.equal(typeof second.cpuPercent, 'number')
    assert.ok(second.sampledAt > first.sampledAt)
    assert.ok(second.memoryUsage > 0)
  })

  it('normalizes the real container list', async () => {
    const { body } = await connection.request({ path: '/containers/json', query: { all: 1 } })
    const containers = new Map(body.map(normalizeContainerListEntry).map(container => [container.name, container]))

    const nginx = containers.get('xo-nginx')
    assert.equal(nginx.state, 'running')
    assert.deepEqual(nginx.ports, [{ ip: '0.0.0.0', privatePort: 80, publicPort: 8080, protocol: 'tcp' }])
    assert.deepEqual((await inspect('xo-nginx')).ports, nginx.ports)

    const exited = containers.get('xo-exited')
    assert.equal(exited.state, 'exited')
    assert.equal(exited.exitCode, 3)
    assert.equal((await inspect('xo-exited')).exitCode, 3)
  })
})
