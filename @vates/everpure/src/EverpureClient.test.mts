import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { EverpureClient, EverpureError, type FetchFunction, type HttpRequestInit } from './EverpureClient.mjs'

interface RecordedCall {
  readonly method: string
  readonly path: string
  readonly query: Record<string, string>
  readonly headers: Readonly<Record<string, string>>
  readonly body: unknown
}

interface FakeResponse {
  readonly status?: number
  readonly headers?: Readonly<Record<string, string>>
  readonly body?: unknown
}

type Route = (call: RecordedCall) => FakeResponse

/** A fake array: routes keyed by `METHOD /path`, every call recorded. */
function fakeArray(routes: Readonly<Record<string, Route>>, { versions = ['1.19', '2.0', '2.36', '2.9'] } = {}) {
  const calls: RecordedCall[] = []
  const fetch: FetchFunction = async (url: string, init: HttpRequestInit) => {
    const { pathname, searchParams } = new URL(url)
    const call: RecordedCall = {
      method: init.method,
      path: pathname,
      query: Object.fromEntries(searchParams),
      headers: init.headers,
      body: init.body === undefined ? undefined : JSON.parse(init.body),
    }
    calls.push(call)
    assert.ok(init.signal instanceof AbortSignal, 'every request carries a timeout signal')

    let response: FakeResponse
    if (pathname === '/api/api_version') {
      response = { body: { version: versions } }
    } else if (pathname.endsWith('/login')) {
      assert.equal(init.headers['api-token'], 'secret-api-token')
      response = { headers: { 'x-auth-token': 'session-1' } }
    } else {
      const route = routes[`${init.method} ${pathname.replace(/^\/api\/[^/]+/, '')}`]
      assert.ok(route !== undefined, `unexpected request ${init.method} ${pathname}`)
      response = route(call)
    }
    const status = response.status ?? 200
    const headers = new Map(Object.entries(response.headers ?? {}))
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : `status ${status}`,
      headers: { get: (name: string) => headers.get(name) ?? null },
      text: async () => (response.body === undefined ? '' : JSON.stringify(response.body)),
    }
  }
  return { calls, fetch }
}

async function connectedClient(routes: Readonly<Record<string, Route>>, options: Parameters<typeof fakeArray>[1] = {}) {
  const array = fakeArray(routes, options)
  const client = new EverpureClient({ url: 'https://array.test/', apiToken: 'secret-api-token', fetch: array.fetch })
  await client.connect()
  return { ...array, client }
}

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = []
  for await (const item of iterable) {
    items.push(item)
  }
  return items
}

const SNAPSHOT = {
  id: 'id-1',
  name: 'vol.snap',
  source: { name: 'vol' },
  suffix: 'snap',
  provisioned: 8 * 1024 ** 3,
  serial: 'ABC',
  created: 1,
  destroyed: false,
}

describe('EverpureClient', () => {
  it('connects with the highest 2.x version and authenticates every request with the session token', async () => {
    const { client, calls } = await connectedClient({
      'GET /volumes': () => ({ body: { items: [{ name: 'vol', provisioned: 1024 }] } }),
    })
    assert.equal(client.apiVersion, '2.36')
    assert.deepEqual(
      calls.map(c => `${c.method} ${c.path}`),
      ['GET /api/api_version', 'POST /api/2.36/login']
    )

    const volume = await client.getVolume('vol')
    assert.equal(volume.provisioned, 1024)
    const call = calls.at(-1)!
    assert.equal(call.path, '/api/2.36/volumes')
    assert.equal(call.query.names, 'vol')
    assert.equal(call.headers['x-auth-token'], 'session-1')
  })

  it('refuses an array without REST 2.x', async () => {
    const { fetch } = fakeArray({}, { versions: ['1.19'] })
    const client = new EverpureClient({ url: 'https://array.test', apiToken: 'secret-api-token', fetch })
    await assert.rejects(client.connect(), /does not offer the REST API 2\.x/)
  })

  it('lists the allocated blocks of a snapshot, following continuation tokens and segments', async () => {
    const { client, calls } = await connectedClient({
      'GET /volume-snapshots': () => ({ body: { items: [SNAPSHOT] } }),
      'GET /volumes/diff': ({ query }) => {
        const segmentOffset = Number(query.segment_offset)
        if (segmentOffset === 0 && query.continuation_token === undefined) {
          return {
            body: { items: [{ offset: 0, length: 2 ** 21 }], continuation_token: 'page-2', more_items_remaining: true },
          }
        }
        if (segmentOffset === 0) {
          assert.equal(query.continuation_token, 'page-2')
          return {
            body: {
              items: [{ offset: 2 ** 22, length: 2 ** 22 }],
              continuation_token: null,
              more_items_remaining: false,
            },
          }
        }
        return { body: { items: [{ offset: segmentOffset, length: 2 ** 21 }] } }
      },
    })

    const ranges = await collect(
      client.listChangedBlocks({ name: 'vol.snap', blockSize: 2 ** 21, segmentLength: 4 * 1024 ** 3 })
    )

    assert.deepEqual(ranges, [
      { offset: 0, length: 2 ** 21 },
      { offset: 2 ** 22, length: 2 ** 22 },
      { offset: 4 * 1024 ** 3, length: 2 ** 21 },
    ])
    const diffCalls = calls.filter(c => c.path.endsWith('/volumes/diff'))
    assert.equal(diffCalls.length, 3)
    assert.deepEqual(diffCalls[0].query, {
      names: 'vol.snap',
      block_size: String(2 ** 21),
      segment_offset: '0',
      segment_length: String(4 * 1024 ** 3),
    })
    assert.equal(diffCalls[2].query.segment_offset, String(4 * 1024 ** 3))
    assert.equal(
      diffCalls[2].query.segment_length,
      String(4 * 1024 ** 3),
      'the 8 GiB snapshot is covered by two 4 GiB segments'
    )
  })

  it('lists the blocks changed since a base snapshot, within an explicit area', async () => {
    const { client, calls } = await connectedClient({
      'GET /volumes/diff': () => ({ body: { items: [{ offset: 2 ** 21, length: 2 ** 21 }] } }),
    })
    const ranges = await collect(
      client.listChangedBlocks({
        name: 'vol.snap2',
        baseName: 'vol.snap1',
        blockSize: 65536,
        offset: 2 ** 21,
        length: 2 ** 22,
      })
    )
    assert.deepEqual(ranges, [{ offset: 2 ** 21, length: 2 ** 21 }])
    const call = calls.at(-1)!
    assert.deepEqual(call.query, {
      names: 'vol.snap2',
      base_name: 'vol.snap1',
      block_size: '65536',
      segment_offset: String(2 ** 21),
      segment_length: String(2 ** 22),
    })
    assert.ok(!calls.some(c => c.path.endsWith('/volume-snapshots')), 'no size lookup when the length is given')
  })

  it('rejects a misaligned block size or offset before calling the array', async () => {
    const { client, calls } = await connectedClient({})
    const before = calls.length
    await assert.rejects(
      collect(client.listChangedBlocks({ name: 'vol.snap', blockSize: 1000, length: 4096 })),
      RangeError
    )
    await assert.rejects(
      collect(client.listChangedBlocks({ name: 'vol.snap', blockSize: 4096, offset: 512, length: 4096 })),
      RangeError
    )
    assert.equal(calls.length, before)
  })

  it('refuses to diff on an array older than REST 2.9', async () => {
    const { client } = await connectedClient({}, { versions: ['2.0', '2.8'] })
    await assert.rejects(
      collect(client.listChangedBlocks({ name: 'vol.snap', blockSize: 4096, length: 4096 })),
      /needs REST API 2\.9\+/
    )
  })

  it('creates an empty volume', async () => {
    const { client, calls } = await connectedClient({
      'POST /volumes': ({ query, body }) => {
        assert.equal(query.names, 'vol')
        assert.deepEqual(body, { provisioned: 1024 ** 3 })
        return { body: { items: [{ name: 'vol', provisioned: 1024 ** 3, serial: 'ABC' }] } }
      },
    })
    const volume = await client.createVolume('vol', { provisioned: 1024 ** 3 })
    assert.equal(volume.serial, 'ABC')
    assert.equal(calls.at(-1)!.method, 'POST')
    const before = calls.length
    await assert.rejects(client.createVolume('vol', { provisioned: 1000 }), RangeError)
    assert.equal(calls.length, before, 'a misaligned size is refused before calling the array')
  })

  it('deletes a volume by destroying then eradicating it', async () => {
    const { client, calls } = await connectedClient({
      'PATCH /volumes': ({ body }) => {
        assert.deepEqual(body, { destroyed: true })
        return {}
      },
      'DELETE /volumes': () => ({}),
    })
    assert.deepEqual(await client.deleteVolume('vol'), { eradicated: true })
    assert.deepEqual(
      calls.slice(-2).map(c => [c.method, c.path, c.query.names]),
      [
        ['PATCH', '/api/2.36/volumes', 'vol'],
        ['DELETE', '/api/2.36/volumes', 'vol'],
      ]
    )
  })

  it('creates a snapshot of a volume', async () => {
    const { client, calls } = await connectedClient({
      'POST /volume-snapshots': ({ query, body }) => {
        assert.equal(query.source_names, 'vol')
        assert.deepEqual(body, { suffix: 'xo-1' })
        return { body: { items: [{ ...SNAPSHOT, name: 'vol.xo-1', suffix: 'xo-1' }] } }
      },
    })
    const snapshot = await client.createVolumeSnapshot('vol', { suffix: 'xo-1' })
    assert.equal(snapshot.name, 'vol.xo-1')
    assert.equal(calls.at(-1)!.method, 'POST')
  })

  it('lists the snapshots of a volume', async () => {
    const { client, calls } = await connectedClient({
      'GET /volume-snapshots': () => ({ body: { items: [SNAPSHOT] } }),
    })
    const snapshots = await collect(client.listVolumeSnapshots('vol'))
    assert.deepEqual(snapshots, [SNAPSHOT])
    assert.equal(calls.at(-1)!.query.source_names, 'vol')
  })

  it('deletes a snapshot by destroying then eradicating it', async () => {
    const { client, calls } = await connectedClient({
      'PATCH /volume-snapshots': ({ body }) => {
        assert.deepEqual(body, { destroyed: true })
        return { body: { items: [{ ...SNAPSHOT, destroyed: true }] } }
      },
      'DELETE /volume-snapshots': () => ({}),
    })
    assert.deepEqual(await client.deleteVolumeSnapshot('vol.snap'), { eradicated: true })
    assert.deepEqual(
      calls.slice(-2).map(c => [c.method, c.query.names]),
      [
        ['PATCH', 'vol.snap'],
        ['DELETE', 'vol.snap'],
      ]
    )
  })

  it('reports a snapshot that was destroyed but could not be eradicated', async () => {
    const { client } = await connectedClient({
      'PATCH /volume-snapshots': () => ({}),
      'DELETE /volume-snapshots': () => ({ status: 400, body: { errors: [{ message: 'SafeMode is enabled' }] } }),
    })
    assert.deepEqual(await client.deleteVolumeSnapshot('vol.snap'), { eradicated: false })
  })

  it('turns an array error into an EverpureError carrying its messages', async () => {
    const { client } = await connectedClient({
      'GET /volumes': () => ({
        status: 400,
        body: { errors: [{ message: 'Volume does not exist.', context: 'nope' }] },
      }),
    })
    await assert.rejects(client.getVolume('nope'), (error: unknown) => {
      assert.ok(error instanceof EverpureError)
      assert.equal(error.status, 400)
      assert.deepEqual(error.errors, ['Volume does not exist. (nope)'])
      assert.match(error.message, /GET \/api\/2\.36\/volumes: HTTP 400 Volume does not exist\./)
      return true
    })
  })

  it('logs in again once when the session has expired', async () => {
    let unauthorized = 1
    const { client, calls } = await connectedClient({
      'GET /volumes': () =>
        unauthorized-- > 0
          ? { status: 401, body: { errors: [{ message: 'invalid session' }] } }
          : { body: { items: [{ name: 'vol' }] } },
    })
    assert.equal((await client.getVolume('vol')).name, 'vol')
    assert.deepEqual(
      calls.slice(2).map(c => `${c.method} ${c.path}`),
      ['GET /api/2.36/volumes', 'POST /api/2.36/login', 'GET /api/2.36/volumes']
    )
  })

  it('gives up after a second 401', async () => {
    const { client } = await connectedClient({
      'GET /volumes': () => ({ status: 401 }),
    })
    await assert.rejects(
      client.getVolume('vol'),
      (error: unknown) => error instanceof EverpureError && error.status === 401
    )
  })

  it('logs out on close and ignores logout failures', async () => {
    const { client, calls } = await connectedClient({
      'POST /logout': () => ({ status: 500 }),
    })
    await client.close()
    assert.equal(calls.at(-1)!.path, '/api/2.36/logout')
    await client.close() // not connected any more: no request
    assert.equal(calls.at(-1)!.path, '/api/2.36/logout')
  })
})
