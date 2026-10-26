import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'

import Ajv from 'ajv'

import createPlugin, { docId, importStore, mergeMonitor, publishedPolicy } from './index.mjs'

const POOL = 'pool-1'

// XO's store (subleveldown over level-party): JSON values, notFound errors
function fakeStore(initial = {}) {
  const data = new Map(Object.entries(structuredClone(initial)))
  return {
    data,
    async has(key) {
      return data.has(key)
    },
    async get(key) {
      if (!data.has(key)) {
        throw Object.assign(new Error('not found'), { notFound: true })
      }
      return structuredClone(data.get(key))
    },
    async put(key, value) {
      data.set(key, structuredClone(value))
    },
    async del(key) {
      data.delete(key)
    },
    async *createReadStream() {
      for (const [key, value] of [...data.entries()].sort()) {
        yield { key, value: structuredClone(value) }
      }
    },
    async *createKeyStream() {
      yield* [...data.keys()].sort()
    },
  }
}

const ADMIN = { id: 'admin', email: 'admin@example.org', permission: 'admin' }

// pools of one host each, whose agent writes what it's asked to publish;
// `vms` are XO's VM objects, `acls` [userId, poolId, permission] entries
// `agent.beforePublish(poolId)` runs before a publish lands (to interleave
// another write), `agent.refuse` lists pools whose agent refuses publishes.
// `lag` (ms, or a function giving each write's): XO's cached pool record
// changes that long after a write returns, as XAPI's events bring it
// (vdf#32); none by default.
function fakeXo({
  store = fakeStore(),
  otherConfig = {},
  pools = { [POOL]: { otherConfig } },
  vms = [],
  acls = [],
  agent = {},
  lag,
} = {}) {
  const later = fn => (lag === undefined ? fn() : setTimeout(fn, typeof lag === 'function' ? lag() : lag))
  // one unlocked VIF per VM, device 0, unless it lists its own: agents
  // count no address the guest reports for a device with no VIF
  const vifObjects = {}
  for (const vm of vms) {
    vm.VIFs ??= [`${vm.id}/vif0`]
    for (const id of vm.VIFs) {
      vifObjects[id] ??= { id, type: 'VIF', device: '0', lockingMode: 'network_default' }
    }
  }
  const calls = []
  const poolObjects = {}
  const xapis = {}
  const servers = new Set()
  for (const [id, { otherConfig = {} }] of Object.entries(pools)) {
    poolObjects[id] = { id, type: 'pool', name_label: `Pool ${id}` }
    servers.add(`server-${id}`)
    const xapi = {
      pool: {
        other_config: { ...otherConfig },
        master: 'OpaqueRef:master',
        async update_other_config(key, value) {
          later(() => {
            const { [key]: _, ...rest } = xapi.pool.other_config
            xapi.pool.other_config = value === null ? rest : { ...rest, [key]: value }
          })
        },
      },
      objects: { all: {} },
      getObjectByRef: () => undefined,
      async call(method, hostRef, plugin, fn, args) {
        calls.push({ pool: id, fn, args })
        if (fn === 'publish') {
          await agent.beforePublish?.(id)
          if (agent.refuse?.includes(id)) {
            return JSON.stringify({ ok: false, published: false, error: 'refused by the agent', warnings: [] })
          }
          later(() => (xapi.pool.other_config = { ...xapi.pool.other_config, 'vdf:policy': args.policy }))
          return JSON.stringify({ ok: true, published: true, document: docId(args.policy), warnings: [] })
        }
        return JSON.stringify({ ok: true, warnings: [] })
      },
    }
    xapis[id] = xapi
  }
  const configManagers = {}
  let routes = []
  const xo = {
    calls,
    xapi: xapis[Object.keys(pools)[0]],
    xapis,
    store,
    configManagers,
    // XO loses the pool: its objects go, its server stays
    disconnect(poolId) {
      delete poolObjects[poolId]
      delete xapis[poolId]
    },
    removeServer(poolId) {
      servers.delete(`server-${poolId}`)
    },
    getStore: async () => store,
    registerRestRoutes(newRoutes) {
      routes = newRoutes
      return () => {
        routes = []
      }
    },
    addConfigManager(id, exporter, importer) {
      configManagers[id] = { exporter, importer }
    },
    objects: { on() {}, removeListener() {} },
    getObjects: ({ filter }) =>
      filter.type === 'pool'
        ? { ...poolObjects }
        : filter.type === 'VM'
          ? Object.fromEntries(vms.filter(vm => poolObjects[vm.$pool] !== undefined).map(vm => [vm.id, vm]))
          : {},
    getObject(id, type) {
      const object = type === 'VIF' ? vifObjects[id] : poolObjects[id]
      if (object === undefined) {
        throw new Error('no such object')
      }
      return object
    },
    getXapi(id) {
      if (xapis[id] === undefined) {
        throw new Error('no such object')
      }
      return xapis[id]
    },
    getXenServerIdByObject: pool => `server-${pool.id}`,
    getAllXenServers: async () => [...servers].map(id => ({ id })),
    hasPermissions: async (userId, [[objectId, permission]]) =>
      acls.some(acl => acl[0] === userId && acl[1] === objectId && acl[2] === permission),
    async route(method, endpoint, { params = {}, body, query = {}, user = ADMIN } = {}) {
      const route = routes.find(route => route.method === method && route.endpoint === endpoint)
      assert.ok(route, `${method} ${endpoint}`)
      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code
          return this
        },
      }
      const result = await route.callback({
        req: { params, body, query },
        res,
        restApi: { getCurrentUser: () => user },
        createAction: cb => cb(),
      })
      return { result, status: res.statusCode }
    },
  }
  return xo
}

async function loaded(xo) {
  const plugin = createPlugin({ xo })
  await plugin.load()
  return plugin
}

const document = (rulePort = 22) => ({
  groups: { web: { tags: ['vdf:role=web'] } },
  policies: [
    {
      name: 'web',
      appliedTo: 'web',
      default: 'drop',
      ingress: [{ id: 1, from: 'any', proto: 'tcp', ports: [rulePort] }],
    },
  ],
})

const text = doc => JSON.stringify(doc, null, 2)

// vdf#42: installed is not enabled, and unloading removes everything
describe('tech preview', () => {
  test('stays unloaded until an administrator opts in', () => {
    // where xo-server's registerPlugin looks for it
    const validate = new Ajv().compile(createPlugin.configurationSchema)
    // xo-server tries an empty configuration first: it must fail
    assert.equal(validate({}), false)
    assert.equal(validate({ enableTechPreview: false }), false)
    assert.equal(validate({ enableTechPreview: true }), true)
  })

  test('answers on /info while loaded, nothing once unloaded', async () => {
    const xo = fakeXo()
    const plugin = await loaded(xo)
    assert.deepEqual((await xo.route('get', '/info', { user: { id: 'user', permission: 'none' } })).result, {
      techPreview: true,
    })
    plugin.unload()
    await assert.rejects(xo.route('get', '/info'))
  })
})

// the newest key whose base matches, as agents pick it (agent/inventory.go)
describe('publishedPolicy', () => {
  // bases computed by the agent's v3Base, v4Base and v5Base for these values
  const oc = {
    'vdf:policy': 'v1doc',
    'vdf:policy.v2': 'v2doc',
    'vdf:policy.v3': 'v3doc',
    'vdf:policy.v3.base': '372830f99f0a70fb',
    'vdf:policy.v4': '{"policies":[]}',
    'vdf:policy.v4.base': '982287995cc30ab0',
  }
  const withV5 = {
    ...oc,
    'vdf:policy.v5': '{"policies":[],"version":5}',
    'vdf:policy.v5.base': '770a770ef447f88c',
  }

  test('a v4 document with its base comes first', () => {
    const published = publishedPolicy(oc)
    assert.equal(published.key, 'vdf:policy.v4')
    assert.deepEqual(published.document, { policies: [] })
  })

  test('a v4 document whose base no longer matches loses to v3', () => {
    // v3 published since by an agent before monitor mode: v3 is the newer intent
    assert.equal(publishedPolicy({ ...oc, 'vdf:policy.v3': 'v3new' }).key, 'vdf:policy.v3')
    assert.equal(publishedPolicy({ ...oc, 'vdf:policy.v4.base': 'stale' }).key, 'vdf:policy.v3')
  })

  test('a v6 document (egress) with its base comes first', () => {
    const withV6 = {
      ...withV5,
      'vdf:policy.v6': '{"policies":[],"version":6}',
      'vdf:policy.v6.base': '663d3b4c292f2300',
    }
    assert.equal(publishedPolicy(withV6).key, 'vdf:policy.v6')
    // v5 published since by an agent before egress
    assert.equal(publishedPolicy({ ...withV6, 'vdf:policy.v5': 'v5new' }).key, 'vdf:policy.v5')
  })

  test('a v5 document (port ranges) with its base comes first', () => {
    assert.equal(publishedPolicy(withV5).key, 'vdf:policy.v5')
    // v4 published since by an agent before port ranges
    assert.equal(publishedPolicy({ ...withV5, 'vdf:policy.v4': '{"policies":[{}]}' }).key, 'vdf:policy.v4')
    assert.equal(publishedPolicy({ ...withV5, 'vdf:policy.v5.base': 'stale' }).key, 'vdf:policy.v4')
  })
})

describe('mergeMonitor', () => {
  const entry = fields => ({
    src: '10.0.0.7',
    vm: 'vm-db',
    vmName: 'db',
    proto: 'tcp',
    port: 22,
    policy: 'db-strict',
    tier: 'application',
    rule: 2,
    ...fields,
  })

  test('a VM that moved: one entry, counts added, first and last over hosts', () => {
    const merged = mergeMonitor([
      {
        host: 'h1',
        entries: [entry({ count: 3, first: '2026-10-24T08:00:00Z', last: '2026-10-24T09:00:00Z', vmName: 'db-old' })],
      },
      {
        host: 'h2',
        entries: [entry({ count: 2, first: '2026-10-24T09:30:00Z', last: '2026-10-24T10:00:00Z', expired: true })],
      },
      { host: 'h3', error: 'host is not live' },
    ])
    assert.equal(merged.length, 1)
    assert.deepEqual(
      {
        count: merged[0].count,
        first: merged[0].first,
        last: merged[0].last,
        vmName: merged[0].vmName,
        hosts: merged[0].hosts,
        expired: merged[0].expired,
      },
      {
        count: 5,
        first: '2026-10-24T08:00:00Z',
        last: '2026-10-24T10:00:00Z',
        vmName: 'db',
        hosts: ['h1', 'h2'],
        expired: false,
      }
    )
  })

  test('interfaces and egress destinations stay apart (vdf#36, vdf#53)', () => {
    const at = { count: 1, first: 'a', last: '2026-10-24T09:00:00Z' }
    const merged = mergeMonitor([
      {
        host: 'h1',
        entries: [
          entry({ ...at, vif: 'vif-0' }),
          entry({ ...at, vif: 'vif-1' }),
          entry({ ...at, egress: true, dst: '192.0.2.1' }),
          entry({ ...at, egress: true, dst: '192.0.2.2' }),
        ],
      },
    ])
    assert.equal(merged.length, 4)
  })

  test('distinct flows stay apart, most recently seen first', () => {
    const merged = mergeMonitor([
      {
        host: 'h1',
        entries: [
          entry({ count: 1, first: 'a', last: '2026-10-24T09:00:00Z' }),
          entry({ port: 9100, rule: 0, count: 1, first: 'a', last: '2026-10-24T10:00:00Z' }),
        ],
      },
    ])
    assert.deepEqual(
      merged.map(e => e.port),
      [9100, 22]
    )
  })
})

describe('pool publish', () => {
  test('refused, nothing written, when the pool changed since the edit started', async () => {
    const xo = fakeXo({ otherConfig: { 'vdf:policy': text(document(22)) } })
    const plugin = await loaded(xo)
    try {
      const before = { ...xo.xapi.pool.other_config }

      const { result } = await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: POOL },
        body: { policy: text(document(80)), expectedDocId: 'stale0000000' },
      })

      assert.equal(result.published, false)
      assert.equal(result.conflict, true)
      assert.equal(result.docId, publishedPolicy(before).docId)
      assert.deepEqual(xo.xapi.pool.other_config, before)
      assert.equal(
        xo.calls.some(call => call.fn === 'publish'),
        false
      )
      assert.deepEqual((await xo.route('get', '/pools/{id}/history', { params: { id: POOL } })).result.entries, [])
    } finally {
      plugin.unload()
    }
  })

  test('nothing published yet: the expected id is empty', async () => {
    const xo = fakeXo()
    const plugin = await loaded(xo)
    try {
      const refused = await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: POOL },
        body: { policy: text(document()), expectedDocId: 'abc' },
      })
      assert.equal(refused.result.conflict, true)

      const { result } = await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: POOL },
        body: { policy: text(document()), expectedDocId: '' },
      })
      assert.equal(result.published, true)
    } finally {
      plugin.unload()
    }
  })

  test('published from the expected document: recorded in the history, with what it replaced', async () => {
    const xo = fakeXo({ otherConfig: { 'vdf:policy': text(document(22)) } })
    const plugin = await loaded(xo)
    try {
      const expectedDocId = publishedPolicy(xo.xapi.pool.other_config).docId

      const { result } = await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: POOL },
        body: { policy: text(document(80)), expectedDocId },
      })
      assert.equal(result.published, true)

      const { entries } = (await xo.route('get', '/pools/{id}/history', { params: { id: POOL } })).result
      assert.equal(entries.length, 2)
      const [first, second] = entries
      // what the pool held before XO kept a history
      assert.equal(first.docId, expectedDocId)
      assert.equal(first.publishedAt, null)
      assert.equal(second.previousDocId, expectedDocId)
      assert.equal(second.docId, result.document)
      assert.equal(second.publishedBy, 'admin@example.org')
      assert.equal(second.summary.modified, 1)
      assert.equal(second.document, undefined)

      const version = (await xo.route('get', '/pools/{id}/history/{entry}', { params: { id: POOL, entry: '2' } }))
        .result
      assert.deepEqual(version.document.policies[0].ingress[0].ports, [80])
      assert.equal(version.previous.docId, expectedDocId)

      const missing = await xo.route('get', '/pools/{id}/history/{entry}', { params: { id: POOL, entry: '9' } })
      assert.equal(missing.status, 404)

      // publishing the same document again adds nothing
      await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: POOL },
        body: { policy: text(document(80)), expectedDocId: result.document },
      })
      assert.equal((await xo.route('get', '/pools/{id}/history', { params: { id: POOL } })).result.entries.length, 2)
    } finally {
      plugin.unload()
    }
  })
})

describe('global publish', () => {
  const globalBody = (revision, port = 22) => ({
    policy: text(document(port)),
    scope: { all: true },
    revision,
  })

  test('refused from an older revision, recorded in the history otherwise', async () => {
    const xo = fakeXo()
    const plugin = await loaded(xo)
    try {
      const first = (await xo.route('post', '/global/actions/publish', { body: globalBody(0) })).result
      assert.equal(first.published, true)
      assert.equal(first.revision, 1)

      // like a pool publish: a conflict the UI rebases, nothing written
      const stale = (await xo.route('post', '/global/actions/publish', { body: globalBody(0, 80) })).result
      assert.deepEqual([stale.published, stale.conflict, stale.revision], [false, true, 1])
      const blind = (await xo.route('post', '/global/actions/publish', { body: globalBody(undefined, 80) })).result
      assert.deepEqual([blind.published, blind.conflict], [false, true])

      await xo.route('post', '/global/actions/publish', { body: globalBody(1, 80) })

      const { entries } = (await xo.route('get', '/global/history')).result
      assert.deepEqual(
        entries.map(entry => [entry.id, entry.revision, entry.publishedBy]),
        [
          [1, 1, 'admin@example.org'],
          [2, 2, 'admin@example.org'],
        ]
      )
      const version = (await xo.route('get', '/global/history/{entry}', { params: { entry: '2' } })).result
      assert.deepEqual(version.scope, { all: true })
      assert.equal(version.previous.revision, 1)
    } finally {
      plugin.unload()
    }
  })

  test('sync results survive a restart, the stored configuration starts the history', async () => {
    const store = fakeStore()
    const xo = fakeXo({ store })
    const plugin = await loaded(xo)
    await xo.route('post', '/global/actions/publish', { body: globalBody(0) })
    plugin.unload()
    await store.del('history:global')

    const restarted = fakeXo({ store, otherConfig: xo.xapi.pool.other_config })
    const plugin2 = await loaded(restarted)
    try {
      const status = (await restarted.route('get', '/global')).result
      assert.equal(status.pools[0].sync.ok, true)
      assert.equal(status.pools[0].sync.revision, 1)

      const { entries } = (await restarted.route('get', '/global/history')).result
      assert.deepEqual(
        entries.map(entry => entry.revision),
        [1]
      )
    } finally {
      plugin2.unload()
    }
  })
})

describe('across pools', () => {
  const globalDocument = {
    groups: { web: { tags: ['vdf:role=web'] } },
    policies: [
      { name: 'web', appliedTo: 'web', default: 'drop', ingress: [{ id: 1, from: 'web', proto: 'tcp', ports: [80] }] },
    ],
  }
  const publishGlobal = (xo, revision) =>
    xo.route('post', '/global/actions/publish', {
      body: { policy: text(globalDocument), scope: { all: true }, revision },
    })
  const webVm = {
    id: 'vm-a1',
    name_label: 'web-1',
    $pool: 'A',
    power_state: 'Running',
    tags: ['vdf:role=web'],
    addresses: { '0/ipv4/0': '10.0.0.5' },
  }
  const ipsIn = (xo, poolId) => JSON.parse(xo.xapis[poolId].pool.other_config['vdf:policy']).groups['global:web'].ips

  test('a pool XO loses keeps its members in the others until its server is removed', async () => {
    const xo = fakeXo({ pools: { A: {}, B: {} }, vms: [webVm] })
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo, 0)
      assert.deepEqual(ipsIn(xo, 'B'), ['10.0.0.5'])

      xo.disconnect('A')
      const status = (await xo.route('get', '/global')).result
      assert.deepEqual(
        status.pools.map(pool => [pool.id, pool.state]),
        [
          ['B', 'in-sync'],
          ['A', 'unreachable'],
        ]
      )
      assert.equal(status.members.web[0].stale, true)

      const republished = (await publishGlobal(xo, 1)).result
      assert.equal(republished.ok, true)
      assert.equal(republished.pools.find(pool => pool.id === 'A').unreachable, true)
      assert.deepEqual(ipsIn(xo, 'B'), ['10.0.0.5'])

      xo.removeServer('A')
      await publishGlobal(xo, 2)
      assert.deepEqual(ipsIn(xo, 'B'), [])
      assert.deepEqual(
        (await xo.route('get', '/global')).result.pools.map(pool => pool.id),
        ['B']
      )
    } finally {
      plugin.unload()
    }
  })

  test("a pool holding another XO's global part is left alone until taken over", async () => {
    const otherGlobal = text({ groups: { 'global:theirs': { ips: ['192.0.2.1'] } }, policies: [] })
    const xo = fakeXo({
      pools: {
        A: {},
        B: { otherConfig: { 'vdf:policy': otherGlobal, 'vdf:global.owner': '{"id":"other","name":"xo-other"}' } },
      },
    })
    const plugin = await loaded(xo)
    try {
      const result = (await publishGlobal(xo, 0)).result
      assert.equal(result.ok, true)
      assert.equal(result.pools.find(pool => pool.id === 'B').otherXo, true)
      assert.equal(
        xo.calls.some(call => call.pool === 'B' && call.fn === 'publish'),
        false
      )
      const ours = JSON.parse(xo.xapis.A.pool.other_config['vdf:global.owner'])
      assert.equal(ours.id, (await xo.route('get', '/global')).result.instance.id)

      const status = (await xo.route('get', '/global')).result
      assert.deepEqual(
        status.pools.map(pool => [pool.id, pool.state, pool.owner]),
        [
          ['A', 'in-sync', undefined],
          ['B', 'other-xo', 'xo-other'],
        ]
      )

      // the pool's own edits keep the other XO's part
      await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: 'B' },
        body: { policy: text(document()) },
      })
      const published = JSON.parse(xo.xapis.B.pool.other_config['vdf:policy'])
      assert.deepEqual(Object.keys(published.groups), ['global:theirs', 'web'])

      // refused if the owner isn't the one the user saw
      const refused = await xo.route('post', '/pools/{id}/actions/take_over_global', {
        params: { id: 'B' },
        body: { expectedOwner: '' },
      })
      assert.deepEqual([refused.status, refused.result.conflict, refused.result.owner.id], [409, true, 'other'])
      assert.equal(status.pools[1].ownerId, 'other')

      const { previous } = (
        await xo.route('post', '/pools/{id}/actions/take_over_global', {
          params: { id: 'B' },
          body: { expectedOwner: 'other' },
        })
      ).result
      assert.equal(previous.name, 'xo-other')
      assert.equal((await xo.route('get', '/global')).result.pools[1].state, 'behind')
    } finally {
      plugin.unload()
    }
  })
})

describe('global write path', () => {
  const globalDocument = {
    groups: { web: { tags: ['vdf:role=web'] } },
    policies: [
      { name: 'web', appliedTo: 'web', default: 'drop', ingress: [{ id: 1, from: 'web', proto: 'tcp', ports: [80] }] },
    ],
  }
  const publishGlobal = (xo, revision = 0, scope = { all: true }) =>
    xo.route('post', '/global/actions/publish', { body: { policy: text(globalDocument), scope, revision } })
  const ownerOf = (xo, poolId) => xo.xapis[poolId].pool.other_config['vdf:global.owner']
  const poolDocumentOf = (xo, poolId) => JSON.parse(xo.xapis[poolId].pool.other_config['vdf:policy'])

  test("a global write doesn't undo a pool publish that landed meanwhile", async () => {
    // the global write is held at the agent while a pool admin publishes
    let release
    let onHeld
    const isHeld = new Promise(resolve => (onHeld = resolve))
    let held = false
    const agent = {
      beforePublish: async () => {
        if (!held) {
          held = true
          onHeld()
          await new Promise(resolve => (release = resolve))
        }
      },
    }
    const xo = fakeXo({ agent })
    const plugin = await loaded(xo)
    try {
      const globalWrite = publishGlobal(xo)
      await isHeld
      const poolWrite = xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: POOL },
        body: { policy: text(document(8080)) },
      })
      release()
      await Promise.all([globalWrite, poolWrite])

      // the pool publish waited for the global write, then composed on it
      const final = poolDocumentOf(xo, POOL)
      assert.deepEqual(final.policies.find(policy => policy.name === 'web').ingress[0].ports, [8080])
      assert.ok(final.groups['global:web'])
    } finally {
      plugin.unload()
    }
  })

  test('a refused write claims nothing, and is reported as a partial publish', async () => {
    const xo = fakeXo({ pools: { A: {}, B: {} }, agent: { refuse: ['B'] } })
    const plugin = await loaded(xo)
    try {
      const result = (await publishGlobal(xo)).result
      assert.deepEqual([result.published, result.ok, result.partial], [true, false, true])
      assert.deepEqual(
        result.pools.map(pool => [pool.id, pool.ok]),
        [
          ['A', true],
          ['B', false],
        ]
      )
      assert.ok(ownerOf(xo, 'A'))
      assert.equal(ownerOf(xo, 'B'), undefined)

      // retried within seconds, not after the sync backoff
      const { sync } = (await xo.route('get', '/global')).result.pools.find(pool => pool.id === 'B')
      assert.equal(sync.ok, false)
      assert.ok(sync.retryAt - sync.at <= 5e3)
    } finally {
      plugin.unload()
    }
  })

  test('a scope naming a pool XO does not know is refused', async () => {
    const xo = fakeXo()
    const plugin = await loaded(xo)
    try {
      const result = (await publishGlobal(xo, 0, { pools: [POOL, 'typo'] })).result
      assert.equal(result.published, false)
      assert.match(result.error, /unknown pool in the scope: typo/)
      assert.equal(xo.calls.length, 0)
    } finally {
      plugin.unload()
    }
  })
})

describe('permissions', () => {
  const viewer = { id: 'u1', email: 'viewer@example.org', permission: 'none' }

  test('a user with an ACL on the pool sees its firewall, and changes it with administrate', async () => {
    const xo = fakeXo({ pools: { A: {}, B: {} }, acls: [['u1', 'A', 'view']] })
    const plugin = await loaded(xo)
    try {
      const policy = await xo.route('get', '/pools/{id}/policy', { params: { id: 'A' }, user: viewer })
      assert.equal(policy.status, 200)
      assert.equal(policy.result.canEdit, false)

      const publish = await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: 'A' },
        body: { policy: text(document()) },
        user: viewer,
      })
      assert.equal(publish.status, 403)
      assert.equal(xo.calls.length, 0)

      assert.equal((await xo.route('get', '/pools/{id}/policy', { params: { id: 'B' }, user: viewer })).status, 403)

      const global = (await xo.route('get', '/global', { user: viewer })).result
      assert.equal(global.canEdit, false)
      assert.deepEqual(
        global.pools.map(pool => pool.id),
        ['A']
      )

      const operator = fakeXo({ acls: [['u1', POOL, 'administrate']] })
      const plugin2 = await loaded(operator)
      try {
        const { status, result } = await operator.route('post', '/pools/{id}/actions/publish_policy', {
          params: { id: POOL },
          body: { policy: text(document()) },
          user: viewer,
        })
        assert.equal(status, 200)
        assert.equal(result.published, true)
      } finally {
        plugin2.unload()
      }
    } finally {
      plugin.unload()
    }
  })
})

describe('config export', () => {
  test('exports the store and imports it back, once registered per process', async () => {
    // a fresh module: the config manager is registered once per process
    const { default: create } = await import('./index.mjs?config-export')
    const xo = fakeXo()
    const plugin = create({ xo })
    create({ xo }) // a second instance doesn't register again
    await plugin.load()
    try {
      await xo.route('post', '/global/actions/publish', {
        body: { policy: text(document()), scope: { all: true }, revision: 0 },
      })

      const exported = JSON.parse(JSON.stringify(await xo.configManagers.vdf.exporter()))
      assert.equal(exported.global.revision, 1)
      assert.equal(exported.history.global.length, 1)
      assert.equal(exported.syncs[POOL].ok, true)

      await xo.store.put('global', { revision: 9, document: { groups: {}, policies: [] }, scope: { all: true } })
      await xo.store.put('history:other', [])
      await xo.configManagers.vdf.importer(exported)

      assert.deepEqual(await xo.store.get('global'), exported.global)
      assert.equal(await xo.store.has('history:other'), false)
      // the loaded plugin follows the import
      assert.equal((await xo.route('get', '/global')).result.revision, 1)
    } finally {
      plugin.unload()
    }
  })
})

// vdf#21: in a pool the global configuration applies to, the emergency and
// securityops tiers are the global policies'
describe('tiers kept for global policies', () => {
  const emergencyAllow = {
    name: 'sos',
    tier: 'emergency',
    appliedTo: 'web',
    default: 'pass',
    ingress: [{ id: 7, from: 'any', proto: 'any' }],
  }
  const withEmergency = { ...document(), policies: [...document().policies, emergencyAllow] }
  const globalDocument = {
    groups: { db: { tags: ['vdf:role=db'] } },
    policies: [
      {
        name: 'no-dev',
        tier: 'securityops',
        appliedTo: 'db',
        default: 'pass',
        ingress: [{ id: 1, action: 'drop', from: 'any', proto: 'tcp' }],
      },
    ],
  }
  const publishGlobal = (xo, revision, scope = { all: true }) =>
    xo.route('post', '/global/actions/publish', { body: { policy: text(globalDocument), scope, revision } })
  const publishPool = (xo, poolId, doc) =>
    xo.route('post', '/pools/{id}/actions/publish_policy', { params: { id: poolId }, body: { policy: text(doc) } })

  test('a pool in scope publishes no policy of its own there, a pool out of scope does', async () => {
    const xo = fakeXo({ pools: { A: {}, B: {} } })
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo, 0, { pools: ['A'] })
      const agentCalls = xo.calls.length

      const refused = (await publishPool(xo, 'A', withEmergency)).result
      assert.equal(refused.published, false)
      assert.match(refused.error, /move "sos" to networkops or a later tier/)
      const check = (
        await xo.route('post', '/pools/{id}/actions/check_policy', {
          params: { id: 'A' },
          body: { policy: text(withEmergency) },
        })
      ).result
      assert.equal(check.ok, false)
      // refused by XO, before any agent sees it
      assert.equal(xo.calls.length, agentCalls)

      assert.equal((await publishPool(xo, 'B', withEmergency)).result.published, true)
    } finally {
      plugin.unload()
    }
  })

  test('a pool entering the scope with policies there is refused, with their names', async () => {
    const xo = fakeXo({ pools: { A: {}, B: {} } })
    const plugin = await loaded(xo)
    try {
      await publishPool(xo, 'B', withEmergency)
      const before = { ...xo.xapis.B.pool.other_config }

      const result = (await publishGlobal(xo, 0)).result
      assert.deepEqual([result.published, result.ok], [false, false])
      const poolB = result.pools.find(pool => pool.id === 'B')
      assert.deepEqual(poolB.reservedTiers, ['sos'])
      assert.match(poolB.error, /move "sos" to networkops/)
      // nothing written anywhere
      assert.deepEqual(xo.xapis.B.pool.other_config, before)
      assert.equal(xo.xapis.A.pool.other_config['vdf:policy'], undefined)

      // moved: the scope change goes through
      const moved = { ...withEmergency, policies: [...document().policies, { ...emergencyAllow, tier: 'networkops' }] }
      await publishPool(xo, 'B', moved)
      assert.equal((await publishGlobal(xo, 0)).result.ok, true)
    } finally {
      plugin.unload()
    }
  })

  test('a pool already in scope gets them anyway, flagged, and a warning at publish', async () => {
    const xo = fakeXo()
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo, 0)
      // an edit made outside XO (vdf-agent publish)
      const held = JSON.parse(xo.xapi.pool.other_config['vdf:policy'])
      xo.xapi.pool.other_config['vdf:policy'] = text({ ...held, policies: [...held.policies, emergencyAllow] })

      const status = (await xo.route('get', '/global')).result
      assert.deepEqual(status.pools[0].reservedTiers, ['sos'])

      const result = (await publishGlobal(xo, 1)).result
      assert.equal(result.ok, true)
      assert.match(result.pools[0].warnings.join('\n'), /"sos"\. The pool can't publish until they're moved/)
    } finally {
      plugin.unload()
    }
  })
})

// vdf#20: an export imported on another XO doesn't make it the first one
describe('identity on import', () => {
  test('export, import on a second XO: the ids differ, its pools are taken over explicitly', async () => {
    // fresh modules: one config manager per process, i.e. per module here
    const { default: createA } = await import('./index.mjs?xo-a')
    const { default: createB } = await import('./index.mjs?xo-b')
    const xoA = fakeXo({ pools: { A: {}, B: {} } })
    const pluginA = createA({ xo: xoA })
    await pluginA.load()
    const xoB = fakeXo({ pools: { A: {}, B: {} } })
    const pluginB = createB({ xo: xoB })
    await pluginB.load()
    try {
      await xoA.route('post', '/global/actions/publish', {
        body: { policy: text(document()), scope: { all: true }, revision: 0 },
      })
      const a = (await xoA.route('get', '/global')).result.instance
      // XO B is connected to the same pools: they hold what XO A wrote
      for (const id of ['A', 'B']) {
        xoB.xapis[id].pool.other_config = { ...xoA.xapis[id].pool.other_config }
      }
      const b = (await xoB.route('get', '/global')).result.instance

      await xoB.configManagers.vdf.importer(JSON.parse(JSON.stringify(await xoA.configManagers.vdf.exporter())))

      const status = (await xoB.route('get', '/global')).result
      assert.notEqual(status.instance.id, a.id)
      assert.deepEqual(status.instance, b)
      assert.deepEqual([status.replaces.id, status.replaces.name], [a.id, a.name])
      // the configuration came along, the pools stay XO A's
      assert.equal(status.revision, 1)
      assert.deepEqual(
        status.pools.map(pool => [pool.id, pool.state, pool.ownerId]),
        [
          ['A', 'other-xo', a.id],
          ['B', 'other-xo', a.id],
        ]
      )

      // refused if this XO replaces another one than the user saw
      const stale = await xoB.route('post', '/global/actions/take_over_replaced', { body: { replaces: 'other' } })
      assert.deepEqual([stale.status, stale.result.conflict], [409, true])

      const { result } = await xoB.route('post', '/global/actions/take_over_replaced', { body: { replaces: a.id } })
      assert.deepEqual(
        result.pools.map(pool => [pool.id, pool.ok, pool.previous.id]),
        [
          ['A', true, a.id],
          ['B', true, a.id],
        ]
      )
      for (const id of ['A', 'B']) {
        assert.equal(JSON.parse(xoB.xapis[id].pool.other_config['vdf:global.owner']).id, b.id)
      }
    } finally {
      pluginA.unload()
      pluginB.unload()
    }
  })

  test('importing its own export keeps the id, and replaces nothing', async () => {
    const { default: create } = await import('./index.mjs?xo-self')
    const xo = fakeXo()
    const plugin = create({ xo })
    await plugin.load()
    try {
      const before = (await xo.route('get', '/global')).result.instance
      await xo.configManagers.vdf.importer(JSON.parse(JSON.stringify(await xo.configManagers.vdf.exporter())))
      const status = (await xo.route('get', '/global')).result
      assert.deepEqual(status.instance, before)
      assert.equal(status.replaces, undefined)
    } finally {
      plugin.unload()
    }
  })

  test('an XO without the plugin loaded gets an identity of its own at import', async () => {
    const source = fakeStore({ instance: { id: 'xo-a', name: 'xo-a.example.org' }, global: { revision: 3 } })
    const target = fakeStore()
    await importStore(target, Object.fromEntries([...source.data.entries()]))
    const instance = await target.get('instance')
    assert.notEqual(instance.id, 'xo-a')
    assert.deepEqual((await target.get('replaces')).id, 'xo-a')
    assert.equal((await target.get('global')).revision, 3)
  })
})

// vdf#42: in XAPI, the plugin writes vdf:* keys of pool.other_config only
// (vdf:global.owner itself, vdf:policy* through the agent's publish), and
// asks the hosts' vdf plugin for nothing else that writes. It never writes
// host or network other_config, nor VM or network tags (XO 6 tags VMs and
// networks through XO's own REST API, as any tag edit).
describe('what the plugin writes in XAPI', () => {
  const sources = ['index.mjs', 'global.mjs', 'history.mjs', 'trace.mjs']

  test('in the code: host.call_plugin, and pool.update_other_config of the owner key', async () => {
    const { readFile } = await import('node:fs/promises')
    for (const file of sources) {
      const code = await readFile(new URL(file, import.meta.url), 'utf8')
      for (const [, method] of code.matchAll(/\bxapi\.call\(\s*'([^']+)'/g)) {
        assert.equal(method, 'host.call_plugin', file)
      }
      for (const [, key] of code.matchAll(/update_other_config\(\s*([^,\s]+)/g)) {
        assert.equal(key, 'OWNER_KEY', file)
      }
      assert.doesNotMatch(
        code,
        /\b(callAsync|set_other_config|add_to_other_config|remove_from_other_config|set_tags|add_tags|remove_tags|setField\w*|_setObjectProperties|setObjectProperties|editVm|editNetwork|editPool|editHost)\b/,
        file
      )
      assert.doesNotMatch(code, /xapi\.(host|network|VM|VIF)\b/, file)
    }
  })

  // every XAPI access of the plugin through every route: what it calls,
  // what it sets
  function watch(xo) {
    const seen = []
    for (const [id, xapi] of Object.entries(xo.xapis)) {
      const pool = new Proxy(xapi.pool, {
        get(target, key) {
          if (key === 'other_config') {
            return Object.freeze({ ...target.other_config })
          }
          if (key === 'update_other_config') {
            return (name, value) => {
              seen.push({ pool: id, write: `pool.other_config:${name}` })
              return target.update_other_config(name, value)
            }
          }
          return typeof target[key] === 'function' ? seen.push({ pool: id, unexpected: `pool.${key}` }) : target[key]
        },
        set(target, key) {
          seen.push({ pool: id, unexpected: `set pool.${String(key)}` })
          return true
        },
      })
      xo.xapis[id] = new Proxy(xapi, {
        get(target, key) {
          if (key === 'pool') {
            return pool
          }
          if (key === 'call') {
            return (method, ...args) => {
              seen.push({ pool: id, call: method, plugin: args[1], fn: args[2] })
              return target.call(method, ...args)
            }
          }
          return target[key]
        },
        set(target, key) {
          seen.push({ pool: id, unexpected: `set xapi.${String(key)}` })
          return true
        },
      })
    }
    return seen
  }

  test('through every route: vdf:* pool keys, other keys untouched', async () => {
    const foreign = { 'xo:resource-set': 'x', 'memory-ratio-hvm': '0.25' }
    const vm = {
      id: 'vm-a1',
      name_label: 'web-1',
      $pool: 'A',
      power_state: 'Running',
      tags: ['vdf:role=web'],
      addresses: { '0/ipv4/0': '10.0.0.5' },
    }
    const xo = fakeXo({
      pools: { A: { otherConfig: foreign }, B: { otherConfig: foreign }, C: { otherConfig: foreign } },
      vms: [vm],
    })
    xo.xapis.C.pool.other_config['vdf:global.owner'] = '{"id":"other","name":"xo-other"}'
    const seen = watch(xo)
    const plugin = await loaded(xo)
    try {
      const policy = text(document())
      const global = { policy, scope: { all: true } }
      const pool = { id: 'A' }
      const routes = [
        ['get', '/info'],
        ['post', '/global/actions/check', { body: global }],
        ['post', '/global/actions/publish', { body: { ...global, revision: 0 } }],
        ['get', '/global'],
        ['get', '/global/history'],
        ['get', '/global/history/{entry}', { params: { entry: '1' } }],
        ['get', '/pools/{id}/policy', { params: pool }],
        ['post', '/pools/{id}/actions/check_policy', { params: pool, body: { policy } }],
        ['post', '/pools/{id}/actions/publish_policy', { params: pool, body: { policy: text(document(80)) } }],
        ['get', '/pools/{id}/history', { params: pool }],
        ['get', '/pools/{id}/history/{entry}', { params: { id: 'A', entry: '1' } }],
        ['get', '/pools/{id}/stats', { params: pool }],
        ['get', '/pools/{id}/rule-log', { params: pool }],
        ['get', '/pools/{id}/monitor', { params: pool }],
        ['post', '/pools/{id}/actions/take_over_global', { params: { id: 'C' }, body: { expectedOwner: 'other' } }],
        // B leaves the scope: its global part and owner key go
        ['post', '/global/actions/publish', { body: { ...global, scope: { pools: ['A', 'C'] }, revision: 1 } }],
      ]
      for (const [method, endpoint, options] of routes) {
        await xo.route(method, endpoint, options)
      }

      assert.deepEqual(
        seen.filter(entry => entry.unexpected),
        []
      )
      for (const entry of seen.filter(entry => entry.call !== undefined)) {
        assert.equal(entry.call, 'host.call_plugin')
        assert.equal(entry.plugin, 'vdf')
        assert.ok(['check', 'publish', 'stats', 'rule_log', 'monitor', 'trace'].includes(entry.fn), entry.fn)
      }
      const writes = seen.filter(entry => entry.write !== undefined).map(entry => entry.write)
      assert.ok(writes.length > 0)
      assert.ok(
        writes.every(write => write === 'pool.other_config:vdf:global.owner'),
        writes.join(', ')
      )
      // what the agent wrote on publish is vdf:policy*, the rest is as it was
      for (const id of ['A', 'B', 'C']) {
        const otherConfig = xo.xapis[id].pool.other_config
        for (const key of Object.keys(otherConfig).filter(key => !key.startsWith('vdf:'))) {
          assert.equal(otherConfig[key], foreign[key], `${id} ${key}`)
        }
        assert.deepEqual(
          Object.keys(otherConfig)
            .filter(key => !key.startsWith('vdf:'))
            .sort(),
          Object.keys(foreign).sort()
        )
      }
      assert.equal(xo.xapis.B.pool.other_config['vdf:global.owner'], undefined)
    } finally {
      plugin.unload()
    }
  })
})

// vdf#32, vdf#20: what changed in a pool without this XO. XO's cache of a
// pool follows XAPI's events, after a write returns: the fakes lag too.
describe('changes outside this XO', () => {
  const LAG = 20
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  // the events of the writes made so far have arrived
  const settled = () => sleep(3 * LAG)
  const globalDocument = {
    groups: { web: { tags: ['vdf:role=web'] } },
    policies: [{ name: 'web', appliedTo: 'web', default: 'drop', ingress: [] }],
  }
  const publishGlobal = async (xo, revision = 0, doc = globalDocument) => {
    const { result } = await xo.route('post', '/global/actions/publish', {
      body: { policy: text(doc), scope: { all: true }, revision },
    })
    await settled()
    return result
  }
  const historyOf = async (xo, poolId = POOL) =>
    (await xo.route('get', '/pools/{id}/history', { params: { id: poolId } })).result.entries
  const outsideOf = async (xo, poolId = POOL) => (await historyOf(xo, poolId)).filter(entry => entry.outside)
  const policyOf = async (xo, poolId = POOL) =>
    (await xo.route('get', '/pools/{id}/policy', { params: { id: poolId } })).result
  // a sync pass once the events of the writes so far have arrived, then
  // the events of its own writes
  const pass = async plugin => {
    await settled()
    await plugin.syncNow()
    await settled()
  }

  test('a document written outside this XO is kept in the pool history, also while XO was stopped', async () => {
    const store = fakeStore()
    const before = text(document(22))
    const xo = fakeXo({ store, otherConfig: { 'vdf:policy': before }, lag: LAG })
    const plugin = await loaded(xo)
    try {
      // first sight: nothing to compare with
      await pass(plugin)
      assert.deepEqual(await historyOf(xo), [])
      assert.equal((await policyOf(xo)).outside, null)

      // vdf-agent publish, xe, another XO
      const outside = text(document(8080))
      xo.xapi.pool.other_config['vdf:policy'] = outside
      await pass(plugin)
      const entries = await historyOf(xo)
      assert.deepEqual(
        entries.map(entry => [entry.docId, entry.previousDocId, entry.publishedBy, entry.outside?.docChanged]),
        [[docId(outside), docId(before), null, true]]
      )
      assert.equal(entries[0].outside.sameIdentity, false)
      assert.equal((await policyOf(xo)).outside.current, true)

      // seen again: nothing new
      await pass(plugin)
      assert.equal((await historyOf(xo)).length, 1)

      // this XO's own publish is no outside change, whenever its event comes
      await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: POOL },
        body: { policy: text(document(443)) },
      })
      await pass(plugin)
      const after = await historyOf(xo)
      assert.deepEqual(
        after.map(entry => entry.outside === undefined),
        [false, true]
      )
      assert.equal(after[1].previousDocId, docId(outside))
      assert.equal((await policyOf(xo)).outside.current, false)
    } finally {
      plugin.unload()
    }

    // a change made while this XO was stopped is seen at its first pass
    const whileStopped = text(document(25))
    const restarted = fakeXo({ store, otherConfig: { 'vdf:policy': whileStopped }, lag: LAG })
    const plugin2 = await loaded(restarted)
    try {
      await pass(plugin2)
      const last = (await historyOf(restarted)).at(-1)
      assert.equal(last.docId, docId(whileStopped))
      assert.equal(last.outside.docChanged, true)
    } finally {
      plugin2.unload()
    }
  })

  test("this XO's own global writes and claims are not outside changes", async () => {
    const xo = fakeXo({ pools: { A: {}, B: {} }, lag: LAG })
    const plugin = await loaded(xo)
    try {
      await pass(plugin)
      // the write, then the claim of the owner key, both lagging
      await publishGlobal(xo)
      await pass(plugin)
      // a member changes: every pool is written again
      await publishGlobal(xo, 1, { ...globalDocument, groups: { web: { tags: ['vdf:role=web'], ips: ['192.0.2.1'] } } })
      await pass(plugin)
      assert.deepEqual(await outsideOf(xo, 'A'), [])
      assert.deepEqual(await outsideOf(xo, 'B'), [])
      assert.equal(
        (await xo.route('get', '/global')).result.pools.some(pool => pool.outside !== undefined),
        false
      )
    } finally {
      plugin.unload()
    }
  })

  test("this XO's own pool publish adds one entry, not an outside one", async () => {
    const xo = fakeXo({ lag: LAG })
    const plugin = await loaded(xo)
    try {
      await pass(plugin)
      await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: POOL },
        body: { policy: text(document(443)) },
      })
      await pass(plugin)
      const entries = await historyOf(xo)
      assert.deepEqual(
        entries.map(entry => [entry.publishedBy, entry.outside]),
        [['admin@example.org', undefined]]
      )
    } finally {
      plugin.unload()
    }
  })

  test('another XO taking the pool over is in the history, and in the global status', async () => {
    const xo = fakeXo({ pools: { A: {}, B: {} }, lag: LAG })
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo)
      await pass(plugin)
      xo.xapis.B.pool.other_config['vdf:global.owner'] = JSON.stringify({
        id: 'other',
        name: 'xo-b',
        since: '2026-10-26T12:00:00.000Z',
      })
      await pass(plugin)
      const { outside } = (await historyOf(xo, 'B')).at(-1)
      assert.deepEqual(
        [outside.ownerChanged, outside.docChanged, outside.owner.name, outside.sameIdentity],
        [true, false, 'xo-b', false]
      )
      const pools = (await xo.route('get', '/global')).result.pools
      assert.equal(pools.find(pool => pool.id === 'B').outside.owner.name, 'xo-b')
      assert.equal(pools.find(pool => pool.id === 'A').outside, undefined)
    } finally {
      plugin.unload()
    }
  })

  test('the owner key rewritten with this XO id by another writer: a copy of this XO', async () => {
    const xo = fakeXo({ lag: LAG })
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo)
      await pass(plugin)
      const { id, name } = (await xo.route('get', '/global')).result.instance
      xo.xapi.pool.other_config['vdf:global.owner'] = JSON.stringify({ id, name, since: '2026-10-26T12:00:00.000Z' })
      await pass(plugin)
      const [entry] = await outsideOf(xo)
      assert.deepEqual([entry.outside.ownerChanged, entry.outside.sameIdentity], [true, true])
    } finally {
      plugin.unload()
    }
  })

  test('vdf-agent publish on a pool this XO owns is no copy of this XO', async () => {
    const xo = fakeXo({ lag: LAG })
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo)
      await pass(plugin)
      // an administrator on the pool master: vdf-agent -policy local.json publish
      xo.xapi.pool.other_config['vdf:policy'] = text(document(8080))
      await pass(plugin)
      const outside = await outsideOf(xo)
      assert.equal(outside.length, 1)
      assert.deepEqual([outside[0].outside.globalChanged, outside[0].outside.sameIdentity], [true, false])
    } finally {
      plugin.unload()
    }
  })

  test('a copy of this XO writing other global groups: told apart once it recurs, counted once', async () => {
    const xo = fakeXo({ lag: LAG })
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo)
      await pass(plugin)
      // a cloned XO VM: same identity, other global groups
      const ours = xo.xapi.pool.other_config['vdf:policy']
      const theirs = JSON.parse(ours)
      theirs.groups['global:web'] = { tags: ['vdf:role=web'], ips: ['192.0.2.9'] }
      const copyWrites = () => (xo.xapi.pool.other_config['vdf:policy'] = text(theirs))

      copyWrites()
      await pass(plugin) // seen, and written back
      assert.equal(xo.xapi.pool.other_config['vdf:policy'], ours)
      assert.equal((await outsideOf(xo))[0].outside.sameIdentity, false)
      await pass(plugin) // this XO's own write back: nothing new
      copyWrites()
      await pass(plugin)

      const outsideEntries = await outsideOf(xo)
      assert.equal(outsideEntries.length, 1)
      assert.deepEqual(
        [
          outsideEntries[0].outside.sameIdentity,
          outsideEntries[0].outside.globalChanged,
          outsideEntries[0].outside.times,
        ],
        [true, true, 2]
      )
      const { outside } = await policyOf(xo)
      assert.equal(outside.sameIdentity, true)
      assert.equal(outside.current, false)
    } finally {
      plugin.unload()
    }
  })

  test("restoring this XO's own older export brings no outside change", async () => {
    const xo = fakeXo({ lag: LAG })
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo, 0, { ...globalDocument, policies: [{ ...globalDocument.policies[0], default: 'pass' }] })
      await pass(plugin)
      // a backup: the whole store, as the config manager exports it (it's
      // registered once per process, by the first test's plugin)
      const exported = { history: {} }
      for await (const { key, value } of xo.store.createReadStream()) {
        if (key.startsWith('history:')) {
          exported.history[key.slice('history:'.length)] = value
        } else {
          exported[key] = value
        }
      }
      await publishGlobal(xo, 1)
      await pass(plugin)
      // the administrator restores the backup
      await importStore(xo.store, exported)
      await plugin.reloadStore()
      await pass(plugin) // the older configuration written back
      await pass(plugin)
      assert.deepEqual(await outsideOf(xo), [])
    } finally {
      plugin.unload()
    }
  })

  const publishPool = (xo, port) =>
    xo.route('post', '/pools/{id}/actions/publish_policy', {
      params: { id: POOL },
      body: { policy: text(document(port)) },
    })

  test('two own writes land before either event arrives', async () => {
    const xo = fakeXo({ lag: 50 })
    const plugin = await loaded(xo)
    try {
      await plugin.syncNow()
      await publishPool(xo, 1)
      await publishPool(xo, 2)
      await sleep(150)
      await plugin.syncNow()
      assert.deepEqual(await outsideOf(xo), [])
      assert.equal((await historyOf(xo)).length, 2)
    } finally {
      plugin.unload()
    }
  })

  test('an event arrives after a later write, a pass in between', async () => {
    const lags = [30, 200]
    const xo = fakeXo({ lag: () => lags.shift() ?? 0 })
    const plugin = await loaded(xo)
    try {
      await plugin.syncNow()
      await publishPool(xo, 1) // event at +30
      await plugin.syncNow() // sees the old document
      await publishPool(xo, 2) // event at +200
      await sleep(80)
      await plugin.syncNow() // sees the first
      await sleep(250)
      await plugin.syncNow() // sees the second
      assert.deepEqual(await outsideOf(xo), [])
    } finally {
      plugin.unload()
    }
  })

  test('an outside writer restoring a document of this XO it never saw arrive', async () => {
    const xo = fakeXo({ lag: 20 })
    const plugin = await loaded(xo)
    try {
      await plugin.syncNow()
      await publishPool(xo, 1)
      const own = text(document(1))
      await sleep(40) // its event arrived, no pass yet
      xo.xapi.pool.other_config['vdf:policy'] = text(document(9999)) // outside, before XO looked
      await plugin.syncNow()
      const first = (await outsideOf(xo)).length
      xo.xapi.pool.other_config['vdf:policy'] = own // outside again: brings back XO's document
      await plugin.syncNow()
      assert.equal((await outsideOf(xo)).length, first + 1)
    } finally {
      plugin.unload()
    }
  })

  test('vdf-agent publish of the same local file, run again, is no copy of this XO', async () => {
    const xo = fakeXo({ lag: 20 })
    const plugin = await loaded(xo)
    const settle = () => sleep(60)
    try {
      await xo.route('post', '/global/actions/publish', {
        body: { policy: text(document(22)), scope: { all: true }, revision: 0 },
      })
      await settle()
      await plugin.syncNow()
      await settle()
      const local = text(document(8080)) // no global part
      for (let i = 0; i < 2; i++) {
        xo.xapi.pool.other_config['vdf:policy'] = local
        await settle()
        await plugin.syncNow() // seen, and XO writes its global part back
        await settle()
        await plugin.syncNow()
      }
      const last = (await outsideOf(xo)).at(-1)
      assert.deepEqual([last.outside.times, last.outside.sameIdentity], [2, false])
    } finally {
      plugin.unload()
    }
  })

  test('the seen records hold no document', async () => {
    const xo = fakeXo({ lag: LAG })
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo)
      await pass(plugin)
      const seen = xo.store.data.get(`seen:${POOL}`)
      assert.equal(seen.document, undefined)
      assert.equal(typeof seen.docId, 'string')
      assert.equal(typeof seen.globalId, 'string')
    } finally {
      plugin.unload()
    }
  })
})

// vdf#30: one XO governs the global configuration; a pool another XO owns
// still feeds members into this XO's pools
describe('members from a pool another XO owns', () => {
  test('are marked with that XO', async () => {
    const globalDocument = {
      groups: { web: { tags: ['vdf:role=web'] } },
      policies: [
        {
          name: 'web',
          appliedTo: 'web',
          default: 'drop',
          ingress: [{ id: 1, from: 'web', proto: 'tcp', ports: [80] }],
        },
      ],
    }
    const vm = (id, pool, ip) => ({
      id,
      name_label: id,
      $pool: pool,
      power_state: 'Running',
      tags: ['vdf:role=web'],
      addresses: { '0/ipv4/0': ip },
    })
    const xo = fakeXo({
      pools: { A: {}, B: { otherConfig: { 'vdf:global.owner': '{"id":"other","name":"xo-other"}' } } },
      vms: [vm('vm-a', 'A', '10.0.0.1'), vm('vm-b', 'B', '10.0.0.2')],
    })
    const plugin = await loaded(xo)
    try {
      await xo.route('post', '/global/actions/publish', {
        body: { policy: text(globalDocument), scope: { all: true }, revision: 0 },
      })
      const { members } = (await xo.route('get', '/global')).result
      assert.deepEqual(
        members.web.map(member => [member.vm, member.otherXo]),
        [
          ['vm-a', undefined],
          ['vm-b', 'xo-other'],
        ]
      )
      // one way: A gets B's member, B never gets this XO's policies
      assert.deepEqual(JSON.parse(xo.xapis.A.pool.other_config['vdf:policy']).groups['global:web'].ips, ['10.0.0.2'])
      assert.equal(xo.xapis.B.pool.other_config['vdf:policy'], undefined)
    } finally {
      plugin.unload()
    }
  })
})

// vdf#27: XO 6 warns, on a global publish, when a global default decides
// for a pool policy's; it needs each pool's own part
describe('global check', () => {
  test("returns each pool's own part, for the pools in scope", async () => {
    const own = {
      groups: { db: { tags: ['vdf:role=db'] } },
      policies: [{ name: 'db', appliedTo: 'db', default: 'pass', ingress: [] }],
    }
    const xo = fakeXo({ pools: { A: { otherConfig: { 'vdf:policy': text(own) } }, B: {} } })
    const plugin = await loaded(xo)
    try {
      const { result } = await xo.route('post', '/global/actions/check', {
        body: { policy: text(document()), scope: { pools: ['A'] } },
      })
      assert.equal(result.ok, true)
      const [a, b] = ['A', 'B'].map(id => result.pools.find(pool => pool.id === id))
      assert.deepEqual(a.own, own)
      assert.equal(b.skipped, true)
      assert.equal(b.own, undefined)
    } finally {
      plugin.unload()
    }
  })
})
