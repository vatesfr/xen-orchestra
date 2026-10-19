import assert from 'node:assert/strict'
import EventEmitter from 'node:events'
import { afterEach, describe, it, mock } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { configure } from '@xen-orchestra/log/configure'

configure({ level: 'FATAL', transport: () => {} })

// value of `xapiMarkDisconnectedDelay`: the grace period between an event
// fetching error and the pool being marked disconnected
const DELAY = 100

const xapis = []

class FakeXapi extends EventEmitter {
  objects = Object.assign(new EventEmitter(), { all: {} })
  objectsFetched = Promise.resolve()
  pool = { $id: 'pool-1', $ref: 'OpaqueRef:pool', master: 'OpaqueRef:master', other_config: {}, uuid: 'pool-1' }
  // avoids the pool marking
  readOnly = true
  status = 'connected'

  constructor() {
    super()
    xapis.push(this)
  }

  async connect() {}

  async disconnect() {
    this.status = 'disconnected'
    this.emit('disconnected')
  }

  getObjectByRef() {
    return { uuid: 'host-1' }
  }

  _interruptOnDisconnect(promise) {
    return promise
  }

  watchEvents() {}
}

const xapiModuleUrl = new URL('../xapi/index.mjs', import.meta.url).href
const { default: _, ...xapiNamedExports } = await import(xapiModuleUrl)
mock.module(xapiModuleUrl, { defaultExport: FakeXapi, namedExports: xapiNamedExports })

const { default: XenServers } = await import('./xen-servers.mjs')

const createXenServers = () => {
  xapis.length = 0

  const resolved = async () => {}
  const app = {
    addConfigManager() {},
    config: {
      get: key =>
        key === 'xapiOptions'
          ? { poolMarkingInterval: '1 hour', poolMarkingMaxAge: '1 hour', poolMarkingPrefix: 'xo:' }
          : undefined,
      getOptional() {},
      watchDuration: (_, cb) => cb(DELAY),
    },
    emit() {},
    hooks: new EventEmitter(),
    httpRequest() {},
    _objects: { set() {}, unset() {} },
    _redis: {
      del: resolved,
      get: async () => null,
      keys: async () => [],
      sAdd: resolved,
      set: resolved,
      sMembers: resolved,
    },
  }
  const xenServers = new XenServers(app, { safeMode: true })
  app.hooks.emit('core started')

  const stored = {
    'server-1': {
      id: 'server-1',
      enabled: true,
      host: '192.0.2.1',
      password: 'secret',
      status: 'disconnected',
      username: 'root',
    },
  }
  xenServers._servers = {
    first: async id => (stored[id] === undefined ? undefined : { ...stored[id] }),
    update: async model => {
      Object.assign(stored[model.id], model)
    },
  }
  xenServers._autoReconnectXenServer = () => {}

  const getStatus = () => stored['server-1'].status

  return { getStatus, xenServers }
}

describe('grace period before marking a pool disconnected', function () {
  // stops the pool marking interval of the connections left open
  afterEach(async function () {
    for (const xapi of xapis) {
      if (xapi.status !== 'disconnected') {
        await xapi.disconnect()
      }
    }
    await sleep(10)
  })

  it('keeps the connection when events are fetched again in time', async function () {
    const { getStatus, xenServers } = createXenServers()
    await xenServers.connectXenServer('server-1')

    xapis[0].emit('eventFetchingError', new Error('ETIMEDOUT'))
    xapis[0].emit('eventFetchingSuccess')
    await sleep(DELAY * 2)

    assert.equal(getStatus(), 'connected')
    assert.equal(xenServers._serverIdsByPool['pool-1'], 'server-1')
  })

  it('marks the server connecting after the grace period, and connected once events are back', async function () {
    const { getStatus, xenServers } = createXenServers()
    await xenServers.connectXenServer('server-1')

    xapis[0].emit('eventFetchingError', new Error('ETIMEDOUT'))
    await sleep(DELAY * 2)
    assert.equal(getStatus(), 'connecting')
    assert.equal(xenServers._serverIdsByPool['pool-1'], undefined)

    xapis[0].emit('eventFetchingSuccess')
    await sleep(10)
    assert.equal(getStatus(), 'connected')
    assert.equal(xenServers._serverIdsByPool['pool-1'], 'server-1')
  })

  it('does not mark a disconnected server connecting, which would stop the auto-reconnect loop', async function () {
    const { getStatus, xenServers } = createXenServers()
    await xenServers.connectXenServer('server-1')

    xapis[0].emit('eventFetchingError', new Error('ECONNREFUSED'))
    // e.g. `SESSION_INVALID` after a toolstack restart
    await xapis[0].disconnect()
    await sleep(DELAY * 2)

    assert.equal(getStatus(), 'disconnected')
  })

  it('does not break the connection that replaced a disconnected one', async function () {
    const { getStatus, xenServers } = createXenServers()
    await xenServers.connectXenServer('server-1')

    xapis[0].emit('eventFetchingError', new Error('ECONNREFUSED'))
    await xapis[0].disconnect()
    await sleep(10)
    // auto-reconnection
    await xenServers.connectXenServer('server-1', { enable: false })
    await sleep(DELAY * 2)

    assert.equal(getStatus(), 'connected')
    assert.equal(xenServers._serverIdsByPool['pool-1'], 'server-1')
  })
})
