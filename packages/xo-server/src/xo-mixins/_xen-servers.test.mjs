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

// `_servers` is normally created on the `core started` hook, and
// `_autoReconnectXenServer` would start a real reconnection loop
const createXenServers = (server = SERVER) => {
  const xenServers = new XenServers(createMockApp(), { safeMode: true })

  const stored = { ...server }
  const updates = []
  const reconnected = []

  xenServers._servers = {
    first: async () => ({ ...stored }),
    update: async model => {
      updates.push({ ...model })
      Object.assign(stored, model)
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
