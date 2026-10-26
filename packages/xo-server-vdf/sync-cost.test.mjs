// What the global sync costs on a large XO (vdf#42): with a global
// configuration, XAPI events trigger a sync pass, at most every 5 s (and
// one a minute), and each pass scans every VM XO knows. Synthetic: N pools
// of one host, M running VMs with one VIF each, the agents answering at
// once, so the numbers are XO's own work (the agents' check and publish
// add their XAPI round trips on top).
//
// `node --test` runs a small case. VDF_SYNC_BENCH=1 runs the matrix and
// prints a table: VDF_SYNC_BENCH=1 node --test sync-cost.test.mjs

import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'
import { performance } from 'node:perf_hooks'

import createPlugin, { docId } from './index.mjs'

function fakeStore() {
  const data = new Map()
  return {
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
    async *createReadStream() {},
    async *createKeyStream() {},
  }
}

const ROLES = ['web', 'app', 'db', 'cache', 'batch', 'misc', 'misc', 'misc', 'misc', 'misc']

// XO's objects, all in one collection as xo-server keeps them: getObjects
// filters the whole collection, as XO's does
function largeXo({ pools: poolCount, vms: vmCount }) {
  const objects = new Map()
  const xapis = {}
  let publishes = 0
  for (let p = 0; p < poolCount; p++) {
    const id = `pool-${p}`
    objects.set(id, { id, type: 'pool', name_label: `Pool ${p}` })
    objects.set(`net-${p}`, { id: `net-${p}`, type: 'network', tags: [] })
    const xapi = {
      pool: {
        other_config: {},
        master: 'OpaqueRef:master',
        async update_other_config(key, value) {
          const { [key]: _, ...rest } = xapi.pool.other_config
          xapi.pool.other_config = value === null ? rest : { ...rest, [key]: value }
        },
      },
      objects: { all: {} },
      getObjectByRef: () => undefined,
      async call(method, hostRef, plugin, fn, args) {
        if (fn === 'publish') {
          publishes++
          xapi.pool.other_config = { ...xapi.pool.other_config, 'vdf:policy': args.policy }
          return JSON.stringify({ ok: true, published: true, document: docId(args.policy), warnings: [] })
        }
        return JSON.stringify({ ok: true, warnings: [] })
      },
    }
    xapis[id] = xapi
  }
  for (let v = 0; v < vmCount; v++) {
    const p = v % poolCount
    const ip = `10.${p % 256}.${Math.floor(v / 256) % 256}.${v % 256}`
    objects.set(`vm-${v}`, {
      id: `vm-${v}`,
      type: 'VM',
      name_label: `vm-${v}`,
      $pool: `pool-${p}`,
      power_state: 'Running',
      tags: [`vdf:role=${ROLES[v % ROLES.length]}`, ...(v % 3 === 0 ? ['vdf:env=prod'] : [])],
      addresses: { '0/ipv4/0': ip },
      VIFs: [`vif-${v}`],
    })
    objects.set(`vif-${v}`, {
      id: `vif-${v}`,
      type: 'VIF',
      device: '0',
      $network: `net-${p}`,
      // a third locked, as on a pool that uses locking
      lockingMode: v % 3 === 0 ? 'locked' : 'network_default',
      allowedIpv4Addresses: v % 3 === 0 ? [ip] : [],
      allowedIpv6Addresses: [],
    })
  }
  let routes = []
  const store = fakeStore()
  return {
    all: objects,
    // XAPI events: the passes are run by hand
    objects: { on() {}, removeListener() {} },
    xapis,
    publishes: () => publishes,
    getStore: async () => store,
    registerRestRoutes(newRoutes) {
      routes = newRoutes
      return () => {
        routes = []
      }
    },
    getObjects: ({ filter }) => {
      const result = {}
      for (const [id, object] of objects) {
        if (object.type === filter.type) {
          result[id] = object
        }
      }
      return result
    },
    getObject(id, type) {
      const object = objects.get(id)
      if (object === undefined || (type !== undefined && object.type !== type)) {
        throw new Error('no such object')
      }
      return object
    },
    getXapi(id) {
      return xapis[id]
    },
    getXenServerIdByObject: pool => `server-${pool.id}`,
    getAllXenServers: async () => Object.keys(xapis).map(id => ({ id: `server-${id}` })),
    hasPermissions: async () => true,
    async route(method, endpoint, { params = {}, body, query = {} } = {}) {
      const route = routes.find(route => route.method === method && route.endpoint === endpoint)
      return route.callback({
        req: { params, body, query },
        res: { status: () => {} },
        restApi: { getCurrentUser: () => ({ id: 'admin', permission: 'admin' }) },
        createAction: cb => cb(),
      })
    },
  }
}

const GLOBAL = {
  groups: {
    web: { tags: ['vdf:role=web'] },
    app: { tags: ['vdf:role=app'] },
    db: { tags: ['vdf:role=db'] },
    prod: { tags: ['vdf:env=prod'] },
    admins: { ips: ['192.0.2.10', '192.0.2.11'] },
  },
  policies: [
    {
      name: 'ssh-from-admins',
      appliedTo: 'prod',
      tier: 'securityops',
      default: 'pass',
      ingress: [{ id: 1, from: 'admins', proto: 'tcp', ports: [22] }],
    },
    { name: 'web', appliedTo: 'web', default: 'drop', ingress: [{ id: 2, from: 'any', proto: 'tcp', ports: [443] }] },
    { name: 'app', appliedTo: 'app', default: 'drop', ingress: [{ id: 3, from: 'web', proto: 'tcp', ports: [8080] }] },
    { name: 'db', appliedTo: 'db', default: 'drop', ingress: [{ id: 4, from: 'app', proto: 'tcp', ports: [5432] }] },
  ],
}

const time = async fn => {
  const start = performance.now()
  await fn()
  return performance.now() - start
}

const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

async function measure({ pools, vms }) {
  const xo = largeXo({ pools, vms })
  const plugin = createPlugin({ xo })
  await plugin.load()
  try {
    const publish = await time(async () => {
      const { ok } = await xo.route('post', '/global/actions/publish', {
        body: { policy: JSON.stringify(GLOBAL), scope: { all: true }, revision: 0 },
      })
      assert.equal(ok, true)
    })
    await plugin.syncNow()

    // nothing changed: every pool is found in sync
    const before = xo.publishes()
    const steady = []
    for (let i = 0; i < 5; i++) {
      steady.push(await time(() => plugin.syncNow()))
    }
    assert.equal(xo.publishes(), before)

    // a VM joins a global group: its IP goes into every other pool
    xo.all.get('vm-5').tags.push('vdf:role=db')
    const changed = await time(() => plugin.syncNow())
    const rewritten = xo.publishes() - before
    assert.equal(rewritten, pools - 1)

    const status = await time(() => xo.route('get', '/global'))
    const documentSize = Math.max(...Object.values(xo.xapis).map(xapi => xapi.pool.other_config['vdf:policy'].length))
    return { pools, vms, publish, steady: median(steady), changed, rewritten, status, documentSize }
  } finally {
    plugin.unload()
  }
}

const row = r =>
  `| ${r.pools} | ${r.vms} | ${r.steady.toFixed(0)} ms | ${r.changed.toFixed(0)} ms (${r.rewritten} pools) | ${r.publish.toFixed(0)} ms | ${r.status.toFixed(0)} ms | ${(r.documentSize / 1024).toFixed(0)} KiB |`

describe('global sync cost (vdf#42)', () => {
  test('a pass on 20 pools and 2,000 VMs', async t => {
    const result = await measure({ pools: 20, vms: 2000 })
    t.diagnostic(row(result))
  })

  test('the matrix (VDF_SYNC_BENCH=1)', { skip: process.env.VDF_SYNC_BENCH === undefined }, async t => {
    const lines = [
      '| pools | running VMs | pass, nothing changed | pass, a VM joins a group | global publish | GET /global | pool document |',
      '| --- | --- | --- | --- | --- | --- | --- |',
    ]
    for (const size of [
      { pools: 10, vms: 1000 },
      { pools: 50, vms: 5000 },
      { pools: 100, vms: 10000 },
      { pools: 200, vms: 20000 },
      { pools: 200, vms: 50000 },
    ]) {
      lines.push(row(await measure(size)))
    }
    t.diagnostic('\n' + lines.join('\n'))
  })
})
