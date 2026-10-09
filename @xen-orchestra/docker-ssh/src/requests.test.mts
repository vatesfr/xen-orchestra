import assert from 'node:assert/strict'
import type { IncomingMessage } from 'node:http'
import { PassThrough, Readable } from 'node:stream'
import { describe, it } from 'node:test'

import type { DockerBufferedRequestOptions, DockerResponse, DockerStreamRequestOptions } from './connection.mjs'
import { INSPECT_BY_NAME } from './fixtures/containers.mjs'
import { DOCKER_API_ERROR, DockerError, RAW_REQUEST_TOO_LARGE, RAW_RESPONSE_TOO_LARGE, TIMEOUT } from './errors.mjs'
import { type ContainerLogsOptions, rawRequest, readContainerLogs } from './requests.mjs'

const DOCKER_ID = 'a'.repeat(64)

// a multiplexed frame (stdout = 1, stderr = 2)
const frame = (text: string, stream = 1) => {
  const payload = Buffer.from(text)
  const header = Buffer.from([stream, 0, 0, 0, 0, 0, 0, 0])
  header.writeUInt32BE(payload.length, 4)
  return Buffer.concat([header, payload])
}

// a response body (`IncomingMessage` stand-in) fed by the test
const createBody = (headers: Record<string, string>, statusCode = 200) =>
  Object.assign(new Readable({ read() {} }), { headers, statusCode }) as Readable & IncomingMessage

class FakeConnection {
  apiVersion: string | undefined = '1.44'
  requests: DockerBufferedRequestOptions[] = []
  streams: DockerStreamRequestOptions[] = []
  inspect: unknown = INSPECT_BY_NAME['xo-nginx']
  respond: (opts: DockerStreamRequestOptions) => Promise<IncomingMessage> = async () => {
    throw new Error('not implemented')
  }

  async request(opts: DockerBufferedRequestOptions): Promise<DockerResponse> {
    this.requests.push(opts)
    return { statusCode: 200, headers: {}, body: this.inspect }
  }

  requestStream(opts: DockerStreamRequestOptions): Promise<IncomingMessage> {
    this.streams.push(opts)
    return this.respond(opts)
  }
}

const LIMITS: Omit<ContainerLogsOptions, 'tail'> = {
  maxSize: 1024 * 1024,
  maxEntries: 1000,
  timeout: 5e3,
  idleTimeout: 5e3,
}

describe('readContainerLogs()', () => {
  it('requests both streams with timestamps, filters and strips them afterwards', async () => {
    const connection = new FakeConnection()
    connection.respond = async () => {
      const body = createBody({ 'content-type': 'application/vnd.docker.multiplexed-stream' })
      body.push(frame('2026-09-24T12:00:00.000000000Z out\n'))
      body.push(frame('2026-09-24T12:00:01.000000000Z err\n', 2))
      body.push(null)
      return body
    }
    const logs = await readContainerLogs(connection, DOCKER_ID, {
      ...LIMITS,
      tail: 10,
      since: '1.5',
      stderr: false,
      timestamps: false,
    })
    assert.deepEqual(logs.entries, [{ stream: 'stdout', timestamp: undefined, message: 'out' }])
    assert.equal(logs.truncated, false)
    assert.equal(logs.timedOut, false)
    assert.deepEqual(connection.streams[0].query, {
      stdout: 1,
      stderr: 1,
      timestamps: 1,
      tail: 10,
      since: '1.5',
      until: undefined,
    })
    assert.equal(connection.streams[0].path, `/containers/${DOCKER_ID}/logs`)
    // API ≥ 1.42: the content type is reliable, no inspection
    assert.equal(connection.requests.length, 0)
  })

  it('before API 1.42: inspects the container for its TTY setting unless given', async () => {
    const connection = new FakeConnection()
    connection.apiVersion = '1.41'
    const nginx = INSPECT_BY_NAME['xo-nginx']
    connection.inspect = { ...nginx, Config: { ...nginx.Config, Tty: true } }
    connection.respond = async () => {
      const body = createBody({ 'content-type': 'application/vnd.docker.raw-stream' })
      body.push('2026-09-24T12:00:00.000000000Z raw\n')
      body.push(null)
      return body
    }
    const logs = await readContainerLogs(connection, DOCKER_ID, { ...LIMITS, tail: 10 })
    assert.deepEqual(
      logs.entries.map(_ => _.message),
      ['raw']
    )
    assert.equal(connection.requests[0].path, `/containers/${DOCKER_ID}/json`)

    await readContainerLogs(connection, DOCKER_ID, { ...LIMITS, tail: 10, tty: true })
    assert.equal(connection.requests.length, 1)

    connection.inspect = 'garbage'
    await assert.rejects(readContainerLogs(connection, DOCKER_ID, { ...LIMITS, tail: 10 }), {
      code: DOCKER_API_ERROR,
    })
  })

  it('cuts at maxSize and at maxEntries (truncated)', async () => {
    const connection = new FakeConnection()
    connection.respond = async () => {
      const body = createBody({ 'content-type': 'application/vnd.docker.multiplexed-stream' })
      for (let i = 0; i < 10; ++i) {
        body.push(frame(`2026-09-24T12:00:00Z line ${i}\n`))
      }
      body.push(null)
      return body
    }
    let logs = await readContainerLogs(connection, DOCKER_ID, { ...LIMITS, tail: 10, maxEntries: 3 })
    assert.equal(logs.entries.length, 3)
    assert.equal(logs.truncated, true)

    logs = await readContainerLogs(connection, DOCKER_ID, { ...LIMITS, tail: 10, maxSize: frame('x').length * 2 })
    assert.ok(logs.entries.length < 10)
    assert.equal(logs.truncated, true)
    assert.equal(logs.timedOut, false)
  })

  it('stops after idleTimeout without data, with what has been read', async () => {
    const connection = new FakeConnection()
    let body: Readable | undefined
    connection.respond = async () => {
      body = createBody({ 'content-type': 'application/vnd.docker.multiplexed-stream' })
      body.push(frame('2026-09-24T12:00:00Z only\n'))
      return body as IncomingMessage
    }
    const start = Date.now()
    const logs = await readContainerLogs(connection, DOCKER_ID, { ...LIMITS, tail: 10, idleTimeout: 100 })
    assert.ok(Date.now() - start < 1e3)
    assert.deepEqual(
      { timedOut: logs.timedOut, truncated: logs.truncated, messages: logs.entries.map(_ => _.message) },
      { timedOut: true, truncated: true, messages: ['only'] }
    )
    assert.equal(body!.destroyed, true)
  })

  it('aborts the request itself after timeout', async () => {
    const connection = new FakeConnection()
    connection.respond = ({ signal }) =>
      new Promise((resolve, reject) => signal!.addEventListener('abort', () => reject(signal!.reason)))
    await assert.rejects(readContainerLogs(connection, DOCKER_ID, { ...LIMITS, tail: 10, timeout: 50 }), {
      name: 'TimeoutError',
    })
  })
})

describe('rawRequest()', () => {
  const OPTS = { method: 'GET', path: '/info', maxRequestSize: 10, maxResponseSize: 10, timeout: 0 }

  it('sends a raw long-lived request and passes the response through', async () => {
    const connection = new FakeConnection()
    connection.respond = async () => {
      const body = createBody({ 'content-type': 'text/plain' }, 418)
      body.push('teapot')
      body.push(null)
      return body
    }
    const response = await rawRequest(connection, { ...OPTS, headers: { 'x-a': 'b' } })
    assert.equal(response.statusCode, 418)
    assert.equal((await response.body.toArray()).join(''), 'teapot')
    await response.done
    const { raw, longLived, headers, path, method } = connection.streams[0]
    assert.deepEqual(
      { raw, longLived, headers, path, method },
      {
        raw: true,
        longLived: true,
        headers: { 'x-a': 'b' },
        path: '/info',
        method: 'GET',
      }
    )
  })

  it('caps the response: announced size thrown, streamed size fails the body', async () => {
    const connection = new FakeConnection()
    let response: Readable | undefined
    connection.respond = async () => (response = createBody({ 'content-length': '11' }))
    await assert.rejects(rawRequest(connection, OPTS), { code: RAW_RESPONSE_TOO_LARGE })
    assert.equal(response!.destroyed, true)

    connection.respond = async () => {
      const body = createBody({})
      body.push('x'.repeat(11))
      return body
    }
    const { body, done } = await rawRequest(connection, OPTS)
    await assert.rejects(body.toArray(), { code: RAW_RESPONSE_TOO_LARGE })
    await done
  })

  it('caps the request body', async () => {
    const connection = new FakeConnection()
    let sent: Readable | undefined
    connection.respond = async ({ body }) => {
      sent = body as Readable
      return createBody({})
    }
    const body = new PassThrough()
    await rawRequest(connection, { ...OPTS, method: 'POST', body })
    body.end('x'.repeat(11))
    await assert.rejects(sent!.toArray(), { code: RAW_REQUEST_TOO_LARGE })
  })

  it('on failure: the caller body is unpiped and drained, not destroyed', async () => {
    const connection = new FakeConnection()
    connection.respond = async () => {
      throw new DockerError(TIMEOUT, 'no')
    }
    const body = new PassThrough()
    await assert.rejects(rawRequest(connection, { ...OPTS, method: 'POST', body }), { code: TIMEOUT })
    assert.equal(body.destroyed, false)
    // drained: writing does not stall
    assert.equal(body.write('x'), true)
  })

  it('the timeout covers the response body', async () => {
    const connection = new FakeConnection()
    connection.respond = async ({ signal }) => {
      const body = createBody({})
      signal!.addEventListener('abort', () => body.destroy(signal!.reason))
      return body
    }
    const { body, done } = await rawRequest(connection, { ...OPTS, timeout: 50 })
    await assert.rejects(body.toArray(), { name: 'TimeoutError' })
    await done
  })
})
