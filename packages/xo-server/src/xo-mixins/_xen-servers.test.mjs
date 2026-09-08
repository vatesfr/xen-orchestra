import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { configure } from '@xen-orchestra/log/configure'

import XenServers from './xen-servers.mjs'

configure({ level: 'FATAL', transport: () => {} })

// Minimal XoApp mock: the constructor only registers hooks and watches a config
// duration, none of which are fired by these tests
const createMockApp = () => ({
  config: { watchDuration: () => {} },
  hooks: { on: () => {} },
})

const SERVER = { id: 'server-1', enabled: true, host: '192.0.2.1', password: 'secret', username: 'root' }

// `poolId` defaults to the pool the connection was opened with, `$id` is the
// one it currently reports (they differ after a pool UUID change)
const createXapi = ({ $id = 'pool-1' } = {}) => ({
  disconnect: async () => {},
  getObjectByRef: () => ({ uuid: 'host-1' }),
  pool: { $id, master: 'OpaqueRef:master', uuid: $id },
})

// `_servers` is normally created on the `core started` hook, and
// `_autoReconnectXenServer` would start a real reconnection loop
const createXenServers = (...servers) => {
  const xenServers = new XenServers(createMockApp(), { safeMode: true })

  const stored = { __proto__: null }
  const serversToInitialize = servers.length === 0 ? [SERVER] : servers

  for (const server of serversToInitialize) {
    stored[server.id] = { ...server }
  }
  const updates = []
  const reconnected = []

  xenServers._servers = {
    first: async id => (stored[id] === undefined ? undefined : { ...stored[id] }),
    update: async model => {
      updates.push({ ...model })
      Object.assign(stored[model.id], model)
    },
  }
  xenServers._autoReconnectXenServer = id => reconnected.push(id)

  return { reconnected, updates, xenServers }
}

describe('updateXenServer', function () {
  it('does not arm the auto-reconnect loop on the internal error bookkeeping write', async function () {
    const { reconnected, updates, xenServers } = createXenServers()

    // `_connectXenServer` writes the error of every failed attempt: re-arming
    // the loop here restarts one which just stopped on a permanent error
    await xenServers.updateXenServer('server-1', { error: new Error('this pool is already connected') })

    assert.equal(updates.length, 1, 'the error must still be persisted')
    assert.deepEqual(reconnected, [])
  })

  it('does not arm the auto-reconnect loop when the error is cleared', async function () {
    const { reconnected, xenServers } = createXenServers({ ...SERVER, error: { message: 'boom' } })

    await xenServers.updateXenServer('server-1', { error: null })

    assert.deepEqual(reconnected, [])
  })

  it('does not arm the auto-reconnect loop on an unrelated property', async function () {
    const { reconnected, updates, xenServers } = createXenServers()

    await xenServers.updateXenServer('server-1', { label: 'new label' })

    assert.equal(updates.length, 1)
    assert.deepEqual(reconnected, [])
  })

  it('arms the auto-reconnect loop when the server is enabled', async function () {
    const { reconnected, xenServers } = createXenServers({ ...SERVER, enabled: false })

    await xenServers.updateXenServer('server-1', { enabled: true })

    assert.deepEqual(reconnected, ['server-1'])
  })

  it('arms the auto-reconnect loop when the credentials or the address change', async function () {
    for (const properties of [{ host: '192.0.2.2' }, { password: 'new secret' }, { username: 'admin' }]) {
      const { reconnected, xenServers } = createXenServers()

      await xenServers.updateXenServer('server-1', properties)

      assert.deepEqual(reconnected, ['server-1'], `expected a reconnection for ${JSON.stringify(properties)}`)
    }
  })

  it('does not arm the auto-reconnect loop while the server is already connecting', async function () {
    const { reconnected, xenServers } = createXenServers({ ...SERVER, enabled: false })
    xenServers._connectingXenServers.add('server-1')

    await xenServers.updateXenServer('server-1', { enabled: true })

    assert.deepEqual(reconnected, [])
  })
})

describe('disconnectXenServer', function () {
  const connect = (xenServers, { poolId = 'pool-1', serverId = 'server-1' } = {}) => {
    xenServers._xapis[serverId] = createXapi({ $id: poolId })
    xenServers._serverIdsByPool[poolId] = serverId
  }

  it('forgets the pool of the server', async function () {
    const { xenServers } = createXenServers()
    connect(xenServers)

    await xenServers.disconnectXenServer('server-1')

    assert.deepEqual({ ...xenServers._serverIdsByPool }, {})
    assert.equal(xenServers._xapis['server-1'], undefined)
  })

  it('forgets the pool of the server even after a pool UUID change', async function () {
    const { xenServers } = createXenServers()
    connect(xenServers, { poolId: 'pool-1' })
    // `_onXenAdd` re-registers the server under the new identifier
    delete xenServers._serverIdsByPool['pool-1']
    xenServers._serverIdsByPool['pool-2'] = 'server-1'

    await xenServers.disconnectXenServer('server-1')

    assert.deepEqual({ ...xenServers._serverIdsByPool }, {})
  })

  it('does not drop the connection of the server holding the pool', async function () {
    // a second entry registered on an already connected pool stays `enabled`
    // but disconnected, with a `PoolAlreadyConnected` error: disconnecting or
    // deleting it must not release the pool of the server which owns it
    const { xenServers } = createXenServers(SERVER, { ...SERVER, id: 'server-2' })
    connect(xenServers)
    const xapi = xenServers._xapis['server-1']

    await xenServers.disconnectXenServer('server-2')

    assert.deepEqual({ ...xenServers._serverIdsByPool }, { 'pool-1': 'server-1' })
    assert.equal(xenServers._xapis['server-1'], xapi)
    assert.equal(xenServers._getXenServerStatus('server-1'), 'connected')
  })

  it('leaves the pools of the other servers alone', async function () {
    const { xenServers } = createXenServers()
    connect(xenServers)
    connect(xenServers, { poolId: 'pool-2', serverId: 'server-2' })

    await xenServers.disconnectXenServer('server-1')

    assert.deepEqual({ ...xenServers._serverIdsByPool }, { 'pool-2': 'server-2' })
  })
})
