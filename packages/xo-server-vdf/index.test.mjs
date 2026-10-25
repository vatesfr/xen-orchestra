import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'

import Ajv from 'ajv'

import createPlugin, { docId, mergeMonitor, publishedPolicy } from './index.mjs'

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
