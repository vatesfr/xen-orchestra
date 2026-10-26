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
// another write), `agent.refuse` lists pools whose agent refuses publishes
function fakeXo({
  store = fakeStore(),
  otherConfig = {},
  pools = { [POOL]: { otherConfig } },
  vms = [],
  acls = [],
  agent = {},
} = {}) {
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
          const { [key]: _, ...rest } = xapi.pool.other_config
          xapi.pool.other_config = value === null ? rest : { ...rest, [key]: value }
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
          xapi.pool.other_config = { ...xapi.pool.other_config, 'vdf:policy': args.policy }
          return JSON.stringify({ ok: true, published: true, document: docId(args.policy), warnings: [] })
        }
        return JSON.stringify({ ok: true, warnings: [] })
      },
    }
    xapis[id] = xapi
  }
  const configManagers = {}
  const disconnected = {}
  let routes = []
  const xo = {
    calls,
    xapi: xapis[Object.keys(pools)[0]],
    xapis,
    store,
    configManagers,
    // XO loses the pool: its objects go, its server stays
    disconnect(poolId) {
      disconnected[poolId] = { pool: poolObjects[poolId], xapi: xapis[poolId] }
      delete poolObjects[poolId]
      delete xapis[poolId]
    },
    // and gets it back
    reconnect(poolId) {
      poolObjects[poolId] = disconnected[poolId].pool
      xapis[poolId] = disconnected[poolId].xapi
      delete disconnected[poolId]
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
    getObject(id) {
      if (poolObjects[id] === undefined) {
        throw new Error('no such object')
      }
      return poolObjects[id]
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

      await xo.store.put('global', { revision: 1, document: { groups: {}, policies: [] }, scope: { all: true } })
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

// vdf#81: an XO lost without a backup; its pools still hold its global part
describe('recovery without a backup', () => {
  const globalDocument = {
    groups: { web: { tags: ['vdf:role=web'] }, admins: { ips: ['192.0.2.30'] } },
    policies: [
      {
        name: 'web',
        appliedTo: 'web',
        default: 'drop',
        ingress: [
          { id: 1, from: 'admins', proto: 'tcp', ports: [22] },
          { id: 2, from: 'web', proto: 'tcp', ports: [80] },
        ],
        egress: [{ id: 3, to: 'any', proto: 'udp', ports: [53] }],
      },
    ],
  }
  const scope = { pools: ['A', 'B'] }
  const webVm = {
    id: 'vm-a1',
    name_label: 'web-1',
    $pool: 'A',
    power_state: 'Running',
    tags: ['vdf:role=web'],
    addresses: { '0/ipv4/0': '10.0.0.5' },
  }
  const policyOf = (xo, poolId) => xo.xapis[poolId].pool.other_config['vdf:policy']
  const ownerOf = (xo, poolId) => JSON.parse(xo.xapis[poolId].pool.other_config['vdf:global.owner'])

  // XO A publishes revision 2 to pools A and B, then is lost: what remains
  // is what the pools hold
  async function lostXo() {
    const xo = fakeXo({ pools: { A: {}, B: {} }, vms: [webVm] })
    const plugin = await loaded(xo)
    try {
      await xo.route('post', '/global/actions/publish', {
        body: { policy: text(document()), scope: { all: true }, revision: 0 },
      })
      await xo.route('post', '/global/actions/publish', { body: { policy: text(globalDocument), scope, revision: 1 } })
      return {
        owner: (await xo.route('get', '/global')).result.instance,
        pools: { A: { otherConfig: xo.xapis.A.pool.other_config }, B: { otherConfig: xo.xapis.B.pool.other_config } },
      }
    } finally {
      plugin.unload()
    }
  }

  test('a take over that would drop the global part is refused, nothing written, unless confirmed', async () => {
    const lost = await lostXo()
    const xo = fakeXo({ pools: lost.pools, store: fakeStore({ replaces: { id: lost.owner.id, name: 'xo-a' } }) })
    const plugin = await loaded(xo)
    try {
      const before = structuredClone(xo.xapis.A.pool.other_config)
      const refused = await xo.route('post', '/pools/{id}/actions/take_over_global', {
        params: { id: 'A' },
        body: { expectedOwner: lost.owner.id },
      })
      assert.deepEqual([refused.status, refused.result.conflict], [409, true])
      assert.match(refused.result.globalLoss.reason, /no global configuration/)
      const all = await xo.route('post', '/global/actions/take_over_replaced', { body: { replaces: lost.owner.id } })
      assert.deepEqual(
        [all.status, all.result.pools.map(pool => [pool.id, pool.ok, pool.globalLoss !== undefined])],
        [
          409,
          [
            ['A', false, true],
            ['B', false, true],
          ],
        ]
      )
      assert.deepEqual(xo.xapis.A.pool.other_config, before)
      assert.deepEqual(xo.calls, [])

      // confirmed: the global part goes at once, and the owner with it
      const taken = await xo.route('post', '/pools/{id}/actions/take_over_global', {
        params: { id: 'A' },
        body: { expectedOwner: lost.owner.id, dropGlobal: true },
      })
      assert.equal(taken.status, 200)
      assert.deepEqual(Object.keys(JSON.parse(policyOf(xo, 'A')).groups), [])
      assert.equal(xo.xapis.A.pool.other_config['vdf:global.owner'], undefined)
    } finally {
      plugin.unload()
    }
  })

  test('rebuilt from the pools as published, saved, then its pools taken over', async () => {
    const lost = await lostXo()
    // what the pools record besides the global part they hold
    assert.deepEqual(
      ['A', 'B'].map(id => {
        const { revision, scope, ips } = JSON.parse(lost.pools[id].otherConfig['vdf:global.owner'])
        return [revision, scope, ips]
      }),
      [
        [2, scope, { admins: ['192.0.2.30'] }],
        [2, scope, { admins: ['192.0.2.30'] }],
      ]
    )
    const store = fakeStore()
    const xo = fakeXo({ store, pools: lost.pools, vms: [webVm] })
    const plugin = await loaded(xo)
    try {
      const [recoverable] = (await xo.route('get', '/global')).result.recoverable
      assert.deepEqual(recoverable.owner.id, lost.owner.id)
      const [version] = recoverable.versions
      assert.deepEqual(version.document, globalDocument)
      assert.deepEqual([recoverable.versions.length, version.revision, version.scope], [1, 2, scope])

      // the configuration is saved before any pool changes owner
      const savedFirst = []
      for (const xapi of Object.values(xo.xapis)) {
        const update = xapi.pool.update_other_config
        xapi.pool.update_other_config = async (key, value) => {
          savedFirst.push(await store.has('global'))
          return update(key, value)
        }
      }
      const before = { A: policyOf(xo, 'A'), B: policyOf(xo, 'B') }
      const { result } = await xo.route('post', '/global/actions/recover', { body: { from: lost.owner.id } })
      assert.equal(result.revision, 3)
      assert.deepEqual(
        result.takenOver.map(pool => [pool.id, pool.ok]),
        [
          ['A', true],
          ['B', true],
        ]
      )
      assert.deepEqual(savedFirst, [true, true])

      const status = (await xo.route('get', '/global')).result
      assert.deepEqual([status.document, status.revision, status.scope], [globalDocument, 3, scope])
      assert.deepEqual([status.replaces.id, status.recoverable], [lost.owner.id, []])
      // the first sync has nothing to write
      assert.deepEqual(
        status.pools.map(pool => [pool.id, pool.state]),
        [
          ['A', 'in-sync'],
          ['B', 'in-sync'],
        ]
      )
      for (const id of ['A', 'B']) {
        assert.equal(policyOf(xo, id), before[id])
        assert.equal(ownerOf(xo, id).id, status.instance.id)
      }
      const { entries } = (await xo.route('get', '/global/history')).result
      assert.deepEqual(
        entries.map(entry => entry.revision),
        [3]
      )

      const again = await xo.route('post', '/global/actions/recover', { body: { from: lost.owner.id } })
      assert.deepEqual([again.status, again.result.conflict], [409, true])
    } finally {
      plugin.unload()
    }
  })

  test("a pool's marker can't widen the scope: anyone with XAPI access to one pool can write it", async () => {
    const forged = {
      groups: { 'global:all': { tags: ['vdf:role=web'], ips: [] } },
      policies: [
        {
          name: 'global:lockdown',
          tier: 'emergency',
          appliedTo: 'global:all',
          default: 'drop',
          ingress: [{ id: 0x800001, from: 'any', proto: 'tcp', ports: [22] }],
        },
      ],
    }
    const owner = { id: 'forged', name: 'xo-forged', revision: 9, scope: { all: true }, ips: {} }
    const xo = fakeXo({
      pools: {
        A: { otherConfig: { 'vdf:policy': text(forged), 'vdf:global.owner': JSON.stringify(owner) } },
        B: {},
      },
    })
    const plugin = await loaded(xo)
    try {
      const [recoverable] = (await xo.route('get', '/global')).result.recoverable
      const [version] = recoverable.versions
      // the pools holding it, whatever their owner recorded
      assert.deepEqual([version.scope, version.recordedScope], [{ pools: ['A'] }, { all: true }])

      const { result } = await xo.route('post', '/global/actions/recover', { body: { from: 'forged' } })
      assert.deepEqual(result.scope, { pools: ['A'] })
      const status = (await xo.route('get', '/global')).result
      assert.deepEqual(
        status.pools.map(pool => [pool.id, pool.inScope, pool.state]),
        [
          ['A', true, 'in-sync'],
          ['B', false, 'out-of-scope'],
        ]
      )
      assert.deepEqual(xo.xapis.B.pool.other_config, {})
      assert.equal(
        xo.calls.some(call => call.pool === 'B'),
        false
      )
    } finally {
      plugin.unload()
    }
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
        ['post', '/global/actions/take_over_replaced', { body: { replaces: 'other' } }],
        ['post', '/global/actions/recover', { body: { from: 'other' } }],
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

// vdf#81, the red team's scenarios: pools that disagree or were forged,
// late pools, rollbacks, a replaced XO back, copies of one XO
describe('recovery: what the pools hold can be stale or forged', () => {
  const globalDocument = {
    groups: { web: { tags: ['vdf:role=web'] }, admins: { ips: ['192.0.2.30'] } },
    policies: [
      {
        name: 'web',
        appliedTo: 'web',
        tier: 'securityops',
        default: 'drop',
        ingress: [{ id: 1, from: 'admins', proto: 'tcp', ports: [22] }],
      },
    ],
  }
  const vm = (id, pool, tags, ip) => ({
    id,
    name_label: id,
    $pool: pool,
    power_state: 'Running',
    tags,
    addresses: { '0/ipv4/0': ip },
  })
  const policyOf = (xo, poolId) => JSON.parse(xo.xapis[poolId].pool.other_config['vdf:policy'])
  const globalNames = (xo, poolId) =>
    Object.keys(policyOf(xo, poolId).groups)
      .filter(name => name.startsWith('global:'))
      .sort()
  const ownerOf = (xo, poolId) => JSON.parse(xo.xapis[poolId].pool.other_config['vdf:global.owner'] ?? 'null')
  const publishGlobal = (xo, revision, doc = globalDocument, scope = { all: true }) =>
    xo.route('post', '/global/actions/publish', { body: { policy: text(doc), scope, revision } })

  // XO A publishes to `poolIds` (scope all unless said), then is lost: its
  // store, and what the pools hold
  async function xoA({ poolIds = ['A', 'B'], scope = { all: true }, doc = globalDocument, vms = [] } = {}) {
    const store = fakeStore()
    const xo = fakeXo({ store, pools: Object.fromEntries(poolIds.map(id => [id, {}])), vms })
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo, 0, doc, scope)
      return {
        store,
        owner: (await xo.route('get', '/global')).result.instance,
        pools: Object.fromEntries(poolIds.map(id => [id, { otherConfig: { ...xo.xapis[id].pool.other_config } }])),
        export: JSON.parse(JSON.stringify(Object.fromEntries(store.data))),
      }
    } finally {
      plugin.unload()
    }
  }

  // the background sync, as XO runs it 5 s after an event
  async function runSync(t) {
    t.mock.timers.tick(5e3)
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setImmediate(resolve))
    }
  }
  const mockTimers = t => t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] })

  const instanceOf = async xo => (await xo.route('get', '/global')).result.instance

  test('a pool unreachable during recovery joins the scope when taken over, holding the recovered version', async t => {
    mockTimers(t)
    const lost = await xoA({ poolIds: ['A', 'B', 'C'] })
    const xo = fakeXo({ pools: lost.pools })
    // C is down while the admin recovers
    xo.disconnect('C')
    const plugin = await loaded(xo)
    try {
      const { result } = await xo.route('post', '/global/actions/recover', { body: { from: lost.owner.id } })
      assert.deepEqual(result.scope, { pools: ['A', 'B'] })

      // C comes back, still A's: Overview offers "Take over its pools"
      xo.reconnect('C')
      const before = (await xo.route('get', '/global')).result
      assert.deepEqual(
        before.pools.map(pool => [pool.id, pool.state, pool.ownerId === lost.owner.id]),
        [
          ['A', 'in-sync', false],
          ['B', 'in-sync', false],
          ['C', 'other-xo', true],
        ]
      )
      const taken = await xo.route('post', '/global/actions/take_over_replaced', { body: { replaces: lost.owner.id } })
      assert.deepEqual(
        [taken.status, taken.result.pools.map(pool => [pool.id, pool.ok, pool.joined])],
        [200, [['C', true, true]]]
      )
      assert.deepEqual((await xo.route('get', '/global')).result.scope, { pools: ['A', 'B', 'C'] })
      await runSync(t)
      assert.deepEqual(globalNames(xo, 'C'), ['global:admins', 'global:web'])
      assert.equal(ownerOf(xo, 'C').id, (await instanceOf(xo)).id)
    } finally {
      plugin.unload()
    }
  })

  test('two lost XOs: once one is recovered, the other is listed with the reason, and its pools keep their rules', async t => {
    mockTimers(t)
    const lostA = await xoA({ poolIds: ['A', 'B'] })
    const lostZ = await xoA({ poolIds: ['Z'], doc: { groups: { ops: { ips: ['198.51.100.7'] } }, policies: [] } })
    const xo = fakeXo({ pools: { ...lostA.pools, ...lostZ.pools } })
    const plugin = await loaded(xo)
    try {
      const { recoverable } = (await xo.route('get', '/global')).result
      assert.deepEqual(recoverable.map(candidate => candidate.owner.id).sort(), [lostA.owner.id, lostZ.owner.id].sort())
      await xo.route('post', '/global/actions/recover', { body: { from: lostA.owner.id } })

      const after = (await xo.route('get', '/global')).result.recoverable
      assert.deepEqual(
        after.map(candidate => candidate.owner.id),
        [lostZ.owner.id]
      )
      assert.match(after[0].reason, /already recovered/)
      const again = await xo.route('post', '/global/actions/recover', { body: { from: lostZ.owner.id } })
      assert.deepEqual([again.status, again.result.conflict], [409, true])

      // the pool's Take over button: refused, Z's rules would go
      const taken = await xo.route('post', '/pools/{id}/actions/take_over_global', {
        params: { id: 'Z' },
        body: { expectedOwner: lostZ.owner.id },
      })
      assert.deepEqual([taken.status, taken.result.globalLoss !== undefined], [409, true])
      await runSync(t)
      assert.deepEqual(globalNames(xo, 'Z'), ['global:ops'])
    } finally {
      plugin.unload()
    }
  })

  test("one pool's admin can't bring their pool into the recovered scope: versions differ, one is chosen", async t => {
    mockTimers(t)
    const doc = {
      groups: { admins: { tags: ['vdf:role=admin'] }, db: { tags: ['vdf:role=db'] } },
      policies: [
        {
          name: 'db',
          appliedTo: 'db',
          default: 'drop',
          ingress: [{ id: 1, from: 'admins', proto: 'tcp', ports: [5432] }],
        },
      ],
    }
    const lost = await xoA({ poolIds: ['A', 'B'], scope: { pools: ['A', 'B'] }, doc })
    // P was never in A's scope. Its admin (XAPI access to P only) writes
    // A's id, read from any of A's pools or XO's UI, and any global part
    const forged = {
      id: lost.owner.id,
      name: lost.owner.name,
      since: '2026-01-01T00:00:00.000Z',
      revision: 1,
      scope: { pools: ['A', 'B', 'P'] },
      ips: {},
    }
    const pools = {
      ...lost.pools,
      P: {
        otherConfig: {
          'vdf:global.owner': JSON.stringify(forged),
          'vdf:policy': text({ groups: { 'global:x': {} }, policies: [] }),
        },
      },
    }
    const attacker = vm('vm-p1', 'P', ['vdf:role=admin'], '203.0.113.66')
    const xo = fakeXo({ pools, vms: [attacker] })
    const plugin = await loaded(xo)
    try {
      const [recoverable] = (await xo.route('get', '/global')).result.recoverable
      assert.deepEqual(
        recoverable.versions.map(version => [version.revision, version.pools.map(pool => pool.id), version.scope]),
        [
          [1, ['A', 'B'], { pools: ['A', 'B'] }],
          [1, ['P'], { pools: ['P'] }],
        ]
      )
      const unchosen = await xo.route('post', '/global/actions/recover', { body: { from: lost.owner.id } })
      assert.deepEqual([unchosen.status, unchosen.result.versions], [409, 2])

      const { result } = await xo.route('post', '/global/actions/recover', {
        body: { from: lost.owner.id, version: 'A' },
      })
      assert.deepEqual(result.scope, { pools: ['A', 'B'] })
      assert.deepEqual(
        result.takenOver.map(pool => [pool.id, pool.ok]),
        [
          ['A', true],
          ['B', true],
          ['P', false],
        ]
      )
      await runSync(t)
      for (const id of ['A', 'B']) {
        assert.deepEqual(policyOf(xo, id).groups['global:admins'].ips, [])
      }
      assert.equal(ownerOf(xo, 'P').id, lost.owner.id)
    } finally {
      plugin.unload()
    }
  })

  test("one pool's admin raising its marker's revision doesn't outvote the others", async t => {
    mockTimers(t)
    const lost = await xoA({ poolIds: ['A', 'B', 'C'] })
    // B's admin (XAPI access to B only) adds an address to the admins group
    // in B's marker, with a higher revision
    const marker = JSON.parse(lost.pools.B.otherConfig['vdf:global.owner'])
    lost.pools.B.otherConfig['vdf:global.owner'] = JSON.stringify({
      ...marker,
      revision: 99,
      ips: { admins: ['192.0.2.30', '203.0.113.66'] },
    })
    // and an allow in the emergency tier, kept for global policies (vdf#21)
    const held = JSON.parse(lost.pools.B.otherConfig['vdf:policy'])
    held.policies.unshift({
      name: 'global:open',
      appliedTo: 'global:web',
      tier: 'emergency',
      default: 'allow',
      ingress: [],
    })
    lost.pools.B.otherConfig['vdf:policy'] = text(held)
    const xo = fakeXo({ pools: lost.pools })
    const plugin = await loaded(xo)
    try {
      const [recoverable] = (await xo.route('get', '/global')).result.recoverable
      assert.deepEqual(
        recoverable.versions.map(version => [version.revision, version.pools.map(pool => pool.id)]),
        [
          [1, ['A', 'C']],
          [99, ['B']],
        ]
      )
      // refused until the administrator chooses
      const unchosen = await xo.route('post', '/global/actions/recover', { body: { from: lost.owner.id } })
      assert.equal(unchosen.status, 409)

      const { result } = await xo.route('post', '/global/actions/recover', {
        body: { from: lost.owner.id, version: 'A' },
      })
      assert.deepEqual([result.revision, result.scope], [2, { pools: ['A', 'C'] }])
      // B records a newer revision: not taken over, not rolled back
      assert.match(result.takenOver.find(pool => pool.id === 'B').error, /revision 99/)
      await runSync(t)
      for (const id of ['A', 'C']) {
        assert.deepEqual(policyOf(xo, id).groups['global:admins'].ips, ['192.0.2.30'])
        assert.equal(policyOf(xo, id).policies[0].name, 'global:web')
      }
      assert.equal(policyOf(xo, 'B').policies[0].name, 'global:open')
    } finally {
      plugin.unload()
    }
  })

  test("a pool whose owner recorded an invalid source isn't recoverable, and GET /global still works", async () => {
    const lost = await xoA({ poolIds: ['A', 'B'] })
    const marker = JSON.parse(lost.pools.A.otherConfig['vdf:global.owner'])
    lost.pools.A.otherConfig['vdf:global.owner'] = JSON.stringify({ ...marker, revision: '7' })
    lost.pools.B.otherConfig['vdf:global.owner'] = JSON.stringify({ ...marker, ips: { admins: 5 } })
    const xo = fakeXo({ pools: lost.pools })
    const plugin = await loaded(xo)
    try {
      const status = (await xo.route('get', '/global')).result
      assert.deepEqual(status.recoverable, [])
      assert.deepEqual(
        status.pools.map(pool => pool.state),
        ['other-xo', 'other-xo']
      )
      const recover = await xo.route('post', '/global/actions/recover', { body: { from: lost.owner.id } })
      assert.equal(recover.status, 409)
      // the pool's own publishes keep that XO's part
      const published = await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: 'B' },
        body: { policy: text(document()) },
      })
      assert.equal(published.result.published, true)
      assert.deepEqual(globalNames(xo, 'B'), ['global:admins', 'global:web'])
    } finally {
      plugin.unload()
    }
  })
  test("a global part without a readable marker is an unknown XO's, kept by the pool's operator", async () => {
    const lost = await xoA({ poolIds: ['A', 'B'] })
    // A: its owner marker gone; B: its marker unreadable
    delete lost.pools.A.otherConfig['vdf:global.owner']
    lost.pools.B.otherConfig['vdf:global.owner'] = '{"id":'
    const operator = { id: 'op', email: 'op@example.org', permission: 'none' }
    const xo = fakeXo({
      pools: lost.pools,
      acls: [
        ['op', 'A', 'administrate'],
        ['op', 'B', 'administrate'],
      ],
    })
    const plugin = await loaded(xo)
    try {
      const status = (await xo.route('get', '/global')).result
      // nothing recorded to rebuild it from
      assert.deepEqual(status.recoverable, [])
      assert.deepEqual(
        status.pools.map(pool => [pool.id, pool.state, pool.ownerId]),
        [
          ['A', 'other-xo', ''],
          ['B', 'other-xo', ''],
        ]
      )
      for (const id of ['A', 'B']) {
        // a user with administrate on the pool only, editing its own part
        const { result } = await xo.route('post', '/pools/{id}/actions/publish_policy', {
          params: { id },
          body: { policy: text(document()) },
          user: operator,
        })
        assert.equal(result.published, true)
        assert.deepEqual(globalNames(xo, id), ['global:admins', 'global:web'])
      }
    } finally {
      plugin.unload()
    }
  })

  test('an XO with a configuration of its own leaves a global part without a readable marker alone', async t => {
    mockTimers(t)
    const lost = await xoA({ poolIds: ['A'] })
    delete lost.pools.A.otherConfig['vdf:global.owner']
    // this XO publishes its own configuration to pool X only
    const xo = fakeXo({ pools: { ...lost.pools, X: {} } })
    const plugin = await loaded(xo)
    try {
      const publish = await publishGlobal(
        xo,
        0,
        { groups: { ops: { ips: ['198.51.100.7'] } }, policies: [] },
        { pools: ['X'] }
      )
      assert.equal(publish.result.published, true)
      assert.deepEqual(globalNames(xo, 'A'), ['global:admins', 'global:web'])
      await runSync(t)
      assert.deepEqual(globalNames(xo, 'A'), ['global:admins', 'global:web'])
    } finally {
      plugin.unload()
    }
  })

  test('an export taken before the first global publish: the XO it replaces is recoverable', async () => {
    const lost = await xoA({ poolIds: ['A'] })
    const store = fakeStore()
    // the config export of A from before its first global publish
    await importStore(store, { instance: lost.owner, history: {} })
    const xo = fakeXo({ store, pools: lost.pools })
    const plugin = await loaded(xo)
    try {
      const status = (await xo.route('get', '/global')).result
      assert.equal(status.replaces.id, lost.owner.id)
      assert.deepEqual(
        status.recoverable.map(candidate => candidate.owner.id),
        [lost.owner.id]
      )
      // taking its pools over first would drop their rules: refused
      const taken = await xo.route('post', '/global/actions/take_over_replaced', { body: { replaces: lost.owner.id } })
      assert.equal(taken.status, 409)
      const recover = await xo.route('post', '/global/actions/recover', {
        body: { from: lost.owner.id },
      })
      assert.deepEqual(
        recover.result.takenOver.map(pool => [pool.id, pool.ok]),
        [['A', true]]
      )
      assert.deepEqual(globalNames(xo, 'A'), ['global:admins', 'global:web'])
    } finally {
      plugin.unload()
    }
  })

  test("an old backup restored on a new XO doesn't roll back the pools recording a newer revision", async t => {
    mockTimers(t)
    // A publishes revision 1 (the backup is taken then), then revision 2
    const store = fakeStore()
    const xoa = fakeXo({ store, pools: { A: {} } })
    const pluginA = await loaded(xoa)
    let backup
    let owner
    try {
      await publishGlobal(xoa, 0)
      backup = JSON.parse(JSON.stringify(Object.fromEntries(store.data)))
      owner = (await xoa.route('get', '/global')).result.instance
      const newer = structuredClone(globalDocument)
      newer.groups.blocked = { ips: ['198.51.100.66'] }
      newer.policies.unshift({
        name: 'block',
        appliedTo: 'web',
        tier: 'emergency',
        default: 'allow',
        ingress: [{ id: 9, from: 'blocked', proto: 'any', action: 'drop' }],
      })
      await publishGlobal(xoa, 1, newer)
    } finally {
      pluginA.unload()
    }
    assert.equal(ownerOf(xoa, 'A').revision, 2)

    const xoc = fakeXo({ store: fakeStore(), pools: { A: { otherConfig: xoa.xapi.pool.other_config } } })
    const pluginC = await loaded(xoc)
    try {
      await importStore(xoc.store, backup)
      await pluginC.reloadStore()
      assert.equal((await xoc.route('get', '/global')).result.revision, 1)
      const taken = await xoc.route('post', '/global/actions/take_over_replaced', { body: { replaces: owner.id } })
      assert.equal(taken.status, 409)
      assert.match(taken.result.pools[0].error, /revision 2 .* newer than this XO's 1/)
      await runSync(t)
      assert.deepEqual(globalNames(xoc, 'A'), ['global:admins', 'global:blocked', 'global:web'])
      assert.deepEqual([ownerOf(xoc, 'A').id, ownerOf(xoc, 'A').revision], [owner.id, 2])
    } finally {
      pluginC.unload()
    }
  })

  test("importing the lost XO's backup after recovering is refused: it would roll the configuration back", async t => {
    mockTimers(t)
    const lost = await xoA({ poolIds: ['A'] })
    const xo = fakeXo({ pools: lost.pools })
    const plugin = await loaded(xo)
    try {
      await xo.route('post', '/global/actions/recover', { body: { from: lost.owner.id } })
      // edits made after the recovery
      const edited = structuredClone(globalDocument)
      edited.groups.admins.ips = ['192.0.2.31']
      assert.equal((await publishGlobal(xo, 2, edited)).result.published, true)

      // the old backup turns up and is imported, the config manager's way
      await assert.rejects(plugin.importConfig(lost.export), /roll/)
      await assert.rejects(importStore(xo.store, lost.export), /roll/)
      await plugin.reloadStore()
      assert.equal((await xo.route('get', '/global')).result.revision, 3)
      assert.deepEqual(
        (await xo.route('get', '/global/history')).result.entries.map(entry => entry.revision),
        [2, 3]
      )
      await runSync(t)
      assert.deepEqual(policyOf(xo, 'A').groups['global:admins'].ips, ['192.0.2.31'])
    } finally {
      plugin.unload()
    }
  })

  test('the old XO back after the recovery: told it was replaced, its publishes fail, it claims no new pool', async t => {
    mockTimers(t)
    const lost = await xoA({ poolIds: ['A', 'B'] })
    // B recovers
    const xob = fakeXo({ pools: lost.pools })
    const pluginB = await loaded(xob)
    let b
    try {
      await xob.route('post', '/global/actions/recover', { body: { from: lost.owner.id } })
      b = await instanceOf(xob)
    } finally {
      pluginB.unload()
    }
    // A comes back with its store; pool N joins later, owned by no XO
    const xoa = fakeXo({
      store: lost.store,
      pools: {
        A: { otherConfig: xob.xapis.A.pool.other_config },
        B: { otherConfig: xob.xapis.B.pool.other_config },
        N: {},
      },
    })
    const pluginA = await loaded(xoa)
    try {
      const status = (await xoa.route('get', '/global')).result
      assert.deepEqual(status.replacedBy, { id: b.id, name: b.name })
      const publish = (await publishGlobal(xoa, 1)).result
      assert.deepEqual([publish.ok, publish.published], [false, false])
      assert.deepEqual(
        publish.pools.map(pool => [pool.id, pool.otherXo === true, pool.replacedBy?.id]),
        [
          ['A', true, undefined],
          ['B', true, undefined],
          ['N', false, b.id],
        ]
      )
      await runSync(t)
      assert.deepEqual(xoa.xapis.N.pool.other_config, {})
    } finally {
      pluginA.unload()
    }
  })

  test("two copies of one XO (same instance): the one with the older revision doesn't write, the pool says cloned", async t => {
    mockTimers(t)
    const lost = await xoA({ poolIds: ['A'] })
    // a VM clone of A's data directory, edited on its own
    const copy = fakeXo({ store: fakeStore(lost.export), pools: lost.pools })
    const pluginCopy = await loaded(copy)
    const edited = structuredClone(globalDocument)
    edited.groups.admins.ips = ['192.0.2.31']
    try {
      await publishGlobal(copy, 1, edited)
    } finally {
      pluginCopy.unload()
    }
    assert.equal(ownerOf(copy, 'A').revision, 2)
    const original = fakeXo({ store: lost.store, pools: { A: { otherConfig: copy.xapi.pool.other_config } } })
    const pluginA = await loaded(original)
    try {
      await runSync(t)
      assert.deepEqual(policyOf(original, 'A').groups['global:admins'].ips, ['192.0.2.31'])
      assert.equal(ownerOf(original, 'A').revision, 2)
      const [pool] = (await original.route('get', '/global')).result.pools
      assert.equal(pool.cloned, true)
      const publish = await original.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: 'A' },
        body: { policy: text(document()) },
      })
      assert.deepEqual([publish.result.published, publish.result.globalLoss?.cloned], [false, true])
    } finally {
      pluginA.unload()
    }
  })
})

// vdf#81, second red team: normal life on one healthy XO
describe('normal life on one XO', () => {
  const globalDocument = {
    groups: { web: { tags: ['vdf:role=web'] }, admins: { ips: ['192.0.2.30'] } },
    policies: [
      {
        name: 'web',
        appliedTo: 'web',
        default: 'drop',
        ingress: [{ id: 1, from: 'admins', proto: 'tcp', ports: [22] }],
      },
    ],
  }
  const policyOf = (xo, poolId) => JSON.parse(xo.xapis[poolId].pool.other_config['vdf:policy'])
  const ownerOf = (xo, poolId) => JSON.parse(xo.xapis[poolId].pool.other_config['vdf:global.owner'] ?? 'null')
  const globalNames = (xo, poolId) =>
    Object.keys(policyOf(xo, poolId).groups)
      .filter(name => name.startsWith('global:'))
      .sort()
  const publishGlobal = (xo, revision, doc = globalDocument, scope = { all: true }) =>
    xo.route('post', '/global/actions/publish', { body: { policy: text(doc), scope, revision } })
  const otherConfigs = xo =>
    Object.fromEntries(Object.keys(xo.xapis).map(id => [id, { otherConfig: { ...xo.xapis[id].pool.other_config } }]))
  async function runSync(t) {
    t.mock.timers.tick(5e3)
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setImmediate(resolve))
    }
  }
  const mockTimers = t => t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] })

  test('a pool unreachable while it left the scope loses its global part once back', async t => {
    mockTimers(t)
    const store = fakeStore()
    const xo = fakeXo({ store, pools: { A: {}, B: {} } })
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo, 0)
      // B is down while the admin takes it out of the scope
      xo.disconnect('B')
      const narrowed = await publishGlobal(xo, 1, globalDocument, { pools: ['A'] })
      assert.equal(narrowed.result.ok, true)

      // B comes back: the sync drops its global part, and the owner key
      xo.reconnect('B')
      t.mock.timers.tick(60e3) // the sync of every minute
      await runSync(t)
      assert.deepEqual(globalNames(xo, 'B'), [])
      assert.equal(ownerOf(xo, 'B'), null)
      const own = await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: 'B' },
        body: { policy: text(document()) },
      })
      assert.equal(own.result.published, true)
    } finally {
      plugin.unload()
    }
  })
  test("an XOA restored from yesterday's VM backup takes its pools back, confirmed", async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: Date.now() })
    const store = fakeStore()
    const xoa = fakeXo({ store, pools: { A: {} } })
    const plugin = await loaded(xoa)
    let yesterday
    try {
      await publishGlobal(xoa, 0)
      yesterday = structuredClone(Object.fromEntries(store.data)) // the nightly VM backup
      const edited = structuredClone(globalDocument)
      edited.groups.admins.ips = ['192.0.2.31']
      await publishGlobal(xoa, 1, edited)
    } finally {
      plugin.unload()
    }

    // the XOA VM is broken by an update and restored from that backup
    const restored = fakeXo({ store: fakeStore(yesterday), pools: otherConfigs(xoa) })
    const pluginRestored = await loaded(restored)
    try {
      await runSync(t)
      const [pool] = (await restored.route('get', '/global')).result.pools
      assert.equal(pool.cloned, true)
      // nothing written meanwhile: the pool keeps revision 2
      assert.deepEqual(policyOf(restored, 'A').groups['global:admins'].ips, ['192.0.2.31'])
      const publish = await publishGlobal(restored, 1)
      assert.deepEqual([publish.result.published, publish.result.pools[0].globalLoss.cloned], [false, true])

      // Take back: a rollback, refused unless confirmed
      const { instance } = (await restored.route('get', '/global')).result
      const refused = await restored.route('post', '/pools/{id}/actions/take_over_global', {
        params: { id: 'A' },
        body: { expectedOwner: instance.id },
      })
      assert.deepEqual([refused.status, refused.result.globalLoss.cloned], [409, true])
      assert.deepEqual(policyOf(restored, 'A').groups['global:admins'].ips, ['192.0.2.31'])
      const taken = await restored.route('post', '/pools/{id}/actions/take_over_global', {
        params: { id: 'A' },
        body: { expectedOwner: instance.id, dropGlobal: true },
      })
      assert.equal(taken.status, 200)
      // written at once: this XO's revision, and its own again
      assert.deepEqual(policyOf(restored, 'A').groups['global:admins'].ips, ['192.0.2.30'])
      assert.equal(ownerOf(restored, 'A').revision, 1)
      assert.equal((await publishGlobal(restored, 1)).result.published, true)
    } finally {
      pluginRestored.unload()
    }
  })
})

// vdf#32, vdf#20: what changed in a pool without this XO
describe('changes outside this XO', () => {
  const globalDocument = {
    groups: { web: { tags: ['vdf:role=web'] } },
    policies: [{ name: 'web', appliedTo: 'web', default: 'drop', ingress: [] }],
  }
  const publishGlobal = (xo, revision = 0) =>
    xo.route('post', '/global/actions/publish', {
      body: { policy: text(globalDocument), scope: { all: true }, revision },
    })
  const historyOf = async (xo, poolId = POOL) =>
    (await xo.route('get', '/pools/{id}/history', { params: { id: poolId } })).result.entries
  const policyOf = async (xo, poolId = POOL) =>
    (await xo.route('get', '/pools/{id}/policy', { params: { id: poolId } })).result

  test('a document written outside this XO is kept in the pool history, also while XO was stopped', async () => {
    const store = fakeStore()
    const before = text(document(22))
    const xo = fakeXo({ store, otherConfig: { 'vdf:policy': before } })
    const plugin = await loaded(xo)
    try {
      // first sight: nothing to compare with
      await plugin.syncNow()
      assert.deepEqual(await historyOf(xo), [])
      assert.equal((await policyOf(xo)).outside, null)

      // vdf-agent publish, xe, another XO
      const outside = text(document(8080))
      xo.xapi.pool.other_config['vdf:policy'] = outside
      await plugin.syncNow()
      const entries = await historyOf(xo)
      assert.deepEqual(
        entries.map(entry => [entry.id, entry.docId, entry.publishedBy, entry.outside?.docChanged]),
        [
          [1, docId(before), null, undefined],
          [2, docId(outside), null, true],
        ]
      )
      assert.equal(entries[1].previousDocId, docId(before))
      assert.equal(entries[1].summary.modified, 1)
      assert.equal(entries[1].outside.sameIdentity, false)
      assert.equal((await policyOf(xo)).outside.current, true)

      // seen again: nothing new
      await plugin.syncNow()
      assert.equal((await historyOf(xo)).length, 2)

      // this XO's own publish is no outside change
      await xo.route('post', '/pools/{id}/actions/publish_policy', {
        params: { id: POOL },
        body: { policy: text(document(443)) },
      })
      await plugin.syncNow()
      const after = await historyOf(xo)
      assert.deepEqual(
        after.map(entry => entry.outside === undefined),
        [true, false, true]
      )
      assert.equal(after[2].previousDocId, docId(outside))
      assert.equal((await policyOf(xo)).outside.current, false)
    } finally {
      plugin.unload()
    }

    // a change made while this XO was stopped is seen at its first pass
    const whileStopped = text(document(25))
    const restarted = fakeXo({ store, otherConfig: { 'vdf:policy': whileStopped } })
    const plugin2 = await loaded(restarted)
    try {
      await plugin2.syncNow()
      const last = (await historyOf(restarted)).at(-1)
      assert.equal(last.docId, docId(whileStopped))
      assert.equal(last.outside.docChanged, true)
    } finally {
      plugin2.unload()
    }
  })

  test('another XO taking the pool over is in the history, and in the global status', async () => {
    const xo = fakeXo({ pools: { A: {}, B: {} } })
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo)
      await plugin.syncNow()
      xo.xapis.B.pool.other_config['vdf:global.owner'] = JSON.stringify({
        id: 'other',
        name: 'xo-b',
        since: '2026-10-26T12:00:00.000Z',
      })
      await plugin.syncNow()
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

  test('a copy of this XO writing the same pool is told apart, and counted once while they alternate', async () => {
    const xo = fakeXo()
    const plugin = await loaded(xo)
    try {
      await publishGlobal(xo)
      await plugin.syncNow()
      // a cloned XO VM: same identity, other global groups
      const ours = xo.xapi.pool.other_config['vdf:policy']
      const theirs = JSON.parse(ours)
      theirs.groups['global:web'] = { tags: ['vdf:role=web'], ips: ['192.0.2.9'] }
      const copyWrites = () => (xo.xapi.pool.other_config['vdf:policy'] = text(theirs))

      copyWrites()
      await plugin.syncNow()
      // this XO wrote its own global part back
      assert.equal(xo.xapi.pool.other_config['vdf:policy'], ours)
      copyWrites()
      await plugin.syncNow()

      const outsideEntries = (await historyOf(xo)).filter(entry => entry.outside !== undefined)
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
