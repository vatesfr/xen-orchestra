import assert from 'node:assert/strict'
import EventEmitter from 'node:events'
import { afterEach, describe, it, mock } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { configure } from '@xen-orchestra/log/configure'

configure({ level: 'FATAL', transport: () => {} })

// value of both `xapiMarkDisconnectedDelay` and `xapiStaleObjectsMaxAge`
const DELAY = 100
const LAST_SEEN = 1e12

const xapis = []
// XAPI objects provided by the next connection
let nextXapiObjects

const xapiObject = ($type, $id) => ({ $id, $ref: `OpaqueRef:${$id}`, $type })

class FakeXapi extends EventEmitter {
  lastEventFetchedTimestamp = LAST_SEEN
  objectsFetched = Promise.resolve()
  pool = { $id: 'pool-1', $ref: 'OpaqueRef:pool-1', master: 'OpaqueRef:master', other_config: {}, uuid: 'pool-1' }
  // avoids the pool marking
  readOnly = true
  status = 'connected'

  constructor() {
    super()
    this.objects = Object.assign(new EventEmitter(), {
      all: Object.fromEntries(nextXapiObjects.map(object => [object.$id, object])),
    })
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

  // `lastEventFetchedTimestamp` is old, as after an event fetching error
  watchEventsError = new Error('ETIMEDOUT')
}

const xapiModuleUrl = new URL('../xapi/index.mjs', import.meta.url).href
const { default: _, ...xapiNamedExports } = await import(xapiModuleUrl)
mock.module(xapiModuleUrl, { defaultExport: FakeXapi, namedExports: xapiNamedExports })
mock.module(new URL('../xapi-object-to-xo.mjs', import.meta.url).href, {
  defaultExport: ({ $id, $ref, $type }) => ({ id: $id, type: $type, $pool: 'pool-1', _xapiRef: $ref }),
})

const { default: XenServers } = await import('./xen-servers.mjs')

const createXenServers = () => {
  xapis.length = 0
  nextXapiObjects = [xapiObject('pool', 'pool-1'), xapiObject('VM', 'vm-1'), xapiObject('VM', 'vm-2')]

  const xoObjects = new Map()
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
    getObject: id => xoObjects.get(id),
    hooks: new EventEmitter(),
    httpRequest() {},
    _objects: {
      get: (id, defaultValue) => (xoObjects.has(id) ? xoObjects.get(id) : defaultValue),
      set: (id, value) => xoObjects.set(id, value),
      unset: id => {
        assert(xoObjects.delete(id), `no such object ${id}`)
      },
    },
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

  const lastSeenById = () => Object.fromEntries([...xoObjects].map(([id, object]) => [id, object.$lastSeen]))

  return { lastSeenById, xenServers }
}

describe('objects of a lost connection', function () {
  // stops the pool marking interval of the connections left open
  afterEach(async function () {
    for (const xapi of xapis) {
      if (xapi.status !== 'disconnected') {
        await xapi.disconnect()
      }
    }
    await sleep(DELAY * 2)
  })

  it('are flagged after the grace period, and unflagged once events are back', async function () {
    const { lastSeenById, xenServers } = createXenServers()
    await xenServers.connectXenServer('server-1')

    xapis[0].emit('eventFetchingError', new Error('ETIMEDOUT'))
    await sleep(DELAY * 1.5)
    assert.deepEqual(lastSeenById(), { 'pool-1': LAST_SEEN, 'vm-1': LAST_SEEN, 'vm-2': LAST_SEEN })

    xapis[0].emit('eventFetchingSuccess')
    assert.deepEqual(lastSeenById(), { 'pool-1': undefined, 'vm-1': undefined, 'vm-2': undefined })
  })

  it('are removed when the pool stays unreachable longer than the max age', async function () {
    const { lastSeenById, xenServers } = createXenServers()
    await xenServers.connectXenServer('server-1')

    xapis[0].emit('eventFetchingError', new Error('ETIMEDOUT'))
    await sleep(DELAY * 2.5)
    assert.deepEqual(lastSeenById(), {})

    // the connection recovers from scratch
    xapis[0].emit('eventFetchingSuccess')
    assert.deepEqual(lastSeenById(), { 'pool-1': undefined, 'vm-1': undefined, 'vm-2': undefined })
  })

  it('are kept on an unexpected disconnection, then reconciled by the next connection', async function () {
    const { lastSeenById, xenServers } = createXenServers()
    await xenServers.connectXenServer('server-1')

    // e.g. `SESSION_INVALID` after a toolstack restart
    await xapis[0].disconnect()
    await sleep(10)
    assert.deepEqual(lastSeenById(), { 'pool-1': LAST_SEEN, 'vm-1': LAST_SEEN, 'vm-2': LAST_SEEN })

    await assert.rejects(
      async () => xenServers.getXenServerIdByObject('vm-1'),
      /the pool of object vm-1 is disconnected, last seen at /
    )

    // `vm-2` has been destroyed in the meantime
    nextXapiObjects = [xapiObject('pool', 'pool-1'), xapiObject('VM', 'vm-1')]
    await xenServers.connectXenServer('server-1', { enable: false })
    assert.deepEqual(lastSeenById(), { 'pool-1': undefined, 'vm-1': undefined })
    assert.equal(xenServers.getXenServerIdByObject('vm-1'), 'server-1')
  })

  it('are removed after the max age when the server does not reconnect', async function () {
    const { lastSeenById, xenServers } = createXenServers()
    await xenServers.connectXenServer('server-1')

    await xapis[0].disconnect()
    await sleep(DELAY * 1.5)
    assert.deepEqual(lastSeenById(), {})
  })

  it('are removed on a deliberate disconnection', async function () {
    const { lastSeenById, xenServers } = createXenServers()
    await xenServers.connectXenServer('server-1')

    await xenServers.disconnectXenServer('server-1')
    assert.deepEqual(lastSeenById(), {})
  })

  it('are removed on a deliberate disconnection of a server already lost', async function () {
    const { lastSeenById, xenServers } = createXenServers()
    await xenServers.connectXenServer('server-1')

    await xapis[0].disconnect()
    await sleep(10)
    await xenServers.disconnectXenServer('server-1')
    assert.deepEqual(lastSeenById(), {})
  })
})
