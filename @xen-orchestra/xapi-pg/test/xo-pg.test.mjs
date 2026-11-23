import * as assert from 'node:assert'
import { test } from 'node:test'
import { Pool } from 'pg'
import { EventStore } from '../src/event_store.mjs'
import { createPgTransport } from '../src/xo-pg.mjs'

test('createPgTransport checks the connection and wraps the transport', async t => {
  const queries = []
  let released = false
  t.mock.method(Pool.prototype, 'connect', async () => ({
    query: async query => queries.push(query),
    release: () => {
      released = true
    },
  }))

  const calls = []
  const methods = ['VM.get_all_records', 'session.login_with_password']
  const params = ['user', 'password']
  const transportOptions = { endpoint: 'xapi' }
  const createTransport = await createPgTransport('postgres://localhost/test', options => {
    assert.strictEqual(options, transportOptions)
    return async (method, args) => {
      calls.push([method, args])
      return method === 'system.listMethods' ? methods : 'session-id'
    }
  })

  assert.deepStrictEqual(queries, ["SELECT 'checking connection'"])
  assert.strictEqual(released, true)
  const transport = createTransport(transportOptions)
  assert.strictEqual(await transport('session.login_with_password', params), 'session-id')
  assert.strictEqual(await transport('system.listMethods'), methods)
  assert.deepStrictEqual(calls, [
    ['system.listMethods', undefined],
    ['session.login_with_password', params],
  ])
})

test('createPgTransport rejects when the connection check fails', async t => {
  const error = new Error('connection check failed')
  let released = false
  t.mock.method(Pool.prototype, 'connect', async () => ({
    query: async () => {
      throw error
    },
    release: () => {
      released = true
    },
  }))

  await assert.rejects(
    createPgTransport('postgres://localhost/test', () => {}),
    error
  )
  assert.strictEqual(released, true)
})

test('event.from refreshes from the last database token before reading from the requested token', async t => {
  t.mock.method(Pool.prototype, 'connect', async () => ({
    query: async () => ({ rows: [] }),
    release: () => {},
  }))
  let lastToken = '2'
  const steps = []
  t.mock.method(EventStore.prototype, 'getLastToken', async () => lastToken)
  t.mock.method(EventStore.prototype, 'ingestEvents', async (_client, batch, sessionId) => {
    steps.push(['ingest', batch.token, sessionId])
    lastToken = batch.token
  })
  const refreshed = { token: '3', events: [{ operation: 'add' }, { operation: 'mod' }], valid_ref_counts: {} }
  t.mock.method(EventStore.prototype, 'eventsFrom', async (_client, token) => {
    steps.push(['read', token, lastToken])
    return refreshed
  })

  const calls = []
  const createTransport = await createPgTransport('postgres://localhost/test', () => async (method, params) => {
    calls.push([method, params])
    if (method === 'system.listMethods') return ['pool.get_all_records']
    if (method === 'pool.get_all_records') return { 'OpaqueRef:pool': { uuid: 'pool-uuid' } }
    if (method === 'event.from') {
      steps.push(['rpc', params])
      return { token: '3', events: [], valid_ref_counts: {} }
    }
    throw new Error(`unexpected RPC: ${method}`)
  })
  const transport = createTransport({})
  await transport('pool.get_all_records', ['session'])
  calls.length = 0
  steps.length = 0
  lastToken = '2'

  assert.strictEqual(await transport('event.from', ['session', ['pool'], '1', 5]), refreshed)
  assert.deepStrictEqual(calls, [['event.from', ['session', ['pool'], '2', 5]]])
  assert.deepStrictEqual(steps, [
    ['rpc', ['session', ['pool'], '2', 5]],
    ['ingest', '3', 'session'],
    ['read', '1', '3'],
  ])
})
