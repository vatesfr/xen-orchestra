import { createHash, randomUUID } from 'node:crypto'
import { isIP } from 'node:net'
import { hostname } from 'node:os'
import { isDeepStrictEqual } from 'node:util'
import { createLogger } from '@xen-orchestra/log'

import {
  addressOverlaps,
  canonical,
  checkGlobalDocument,
  checkLocalDocument,
  compose,
  duplicateAddresses,
  emptyDocument,
  globalMembers,
  globalPart,
  hasGlobalPart,
  hostStatus,
  inScope,
  isFresh,
  isStopping,
  isVdfLocked,
  sameAddresses,
  keepGlobalPart,
  localPart,
  memberConflicts,
  OWNER_KEY,
  poolOwner,
  poolSyncState,
  remoteIpsFor,
  reservedTierPolicies,
  runningVmRecords,
  serialize,
  supportsVdfLock,
  VDF_LOCKING_KEY,
  vdfLockEnforcement,
} from './global.mjs'
import { appendEntry, listEntries, nextEntryId, summarize } from './history.mjs'
import { trace } from './trace.mjs'

const log = createLogger('xo:xo-server-vdf')

// The policy lives in pool.other_config, one key per format (vdf-agent
// publish writes them): agents enforce the newest key they can read whose
// base still matches the older keys (agent/inventory.go: candidates).
const KEY_V1 = 'vdf:policy'
const KEY_V2 = 'vdf:policy.v2'
const KEY_V2_BASE = 'vdf:policy.v2.base'
const KEY_V3 = 'vdf:policy.v3'
const KEY_V3_BASE = 'vdf:policy.v3.base'
// documents with a policy in monitor mode (vdf#13): agents before it never
// see them, and keep the v3 document
const KEY_V4 = 'vdf:policy.v4'
const KEY_V4_BASE = 'vdf:policy.v4.base'
// documents with port ranges (vdf#54): agents before them get the ranges
// listed port by port in the older keys, or keep their last document
const KEY_V5 = 'vdf:policy.v5'
const KEY_V5_BASE = 'vdf:policy.v5.base'
// documents with egress rules (vdf#53): agents before them get the
// document without its egress rules in the older keys
const KEY_V6 = 'vdf:policy.v6'
const KEY_V6_BASE = 'vdf:policy.v6.base'
// documents with per-network groups (vdf#36): only there, agents before
// them keep their last document
const KEY_V7 = 'vdf:policy.v7'
const KEY_V7_BASE = 'vdf:policy.v7.base'

const PLUGIN = 'vdf'

const sha256Hex = (text, bytes) =>
  createHash('sha256')
    .update(text)
    .digest('hex')
    .slice(0, bytes * 2)

const v2Base = v1 => sha256Hex(v1, 8)
const v3Base = (v1, v2) => v2Base(v1 + '\x00' + v2)
const v4Base = (v1, v2, v3) => v2Base(v1 + '\x00' + v2 + '\x00' + v3)
const v5Base = (v1, v2, v3, v4) => v2Base(v1 + '\x00' + v2 + '\x00' + v3 + '\x00' + v4)
const v6Base = (v1, v2, v3, v4, v5) => v2Base(v1 + '\x00' + v2 + '\x00' + v3 + '\x00' + v4 + '\x00' + v5)
const v7Base = (v1, v2, v3, v4, v5, v6) =>
  v2Base(v1 + '\x00' + v2 + '\x00' + v3 + '\x00' + v4 + '\x00' + v5 + '\x00' + v6)

// short id of a document, as agents report it in host other_config vdf:status
export const docId = text => (text ? sha256Hex(text, 6) : '')

export function publishedPolicy(otherConfig) {
  const v1 = otherConfig[KEY_V1] ?? ''
  const v2 = otherConfig[KEY_V2] ?? ''
  const v3 = otherConfig[KEY_V3] ?? ''
  const v4 = otherConfig[KEY_V4] ?? ''
  const v5 = otherConfig[KEY_V5] ?? ''
  const v6 = otherConfig[KEY_V6] ?? ''
  const v7 = otherConfig[KEY_V7] ?? ''

  let key
  let text
  if (v7 !== '' && otherConfig[KEY_V7_BASE] === v7Base(v1, v2, v3, v4, v5, v6)) {
    ;[key, text] = [KEY_V7, v7]
  } else if (v6 !== '' && otherConfig[KEY_V6_BASE] === v6Base(v1, v2, v3, v4, v5)) {
    ;[key, text] = [KEY_V6, v6]
  } else if (v5 !== '' && otherConfig[KEY_V5_BASE] === v5Base(v1, v2, v3, v4)) {
    ;[key, text] = [KEY_V5, v5]
  } else if (v4 !== '' && otherConfig[KEY_V4_BASE] === v4Base(v1, v2, v3)) {
    ;[key, text] = [KEY_V4, v4]
  } else if (v3 !== '' && otherConfig[KEY_V3_BASE] === v3Base(v1, v2)) {
    ;[key, text] = [KEY_V3, v3]
  } else if (v2 !== '' && otherConfig[KEY_V2_BASE] === v2Base(v1)) {
    ;[key, text] = [KEY_V2, v2]
  } else if (v1 !== '') {
    ;[key, text] = [KEY_V1, v1]
  }
  if (key === undefined) {
    return { key: null, docId: '', text: null, document: null }
  }

  let document = null
  let parseError
  try {
    document = JSON.parse(text)
  } catch (error) {
    parseError = error.message
  }
  return { key, docId: docId(text), text, document, parseError }
}

const PARAMS_ID = { id: { type: 'string', example: '355ee47d-ff4c-4924-3db2-fd86ae629676' } }

const BODY_POLICY = { policy: { type: 'string', description: 'the policy document (JSON text)' } }

const BODY_PUBLISH = {
  ...BODY_POLICY,
  expectedDocId: {
    type: 'string',
    optional: true,
    description:
      "id of the document the edit started from ('' for none): refused if the pool's document changed meanwhile",
  },
}

const PARAMS_ENTRY = {
  ...PARAMS_ID,
  entry: { type: 'string', example: '12' },
}

const PARAMS_GLOBAL_ENTRY = { entry: { type: 'string', example: '4' } }

const GLOBAL_SCOPE = 'global'

const historyKey = scopeId => `history:${scopeId}`

// what this XO last saw of a pool, and what it wrote there (vdf#32)
const seenKey = poolId => `seen:${poolId}`

// an owner as compared: its id and since (null: none)
const ownerKey = owner => (owner == null ? null : `${owner.id}\x00${owner.since ?? ''}`)

// this XO's writes a pool's events may still bring: the latest ones
const EXPECT_LENGTH = 8

const BODY_TRACE = {
  from: { type: 'string', example: '6c51b800-7de2-3b18-23b3-26d89b749a46' },
  to: { type: 'string', example: '192.168.1.76' },
  proto: { type: 'enum', enum: ['tcp', 'udp', 'icmp', 'any'] },
  port: { type: 'number', optional: true, example: 5432 },
  state: { type: 'enum', enum: ['new', 'established', 'revoked'], optional: true },
  family: { type: 'number', optional: true },
  broadcast: { type: 'boolean', optional: true },
}

// The addresses of a VDF lock (vdf#41), per family: single addresses only
// (XAPI takes prefixes, which would let the guest pick any address in
// one), no IPv6 link-local (always allowed) nor IPv4-mapped, canonical as
// agents compare them. { ipv4, ipv6 }, or { error }.
export function lockAddresses({ ipv4, ipv6 } = {}) {
  const lists = { ipv4, ipv6 }
  const result = { ipv4: [], ipv6: [] }
  for (const [family, list] of Object.entries(lists)) {
    const version = family === 'ipv4' ? 4 : 6
    if (!Array.isArray(list)) {
      return { error: `${family}: a list of addresses` }
    }
    for (const entry of list) {
      if (typeof entry !== 'string' || entry.includes('%') || isIP(entry.trim()) !== version) {
        return { error: `${family}: ${JSON.stringify(entry)} isn't an IPv${version} address (a prefix neither)` }
      }
      const address = version === 4 ? entry.trim() : new URL(`http://[${entry.trim()}]`).hostname.slice(1, -1)
      if (version === 4 && (address === '0.0.0.0' || /^127\./.test(address) || Number(address.split('.')[0]) >= 224)) {
        // unspecified, loopback, multicast (224/4) or reserved and broadcast
        return { error: `ipv4: ${entry} can't be an interface's address` }
      }
      // unspecified, loopback (::1) and IPv4-compatible (::a.b.c.d, the
      // first 96 bits zero), multicast (ff00::/8), IPv4-mapped
      // (::ffff:0:0/96). A link-local address (fe80::/10) is one: the agent
      // lets ND from link-local through from the VIF's own EUI-64 one only,
      // so a guest using another (random, stable-privacy) needs it listed;
      // it never counts as a member address.
      if (
        version === 6 &&
        (/^::(([0-9a-f]{1,4}:)?[0-9a-f]{1,4})?$/.test(address) ||
          /^ff[0-9a-f]{2}:/.test(address) ||
          address.startsWith('::ffff:'))
      ) {
        return {
          error: `ipv6: ${entry} can't be an interface's address (loopback, multicast, IPv4-mapped or compatible)`,
        }
      }
      if (!result[family].includes(address)) {
        result[family].push(address)
      }
    }
  }
  if (result.ipv4.length + result.ipv6.length === 0) {
    // locked to nothing, the interface would be cut off
    return { error: 'an interface locked to no address would be cut off: give its addresses' }
  }
  return result
}

const BODY_VDF_LOCK = {
  ipv4: { type: 'array', items: { type: 'string' }, example: ['192.168.1.10'] },
  ipv6: { type: 'array', items: { type: 'string' }, example: ['2001:db8::10'] },
}

const BODY_VDF_UNLOCK = {
  clear: { type: 'boolean', optional: true, description: 'also empty its allowed addresses' },
}

const BODY_GLOBAL = {
  policy: { type: 'string', description: 'the global document (JSON text): groups and policies, names without prefix' },
  scope: {
    type: 'object',
    fields: {
      all: { type: 'boolean', optional: true },
      pools: { type: 'array', items: { type: 'string' }, optional: true },
    },
  },
  revision: {
    type: 'number',
    optional: true,
    description:
      'revision the edit started from, 0 for the first publish: a publish from an older one is refused with conflict: true (required to publish, ignored by check)',
  },
}

// pools whose sync failed are retried at most this often
const SYNC_RETRY_MS = 60e3

// a pool a global publish couldn't write is retried sooner: the user just
// published, and waits for every pool to enforce it
const PUBLISH_RETRY_MS = 5e3

// the running VMs of a connected pool are saved at least this often, so
// that their age is known if XO loses the pool
const VM_CACHE_SAVE_MS = 60e3

const QUERY_LOG = {
  lines: { type: 'number', optional: true, example: 200 },
  since: { type: 'string', optional: true, example: '2026-10-22T08:00:00.000Z' },
}

const QUERY_MONITOR = {
  policy: { type: 'string', optional: true, example: 'db' },
  since: { type: 'string', optional: true, example: '2026-10-22T08:00:00Z' },
  lines: { type: 'number', optional: true, example: 500 },
}

// Monitor mode (vdf#13): each host reports what its monitored policies
// would drop for the VMs it runs. A VM that moved shows on several hosts:
// one entry per (source, VM and its interface, egress destination, proto,
// port, policy, rule, alone and shadowed tier), counts added, first and
// last seen over all hosts, most recently seen first. An "alone" entry
// (vdf#86) is what the policy would drop once the enforced policies it
// names (shadowedBy, the newest entry's), of tier shadowedTier (its own,
// or an earlier one), no longer apply to the VM: kept apart from the same
// flow's entry of what enforcing breaks now, and from another shadowed
// tier's.
export function mergeMonitor(hosts) {
  const byKey = new Map()
  for (const { host, entries = [] } of hosts) {
    for (const entry of entries) {
      const key = [
        entry.src,
        entry.vm,
        entry.vif ?? '',
        entry.egress === true ? `>${entry.dst ?? ''}` : '',
        entry.proto,
        entry.port ?? 0,
        entry.policy,
        entry.rule ?? 0,
        // one isolated pass per shadowed tier: its own entries
        entry.alone === true ? `alone:${entry.shadowedTier ?? ''}` : '',
      ].join('|')
      const merged = byKey.get(key)
      if (merged === undefined) {
        byKey.set(key, { ...entry, hosts: [host], expired: entry.expired === true })
        continue
      }
      merged.count += entry.count
      merged.first = entry.first < merged.first ? entry.first : merged.first
      if (entry.last > merged.last) {
        merged.last = entry.last
        merged.vmName = entry.vmName
        if (entry.shadowedBy !== undefined) {
          merged.shadowedBy = entry.shadowedBy
        }
      }
      merged.hosts.push(host)
      // still monitored somewhere: not expired
      merged.expired = merged.expired && entry.expired === true
    }
  }
  return [...byKey.values()].sort((a, b) => (a.last > b.last ? -1 : a.last < b.last ? 1 : 0))
}

// The shadowed tiers each host's agent left without an isolated pass
// (vdf#86, past its cap of tier visits): what their monitored policies
// alone would drop isn't checked there. One per policy, VIF, direction and
// tier, whatever the hosts (a VM that moved); absent from older agents.
export function mergeUnchecked(hosts) {
  const byKey = new Map()
  for (const { unchecked = [] } of hosts) {
    for (const item of Array.isArray(unchecked) ? unchecked : []) {
      const key = [item.policy, item.vif, item.egress === true ? 'out' : 'in', item.tier].join('|')
      if (!byKey.has(key)) {
        byKey.set(key, item)
      }
    }
  }
  return [...byKey.values()]
}

const userLabel = user => user?.email ?? user?.name ?? user?.id

const isAdmin = user => user?.permission === 'admin'

function forbidden(res, message) {
  res.status(403)
  return { error: message }
}

// XO's config export only covers registered config managers, which can't
// be unregistered: the plugin registers once per process, and the
// exporter and importer work on the store whether the plugin is loaded or
// not (a loaded plugin reloads what was imported).
let configManagerRegistered = false
let loadedPlugin

async function readStore(store) {
  const data = { history: {} }
  for await (const { key, value } of store.createReadStream()) {
    if (key.startsWith('history:')) {
      data.history[key.slice('history:'.length)] = value
    } else {
      data[key] = value
    }
  }
  return data
}

async function writeStore(store, { history = {}, ...rest }) {
  const keys = []
  for await (const key of store.createKeyStream()) {
    keys.push(key)
  }
  await Promise.all(keys.map(key => store.del(key)))
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== null) {
      await store.put(key, value)
    }
  }
  for (const [scopeId, entries] of Object.entries(history)) {
    if (Array.isArray(entries)) {
      await store.put(historyKey(scopeId), entries)
    }
  }
}

// An import keeps this XO's identity (vdf#20): an export restored on a
// second XO (upgrade test, staging copy, DR rehearsal) while the first one
// still runs must not make both the owner of the same pools. The imported
// identity is recorded as the XO this one replaces, and its pools stay
// its own until an administrator takes them over (take_over_replaced).
// Importing an export of this same XO changes nothing.
//
// What this XO saw in its pools (seen:<pool id>, vdf#32) stays its own too:
// an export's, older, would make every change since then look like one made
// outside this XO.
export async function importStore(store, { instance: imported, replaces, ...data }) {
  const own = (await store.has('instance')) ? await store.get('instance') : newInstance()
  const isOther = typeof imported?.id === 'string' && imported.id !== own.id
  const seen = {}
  for await (const { key, value } of store.createReadStream()) {
    if (key.startsWith('seen:')) {
      seen[key] = value
    }
  }
  await writeStore(store, {
    ...Object.fromEntries(Object.entries(data).filter(([key]) => !key.startsWith('seen:'))),
    ...seen,
    instance: own,
    replaces: isOther ? { id: imported.id, name: imported.name, importedAt: new Date().toISOString() } : replaces,
  })
}

const newInstance = () => ({ id: randomUUID(), name: hostname() })

function registerConfigManager(xo) {
  if (configManagerRegistered || typeof xo.addConfigManager !== 'function') {
    return
  }
  configManagerRegistered = true
  xo.addConfigManager(
    'vdf',
    async () => readStore(await xo.getStore('vdf')),
    async data => {
      await importStore(await xo.getStore('vdf'), data)
      await loadedPlugin?.reloadStore()
    }
  )
}

// Tech preview (vdf#42): opt-in. xo-server loads a plugin without a
// configuration schema as soon as it's installed; with a required setting,
// it stays unloaded until an administrator enables it in Settings > Plugins.
// Unloading it is the kill switch: its routes go away, so does the
// firewall interface (XO 6 shows it only while GET /plugins/vdf/info
// answers), and nothing runs in the background.
export const configurationSchema = {
  type: 'object',
  properties: {
    enableTechPreview: {
      type: 'boolean',
      title: 'Enable the VDF firewall (tech preview)',
      description:
        "Shows the Firewall pages in XO 6 and lets administrators publish policies to pools whose hosts run the vdf agent. Unload the plugin to hide them again: policies already published stay enforced by the hosts' agents.",
      enum: [true],
    },
  },
  required: ['enableTechPreview'],
}

class VdfPlugin {
  #unregisterRoutes
  #xo

  // XO-wide configuration (global.mjs): { document, revision, scope,
  // publishedAt, publishedBy }, persisted in XO's store
  #store
  #global

  // per pool: last write { at, ok, error, state, revision }, persisted
  #syncs = {}

  // this XO, as it records itself in the pools whose global part it writes
  // (OWNER_KEY); kept in the store, never imported (importStore)
  #instance

  // the XO whose configuration was imported here, if another one: { id,
  // name, importedAt }
  #replaces

  // per pool: { at, name, serverId, records }, the running VMs of each pool
  // when XO last saw them. A pool XO loses keeps its members in the other
  // pools (fail static) as long as XO still has its server, and loses them
  // once the server is removed from XO.
  #vmCache = {}
  #vmCacheSavedAt = 0
  #syncTimer
  #syncInterval
  #syncing
  #syncAgain

  // per pool: what this XO last saw there or wrote (vdf#32), cached from
  // the store
  #seen = new Map()

  // per scope: the publish in progress, so that each one compares with
  // what the previous one wrote
  #publishing = new Map()

  constructor({ xo }) {
    this.#xo = xo
    registerConfigManager(xo)
  }

  async #get(key, defaultValue) {
    return (await this.#store.has(key)) ? this.#store.get(key) : defaultValue
  }

  async reloadStore() {
    this.#global = await this.#get('global')
    this.#syncs = await this.#get('syncs', {})
    this.#vmCache = await this.#get('vms', {})
    this.#instance = await this.#get('instance')
    if (this.#instance === undefined) {
      this.#instance = newInstance()
      await this.#store.put('instance', this.#instance)
    }
    this.#replaces = await this.#get('replaces')
    this.#seen = new Map()
    // the history starts with the configuration published before it was kept
    if (this.#global !== undefined && !(await this.#store.has(historyKey(GLOBAL_SCOPE)))) {
      await this.#appendHistory(GLOBAL_SCOPE, [], this.#globalEntry(this.#global, undefined))
    }
  }

  // the only setting is the opt-in, checked by the schema
  configure() {}

  async load() {
    this.#store = await this.#xo.getStore('vdf')
    await this.reloadStore()
    loadedPlugin = this
    this.#unregisterRoutes = this.#xo.registerRestRoutes(this.#routes(), '/plugins/vdf')

    // members of global groups follow XAPI events (tags, power state, IPs,
    // VIF locking), and a pool that was unreachable catches up
    this.#xo.objects.on('finish', this.#scheduleSync)
    this.#syncInterval = setInterval(this.#scheduleSync, SYNC_RETRY_MS)
    this.#scheduleSync()
  }

  unload() {
    if (loadedPlugin === this) {
      loadedPlugin = undefined
    }
    this.#unregisterRoutes?.()
    this.#unregisterRoutes = undefined
    this.#xo.objects.removeListener('finish', this.#scheduleSync)
    clearInterval(this.#syncInterval)
    clearTimeout(this.#syncTimer)
  }

  // one sync pass now, as the timer runs it (tests, and measuring its cost,
  // vdf#42)
  async syncNow() {
    clearTimeout(this.#syncTimer)
    this.#syncTimer = undefined
    await this.#sync()
  }

  // GLOBAL CONFIGURATION

  #pools() {
    return Object.values(this.#xo.getObjects({ filter: { type: 'pool' } }))
  }

  #connectedXapi(poolId) {
    try {
      return this.#withPool(this.#xo.getXapi(poolId), poolId)
    } catch {
      return undefined
    }
  }

  // the pool of each Xapi this plugin uses, to record what it writes there
  // (vdf#32)
  #xapiPools = new WeakMap()

  #withPool(xapi, poolId) {
    if (xapi !== undefined && xapi !== null) {
      this.#xapiPools.set(xapi, poolId)
    }
    return xapi
  }

  #vifsOf = vm =>
    (vm.VIFs ?? []).flatMap(id => {
      try {
        return [this.#xo.getObject(id, 'VIF')]
      } catch {
        return []
      }
    })

  #networkOf = vif => {
    try {
      return this.#xo.getObject(vif.$network, 'network')
    } catch {
      return undefined
    }
  }

  #hostOf(hostId) {
    try {
      return this.#xo.getObject(hostId, 'host')
    } catch {
      return undefined
    }
  }

  // The VDF locks the host of a running VM enforces (vdf#41), from what
  // its agent reports (none on a host XO doesn't know or that isn't
  // running): each host's status read once per pass
  #enforcementOf(now = Date.now()) {
    const byHost = new Map()
    return vm => {
      if (!byHost.has(vm.$container)) {
        const host = this.#hostOf(vm.$container)
        byHost.set(
          vm.$container,
          host === undefined
            ? undefined
            : vdfLockEnforcement(hostStatus(host.otherConfig), { now, live: host.power_state === 'Running' })
        )
      }
      return byHost.get(vm.$container)
    }
  }

  // running VMs of the connected pools, and the last known ones of the
  // pools XO lost (stale)
  #records() {
    const connected = new Set(this.#pools().map(pool => pool.id))
    const vms = Object.values(this.#xo.getObjects({ filter: { type: 'VM' } }))
    return [
      ...runningVmRecords(vms, this.#vifsOf, this.#networkOf, this.#enforcementOf()),
      ...Object.entries(this.#vmCache)
        .filter(([poolId]) => !connected.has(poolId))
        .flatMap(([, { at, records }]) => records.map(record => ({ ...record, stale: true, seenAt: at }))),
    ]
  }

  // Refreshes the saved VMs of the connected pools, and forgets the pools
  // whose server was removed from XO: their members are known gone.
  async #refreshVmCache() {
    const records = this.#records().filter(record => !record.stale)
    const cache = {}
    for (const pool of this.#pools()) {
      let serverId
      try {
        serverId = this.#xo.getXenServerIdByObject(pool)
      } catch {}
      cache[pool.id] = {
        at: Date.now(),
        name: pool.name_label,
        serverId,
        records: records.filter(record => record.pool === pool.id),
      }
    }
    const servers = new Set((await this.#xo.getAllXenServers?.())?.map(server => server.id))
    for (const [poolId, entry] of Object.entries(this.#vmCache)) {
      if (cache[poolId] === undefined && servers.has(entry.serverId)) {
        cache[poolId] = entry
      }
    }
    const withoutTimes = cache_ => Object.entries(cache_).map(([poolId, { at, ...entry }]) => [poolId, entry])
    const changed = !isDeepStrictEqual(withoutTimes(cache), withoutTimes(this.#vmCache))
    this.#vmCache = cache
    if (changed || Date.now() - this.#vmCacheSavedAt > VM_CACHE_SAVE_MS) {
      this.#vmCacheSavedAt = Date.now()
      await this.#store.put('vms', cache).catch(error => log.warn('saving VMs', { error }))
    }
  }

  // pools XO lost but still has a server for
  #lostPools() {
    const connected = new Set(this.#pools().map(pool => pool.id))
    return Object.entries(this.#vmCache)
      .filter(([poolId]) => !connected.has(poolId))
      .map(([id, { name, at }]) => ({ id, name, seenAt: at }))
  }

  // global members, and what their IPs share with other VMs
  #analysis(global = this.#global?.document, scope = this.#global?.scope) {
    if (global === undefined) {
      return { members: {}, conflicts: [], overlaps: [] }
    }
    const records = this.#records()
    const members = globalMembers({ global, records, scope })
    const duplicates = duplicateAddresses(records)
    return { members, conflicts: memberConflicts(members, duplicates), overlaps: addressOverlaps(duplicates, scope) }
  }

  // the document a pool must hold: its own part, plus the global
  // configuration when it's in scope
  #composeFor(poolId, local, { global = this.#global, analysis = this.#analysis() } = {}) {
    const isInScope = global !== undefined && inScope(global.scope, poolId)
    return compose(
      local,
      isInScope ? global.document : null,
      isInScope ? remoteIpsFor(poolId, analysis.members, analysis.conflicts) : {}
    )
  }

  #isInScope(poolId) {
    return this.#global !== undefined && inScope(this.#global.scope, poolId)
  }

  // the XO whose global configuration the pool holds, if not this one
  #otherOwner(xapi) {
    const owner = poolOwner(xapi.pool?.other_config)
    return owner !== undefined && owner.id !== this.#instance.id ? owner : undefined
  }

  // pool routes: what the user sent, with XO's global part in place of
  // whatever global part it holds (or, in a pool another XO owns, with the
  // global part it holds)
  #poolDocument(poolId, text) {
    let document
    try {
      document = JSON.parse(text)
    } catch {
      return { text } // the agent reports the parse error
    }
    const xapi = this.#getXapi(poolId)
    const composed =
      this.#otherOwner(xapi) === undefined
        ? this.#composeFor(poolId, document)
        : keepGlobalPart(document, publishedPolicy(xapi.pool.other_config ?? {}).document)
    // in scope, or holding another XO's global part: the earliest tiers are
    // the global configuration's (vdf#21)
    const globalScope = this.#isInScope(poolId) || hasGlobalPart(composed)
    const errors = checkLocalDocument(document, { globalScope })
    if (errors.length > 0) {
      return { error: errors.join('; ') }
    }
    return { text: serialize(composed) }
  }

  async #claim(xapi) {
    const owner = { ...this.#instance, since: new Date().toISOString() }
    await this.#expectOwn(xapi, { owner })
    return xapi.pool.update_other_config(OWNER_KEY, JSON.stringify(owner))
  }

  // Makes this XO the owner of the pool's global part, if its owner is
  // still the one the user saw (expectedOwner, '' for none)
  #takeOver(poolId, expectedOwner) {
    const xapi = this.#getXapi(poolId)
    return this.#serialized(poolId, async () => {
      const previous = poolOwner(xapi.pool.other_config)
      if ((previous?.id ?? '') !== expectedOwner) {
        return {
          conflict: true,
          owner: previous ?? null,
          error: `the pool's owner changed meanwhile (${previous?.name ?? 'none'} now): look again before taking it over`,
        }
      }
      await this.#claim(xapi)
      log.info('pool taken over for the global configuration', { pool: poolId, previous })
      this.#scheduleSync()
      return { previous: previous ?? null }
    })
  }

  // Publishes a pool's document and, once it's written, records this XO as
  // the owner of the pool's global part when it wrote the first one (or
  // forgets it when it removed it): a refused publish claims nothing.
  // Another XO's ownership is only changed by a take over. Callers hold the
  // pool's lock (#serialized).
  async #publishOnPool(xapi, text) {
    let document = null
    try {
      document = JSON.parse(text)
    } catch {}
    const writesGlobal = hasGlobalPart(document)
    const result = await this.#onMaster(xapi, 'publish', { policy: text })
    if (result.published) {
      // what XAPI's events will bring (vdf#32)
      await this.#expectOwn(xapi, {
        docIds: [...new Set([docId(text), result.document].filter(id => typeof id === 'string' && id !== ''))],
      })
      const owner = poolOwner(xapi.pool.other_config)
      if (writesGlobal && owner === undefined) {
        await this.#claim(xapi)
      } else if (!writesGlobal && owner?.id === this.#instance.id) {
        await this.#expectOwn(xapi, { owner: null })
        await xapi.pool.update_other_config(OWNER_KEY, null)
      }
    }
    return result
  }

  // Writes the global part a pool must hold, in the pool's lock and from
  // what the pool holds at that moment: a pool publish that landed meanwhile
  // is kept, and an owner that changed meanwhile is respected. XAPI has no
  // compare-and-set on other_config, so a window remains between this read
  // and the agent's write, as short as the agent call.
  #syncPool(poolId, analysis) {
    return this.#serialized(poolId, async () => {
      const xapi = this.#connectedXapi(poolId)
      if (xapi === undefined) {
        return { ok: false, unreachable: true, error: 'XO is not connected to this pool' }
      }
      const owner = this.#otherOwner(xapi)
      if (owner !== undefined) {
        return { ok: false, otherXo: true, owner: owner.name }
      }
      const published = publishedPolicy(xapi.pool.other_config ?? {})
      const expected = this.#composeFor(poolId, published.document, { analysis })
      const state = poolSyncState({
        inScope: inScope(this.#global.scope, poolId),
        published: published.document,
        expected,
      })
      if (state === 'in-sync' || state === 'out-of-scope') {
        // a global part this XO wrote before it recorded itself as the owner
        if (
          state === 'in-sync' &&
          hasGlobalPart(published.document) &&
          poolOwner(xapi.pool.other_config) === undefined
        ) {
          await this.#claim(xapi)
        }
        return { ok: true, state, unchanged: true }
      }
      const result = await this.#publishOnPool(xapi, serialize(expected))
      if (result.published) {
        await this.#recordSyncWrite(poolId, published, { docId: result.document, document: expected }).catch(error =>
          log.warn('recording the sync', { pool: poolId, error })
        )
      }
      return { ...result, state }
    })
  }

  async #globalStatus(user) {
    await this.#refreshVmCache()
    const outside = Object.fromEntries(
      await Promise.all(
        this.#pools().map(async pool => {
          const xapi = this.#connectedXapi(pool.id)
          const id = xapi === undefined ? undefined : publishedPolicy(xapi.pool?.other_config ?? {}).docId
          return [pool.id, await this.#outsideOf(pool.id, id)]
        })
      )
    )
    const global = this.#global
    const analysis = this.#analysis()
    const admin = isAdmin(user)
    const canView = async poolId => admin || (await this.#xo.hasPermissions(user.id, [[poolId, 'view']]))
    const poolName = Object.fromEntries([
      ...this.#lostPools().map(pool => [pool.id, pool.name]),
      ...this.#pools().map(pool => [pool.id, pool.name_label]),
    ])
    const connected = this.#pools().map(pool => {
      const xapi = this.#connectedXapi(pool.id)
      const base = {
        id: pool.id,
        name: pool.name_label,
        inScope: global !== undefined && inScope(global.scope, pool.id),
        // the last change made there outside this XO (vdf#32)
        ...(outside[pool.id] === undefined ? {} : { outside: outside[pool.id] }),
      }
      if (xapi === undefined) {
        return { ...base, state: 'unreachable', sync: this.#syncs[pool.id] }
      }
      const published = publishedPolicy(xapi.pool?.other_config ?? {})
      const owner = this.#otherOwner(xapi)
      if (owner !== undefined) {
        return {
          ...base,
          docId: published.docId,
          state: 'other-xo',
          owner: owner.name,
          ownerId: owner.id,
          sync: this.#syncs[pool.id],
        }
      }
      const expected = this.#composeFor(pool.id, published.document, { analysis })
      // a pool in scope whose own policies came before the global ones
      // (vdf#21): it holds the global part, but can't publish until moved
      const reservedTiers = base.inScope ? reservedTierPolicies(published.document) : []
      return {
        ...base,
        docId: published.docId,
        state:
          global === undefined ? 'out-of-scope' : poolSyncState({ ...base, published: published.document, expected }),
        ...(reservedTiers.length > 0 ? { reservedTiers } : {}),
        sync: this.#syncs[pool.id],
      }
    })
    const lost = this.#lostPools().map(({ id, name, seenAt }) => ({
      id,
      name,
      inScope: global !== undefined && inScope(global.scope, id),
      state: 'unreachable',
      seenAt,
      sync: this.#syncs[id],
    }))
    const visible = new Set()
    for (const pool of [...connected, ...lost]) {
      if (await canView(pool.id)) {
        visible.add(pool.id)
      }
    }
    const withPoolName = vm => ({ ...vm, poolName: poolName[vm.pool] })
    // members from a pool another XO owns (vdf#30): they count here, but
    // their pool never gets this XO's global policies
    const otherXo = Object.fromEntries(
      connected.filter(pool => pool.owner !== undefined).map(pool => [pool.id, pool.owner])
    )
    const withOrigin = member =>
      otherXo[member.pool] === undefined
        ? withPoolName(member)
        : { ...withPoolName(member), otherXo: otherXo[member.pool] }
    return {
      document: global?.document ?? emptyDocument(),
      revision: global?.revision ?? 0,
      scope: global?.scope ?? { all: true },
      publishedAt: global?.publishedAt,
      publishedBy: global?.publishedBy,
      canEdit: admin,
      instance: this.#instance,
      // the XO whose configuration was imported here: its pools stay its own
      // until taken over
      replaces: this.#replaces,
      pools: [...connected, ...lost].filter(pool => visible.has(pool.id)),
      members: Object.fromEntries(
        Object.entries(analysis.members).map(([name, list]) => [
          name,
          list.filter(member => visible.has(member.pool)).map(withOrigin),
        ])
      ),
      // a member's IP another VM holds too: left out of the other pools
      conflicts: analysis.conflicts
        .filter(conflict => visible.has(conflict.member.pool))
        .map(conflict => ({
          ...conflict,
          member: withPoolName(conflict.member),
          holders: conflict.holders.map(withPoolName),
        })),
      // the same IP in two pools in scope: they may not share an address space
      overlaps: analysis.overlaps
        .filter(overlap => overlap.holders.every(holder => visible.has(holder.pool)))
        .map(overlap => ({ ...overlap, holders: overlap.holders.map(withPoolName) })),
    }
  }

  // Every pool in scope (and every pool still holding a global part)
  // checks its new document with its master's agent: nothing is published
  // unless every reachable one accepts it. Unreachable pools, and pools
  // another XO owns, are reported; the former catch up once XO reaches them
  // again, the latter once taken over.
  async #checkGlobal(text, scope) {
    let document
    try {
      document = JSON.parse(text)
    } catch (error) {
      return { ok: false, error: `invalid JSON: ${error.message}`, pools: [] }
    }
    const errors = checkGlobalDocument(document)
    if (errors.length > 0) {
      return { ok: false, error: errors[0], pools: [] }
    }
    await this.#refreshVmCache()
    // a pool XO doesn't know (a typo, a pool removed from XO) would never
    // get the configuration, unnoticed
    const known = new Set([...this.#pools().map(pool => pool.id), ...this.#lostPools().map(pool => pool.id)])
    const unknown = (scope?.all === true ? [] : (scope?.pools ?? [])).filter(id => !known.has(id))
    if (unknown.length > 0) {
      return { ok: false, error: `unknown pool in the scope: ${unknown.join(', ')}`, pools: [] }
    }
    const global = { document, scope }
    const analysis = this.#analysis(document, scope)
    const lost = this.#lostPools()
      .filter(pool => inScope(scope, pool.id))
      .map(pool => ({
        id: pool.id,
        name: pool.name,
        inScope: true,
        ok: false,
        unreachable: true,
        error: 'XO is not connected to this pool',
      }))
    const pools = await Promise.all(
      this.#pools().map(async pool => {
        const base = { id: pool.id, name: pool.name_label, inScope: inScope(scope, pool.id) }
        const xapi = this.#connectedXapi(pool.id)
        if (xapi === undefined) {
          return { ...base, ok: false, unreachable: true, error: 'XO is not connected to this pool' }
        }
        const owner = this.#otherOwner(xapi)
        if (owner !== undefined) {
          return base.inScope
            ? {
                ...base,
                ok: false,
                otherXo: true,
                owner: owner.name,
                error: `the pool holds the global configuration of another XO (${owner.name}): take it over to write this one there`,
              }
            : { ...base, ok: true, skipped: true }
        }
        const published = publishedPolicy(xapi.pool?.other_config ?? {})
        const next = this.#composeFor(pool.id, published.document, { global, analysis })
        const state = poolSyncState({ ...base, published: published.document, expected: next })
        if (state === 'out-of-scope') {
          return { ...base, ok: true, skipped: true }
        }
        // The pool's own policies in the tiers kept for global policies
        // (vdf#21) would decide before them. A pool entering the scope with
        // some is refused: the publish would claim a guardrail the pool
        // doesn't have. A pool already holding the global part is only
        // warned about, so that one pool can't hold back a change of the
        // global policies (it gets them anyway, and can't publish its own
        // until moved).
        const reservedTiers = base.inScope ? reservedTierPolicies(published.document) : []
        const entering = !(this.#isInScope(pool.id) && hasGlobalPart(published.document))
        if (reservedTiers.length > 0 && entering) {
          return {
            ...base,
            ok: false,
            reservedTiers,
            error: `own policies of this pool in the emergency or securityops tier would decide before the global policies: move ${reservedTiers.map(name => `"${name}"`).join(', ')} to networkops or a later tier in the pool's firewall first`,
          }
        }
        try {
          const text = serialize(next)
          const result = await this.#onMaster(xapi, 'check', { policy: text })
          if (reservedTiers.length > 0) {
            result.reservedTiers = reservedTiers
            result.warnings = [
              ...(result.warnings ?? []),
              `own policies of this pool in the emergency or securityops tier decide before the global policies: ${reservedTiers.map(name => `"${name}"`).join(', ')}. The pool can't publish until they're moved to networkops or a later tier.`,
            ]
          }
          // the pool's own part, for XO 6's review: a global default that
          // decides for a pool policy's (vdf#27)
          return base.inScope
            ? { ...base, ...result, own: localPart(published.document), text }
            : { ...base, ...result, text }
        } catch (error) {
          return { ...base, ok: false, error: error.message }
        }
      })
    )
    const all = [...pools, ...lost]
    const ok = all.every(pool => pool.ok || pool.unreachable || pool.otherXo)
    return {
      ok,
      pools: all.map(({ text, ...pool }) => pool),
      texts: Object.fromEntries(pools.map(pool => [pool.id, pool.text])),
    }
  }

  // a failed write is retried from retryAt on (sync: SYNC_RETRY_MS later)
  #recordSync(poolId, sync) {
    this.#syncs = { ...this.#syncs, [poolId]: { at: Date.now(), ...sync } }
    this.#store.put('syncs', this.#syncs).catch(error => log.warn('saving syncs', { error }))
  }

  // one publish at a time per scope: a compare-and-swap must see what the
  // previous publish wrote. Taking a pool's lock also looks for changes made
  // outside this XO since it last looked (vdf#32).
  #serialized(scopeId, fn) {
    const run = scopeId === GLOBAL_SCOPE ? fn : () => this.#watched(scopeId, fn)
    const previous = this.#publishing.get(scopeId) ?? Promise.resolve()
    const next = previous.then(run, run)
    const settled = next.catch(() => {})
    this.#publishing.set(scopeId, settled)
    settled.then(() => {
      if (this.#publishing.get(scopeId) === settled) {
        this.#publishing.delete(scopeId)
      }
    })
    return next
  }

  // CHANGES OUTSIDE THIS XO (vdf#32, vdf#20): another XO, xe, `vdf-agent
  // publish`, or a copy of this XO (a cloned XO VM, same identity) wrote the
  // pool's document or its owner. Looked for when the pool's lock is taken:
  // by each sync pass (at most every 5 s, at least every minute) and before
  // each of this XO's writes. What the pool holds then is compared with what
  // this XO last saw there (store key seen:<pool id>: the document's id, its
  // global part's id, the owner), and a difference this XO didn't write is
  // an outside change.
  //
  // XO's cache of the pool record follows XAPI's events, which arrive after
  // a write returns: what this XO writes is recorded as expected (`expect`:
  // the document ids and owners it wrote, the latest last), and an
  // observation equal to one of them is this XO's own write, whenever it
  // shows up.

  async #seenOf(poolId) {
    if (!this.#seen.has(poolId)) {
      // the records 9234eab3 wrote held the document: not needed any more
      const { document: _, ...seen } = (await this.#get(seenKey(poolId), null)) ?? {}
      this.#seen.set(poolId, seen.docId === undefined ? null : seen)
    }
    return this.#seen.get(poolId)
  }

  async #saveSeen(poolId, seen) {
    this.#seen.set(poolId, seen)
    await this.#store.put(seenKey(poolId), seen)
  }

  #poolState(xapi) {
    const otherConfig = xapi.pool?.other_config ?? {}
    const { docId: id, document } = publishedPolicy(otherConfig)
    const owner = poolOwner(otherConfig)
    return {
      docId: id,
      // the global part's id, to tell whether a change touched it
      globalId: document == null ? '' : sha256Hex(JSON.stringify(canonical(globalPart(document))), 6),
      owner: owner === undefined ? null : { id: owner.id, name: owner.name, since: owner.since },
      document: document ?? null,
    }
  }

  // Records what this XO is writing in a pool: a document (its id, as
  // publishedPolicy will compute it) or an owner (null: removed)
  async #expectOwn(xapi, { docIds = [], owner }) {
    const poolId = this.#xapiPools.get(xapi)
    if (poolId === undefined) {
      return
    }
    const seen = await this.#seenOf(poolId)
    if (seen === null) {
      return // not seen yet: what it holds next is its first sight
    }
    const expect = seen.expect ?? { docIds: [], owners: [] }
    await this.#saveSeen(poolId, {
      ...seen,
      expect: {
        docIds: [...expect.docIds.filter(id => !docIds.includes(id)), ...docIds].slice(-EXPECT_LENGTH),
        owners: owner === undefined ? expect.owners : [...expect.owners, ownerKey(owner)].slice(-EXPECT_LENGTH),
      },
    })
  }

  async #watched(poolId, fn) {
    await this.#noteOutside(poolId).catch(error => log.warn('changes outside this XO', { pool: poolId, error }))
    return fn()
  }

  // a sync pass on a pool it doesn't write
  #watch(poolId) {
    return this.#serialized(poolId, async () => {})
  }

  // A change no lock of this XO made: recorded in the pool's history (its
  // document, so it can be reviewed and restored) and reported by GET policy
  // and GET /global. The same change seen again (two writers alternating)
  // only counts again.
  async #noteOutside(poolId) {
    const xapi = this.#connectedXapi(poolId)
    if (xapi === undefined) {
      return
    }
    const state = this.#poolState(xapi)
    const seen = await this.#seenOf(poolId)
    const now = new Date().toISOString()
    const { document, ...observed } = state
    if (seen === null) {
      // first sight: nothing to compare with
      await this.#saveSeen(poolId, { ...observed, at: now })
      return
    }
    const docChanged = state.docId !== seen.docId
    const ownerChanged = ownerKey(state.owner) !== ownerKey(seen.owner)
    if (!docChanged && !ownerChanged) {
      return
    }

    // this XO's own writes: an expected one and the ones before it are
    // done. A write from outside supersedes this XO's pending ones: XAPI's
    // events come in order, so theirs arrived before it, unseen (a document
    // or owner they wrote coming back later is another outside change).
    // Only a write from outside that landed during this XO's own, before
    // it, gets this wrong: this XO's write then shows as an outside one.
    const expect = seen.expect ?? { docIds: [], owners: [] }
    const docIndex = docChanged ? expect.docIds.indexOf(state.docId) : -1
    const ownerIndex = ownerChanged ? expect.owners.indexOf(ownerKey(state.owner)) : -1
    const outsideDoc = docChanged && docIndex === -1
    const outsideOwner = ownerChanged && ownerIndex === -1
    const nextExpect = {
      docIds: outsideDoc ? [] : expect.docIds.slice(docIndex + 1),
      owners: outsideOwner ? [] : expect.owners.slice(ownerIndex + 1),
    }
    if (!outsideDoc && !outsideOwner) {
      await this.#saveSeen(poolId, { ...observed, at: now, expect: nextExpect, outside: seen.outside })
      return
    }

    const ours = this.#instance.id
    // unknown for a record from before the global part's id was kept
    const globalChanged = outsideDoc && seen.globalId !== undefined && state.globalId !== seen.globalId
    const entries = await this.#history(poolId)
    // the last change, past what the global sync wrote back after it
    const lastIndex = entries.findLastIndex(entry => entry.sync === undefined)
    const last = entries[lastIndex]
    let outside
    if (
      last?.outside !== undefined &&
      last.docId === state.docId &&
      isDeepStrictEqual(last.outside.owner, state.owner)
    ) {
      // seen again after this XO wrote the pool back: two writers alternate.
      // On a pool this XO owns, a document coming back with a global part
      // of its own was written by another XO with this XO's identity, or a
      // tool rewriting the pool. One without a global part (vdf-agent
      // publish of a local file, run again) is no such thing.
      outside = {
        ...last.outside,
        lastSeenAt: now,
        times: (last.outside.times ?? 1) + 1,
        sameIdentity:
          last.outside.sameIdentity ||
          (last.outside.globalChanged && state.owner?.id === ours && hasGlobalPart(document)),
      }
      entries[lastIndex] = { ...last, outside }
      await this.#store.put(historyKey(poolId), entries)
    } else {
      outside = {
        seenAt: now,
        lastSeenAt: now,
        times: 1,
        docChanged: outsideDoc,
        globalChanged,
        ownerChanged: outsideOwner,
        previousOwner: seen.owner,
        owner: state.owner,
        // the owner key rewritten with this XO's id, by another writer: only
        // an XO writes it, so one runs with this XO's identity, a copy of
        // its data (vdf#20)
        sameIdentity: outsideOwner && state.owner?.id === ours,
      }
      // the version it replaced, when this XO's history has it
      const previous = entries.findLast(entry => entry.docId === seen.docId)
      await this.#appendHistory(poolId, entries, {
        docId: state.docId,
        previousDocId: seen.docId || null,
        publishedAt: now,
        publishedBy: null,
        outside,
        summary: summarize(previous?.document == null ? null : localPart(previous.document), localPart(document)),
        document: document ?? emptyDocument(),
      })
    }
    log.warn('pool changed outside this XO', {
      pool: poolId,
      docId: state.docId,
      owner: state.owner,
      sameIdentity: outside.sameIdentity,
    })
    await this.#saveSeen(poolId, {
      ...observed,
      at: now,
      expect: nextExpect,
      outside: { ...outside, docId: state.docId },
    })
  }

  // the last change made outside this XO, and whether the pool still holds it
  async #outsideOf(poolId, docId_) {
    const outside = (await this.#seenOf(poolId))?.outside
    return outside === undefined ? undefined : { ...outside, current: outside.docId === docId_ }
  }

  // HISTORY

  // entries imported or written by an earlier version may lack an id
  async #history(scopeId) {
    const entries = await this.#get(historyKey(scopeId), [])
    return entries.map((entry, index) => (entry.id === undefined ? { id: index + 1, ...entry } : entry))
  }

  async #appendHistory(scopeId, entries, entry) {
    await this.#store.put(historyKey(scopeId), appendEntry(entries, { id: nextEntryId(entries), ...entry }))
  }

  #globalEntry(global, previous) {
    const versioned = ({ document, scope }) => ({ ...document, scope })
    return {
      revision: global.revision,
      publishedAt: global.publishedAt,
      publishedBy: global.publishedBy,
      summary: summarize(previous === undefined ? null : versioned(previous), versioned(global)),
      document: global.document,
      scope: global.scope,
    }
  }

  // Pool history: publishes made through XO's pool routes. The first one
  // also records what the pool held before (published by another XO, or
  // with `vdf-agent publish`), so it can be restored too. Summaries count
  // the pool's own part: the global part has its own history.
  async #recordPoolPublish(poolId, before, after, user) {
    const entries = await this.#history(poolId)
    const last = entries[entries.length - 1]
    if (last !== undefined && last.docId === after.docId) {
      return // published the same document again
    }
    let list = entries
    if (list.length === 0 && before.document != null && before.docId !== after.docId) {
      list = appendEntry(list, {
        id: 1,
        docId: before.docId,
        previousDocId: null,
        publishedAt: null,
        publishedBy: null,
        summary: summarize(null, localPart(before.document)),
        document: before.document,
      })
    }
    await this.#appendHistory(poolId, list, {
      docId: after.docId,
      previousDocId: before.docId || null,
      publishedAt: new Date().toISOString(),
      publishedBy: userLabel(user) ?? null,
      summary: summarize(before.document == null ? null : localPart(before.document), localPart(after.document)),
      document: after.document,
    })
  }

  // A pool document the global sync wrote (a global publish, new members):
  // in the pool's history too, so every version the pool held is there and
  // the next publish has the one it replaced. Successive syncs with nothing
  // in between are one entry (members change often: they would push the
  // publishes out), the version before the first one kept as its previous.
  async #recordSyncWrite(poolId, before, after) {
    let entries = await this.#history(poolId)
    if (entries.length === 0 && before.document != null) {
      entries = appendEntry(entries, {
        id: 1,
        docId: before.docId,
        previousDocId: null,
        publishedAt: null,
        publishedBy: null,
        summary: summarize(null, localPart(before.document)),
        document: before.document,
      })
    }
    const last = entries[entries.length - 1]
    const revision = this.#global?.revision
    const docId_ = after.docId ?? docId(serialize(after.document))
    if (last?.docId === docId_) {
      return
    }
    if (last?.sync !== undefined && last.docId === before.docId) {
      const previous = entries.findLast(entry => entry.docId === last.previousDocId && entry !== last)
      entries[entries.length - 1] = {
        ...last,
        docId: docId_,
        publishedAt: new Date().toISOString(),
        sync: { revision, times: (last.sync.times ?? 1) + 1 },
        summary: summarize(previous?.document == null ? null : localPart(previous.document), localPart(after.document)),
        document: after.document,
      }
      await this.#store.put(historyKey(poolId), entries)
      return
    }
    await this.#appendHistory(poolId, entries, {
      docId: docId_,
      previousDocId: before.docId || null,
      publishedAt: new Date().toISOString(),
      publishedBy: null,
      sync: { revision, times: 1 },
      summary: summarize(before.document == null ? null : localPart(before.document), localPart(after.document)),
      document: after.document,
    })
  }

  // a version, and the one it replaced (to show what it changed)
  async #historyEntry(scopeId, id, res) {
    const entries = await this.#history(scopeId)
    const index = entries.findIndex(entry => String(entry.id) === String(id))
    if (index === -1) {
      res.status(404)
      return { error: `no version ${id} in this history` }
    }
    const entry = entries[index]
    const previous =
      scopeId === GLOBAL_SCOPE
        ? entries[index - 1]
        : entries.findLast((other, otherIndex) => otherIndex < index && other.docId === entry.previousDocId)
    return { ...entry, previous: previous ?? null }
  }

  // POOL PUBLISH

  // refused, nothing written, if the pool's document isn't the one the edit
  // started from
  #publishPool(poolId, { policy, expectedDocId }, user) {
    return this.#serialized(poolId, async () => {
      const xapi = this.#getXapi(poolId)
      const before = publishedPolicy(xapi.pool.other_config ?? {})
      if (expectedDocId !== undefined && expectedDocId !== before.docId) {
        return {
          ok: false,
          published: false,
          conflict: true,
          docId: before.docId,
          error: `the pool's policy changed meanwhile (${before.docId || 'nothing'} is published, the edit started from ${expectedDocId || 'nothing'}): reload it`,
          warnings: [],
        }
      }
      const { text, error } = this.#poolDocument(poolId, policy)
      if (error !== undefined) {
        return { ok: false, published: false, error, warnings: [] }
      }
      const result = await this.#publishOnPool(xapi, text)
      if (result.published) {
        let document = null
        try {
          document = JSON.parse(text)
        } catch {}
        await this.#recordPoolPublish(poolId, before, { docId: result.document ?? docId(text), document }, user).catch(
          error => log.warn('recording the publish', { pool: poolId, error })
        )
      }
      return result
    })
  }

  #publishGlobal(body, user) {
    return this.#serialized(GLOBAL_SCOPE, () => this.#publishGlobalNow(body, user))
  }

  async #publishGlobalNow({ policy, scope, revision }, user) {
    const current = this.#global?.revision ?? 0
    if (revision !== current) {
      return {
        ok: false,
        published: false,
        conflict: true,
        revision: current,
        error:
          revision === undefined
            ? `revision is required to publish (${current} now)`
            : `the global configuration changed meanwhile (revision ${current}, edit started from ${revision}): reload it`,
        pools: [],
      }
    }
    const { texts, ...check } = await this.#checkGlobal(policy, scope)
    if (!check.ok) {
      return { ...check, published: false }
    }
    const previous = this.#global
    this.#global = {
      document: JSON.parse(policy),
      revision: current + 1,
      scope,
      publishedAt: new Date().toISOString(),
      publishedBy: userLabel(user),
    }
    await this.#store.put('global', this.#global)
    await this.#appendHistory(
      GLOBAL_SCOPE,
      await this.#history(GLOBAL_SCOPE),
      this.#globalEntry(this.#global, previous)
    )
    // The configuration is saved first: it's what the pools must enforce,
    // and the pools a write fails on catch up from it (no rollback, which
    // would be partial too). Each pool is recomposed at write time, from
    // what it holds then and the members as they are then.
    const analysis = this.#analysis()
    const pools = await Promise.all(
      check.pools.map(async pool => {
        if (pool.skipped || pool.unreachable || pool.otherXo) {
          return pool
        }
        const { revision: newRevision } = this.#global
        try {
          const result = await this.#syncPool(pool.id, analysis)
          const ok = result.ok === true
          this.#recordSync(pool.id, {
            ok,
            error: result.error,
            revision: newRevision,
            retryAt: ok ? undefined : Date.now() + PUBLISH_RETRY_MS,
          })
          return { ...pool, ...result, ok }
        } catch (error) {
          this.#recordSync(pool.id, {
            ok: false,
            error: error.message,
            revision: newRevision,
            retryAt: Date.now() + PUBLISH_RETRY_MS,
          })
          return { ...pool, ok: false, error: error.message }
        }
      })
    )
    const ok = pools.every(pool => pool.ok || pool.unreachable || pool.otherXo)
    if (!ok) {
      this.#scheduleSync()
    }
    return {
      ok,
      published: true,
      // saved, but not written into every pool it should be: the failed ones
      // are retried within seconds
      partial: !ok,
      revision: this.#global.revision,
      pools,
    }
  }

  // at most one sync every 5 s: XAPI events can come faster than that for
  // ever, so a debounce could postpone it indefinitely
  #scheduleSync = () => {
    if (this.#syncTimer !== undefined) {
      return
    }
    this.#syncTimer = setTimeout(() => {
      this.#syncTimer = undefined
      this.#sync().catch(error => log.warn('sync', { error }))
    }, 5e3)
  }

  // Brings the pools in line with the global configuration: new members
  // of global groups (a VM tagged, started, migrated to another pool), a
  // pool that was unreachable at publish, a pool that left the scope.
  async #sync() {
    if (this.#syncing) {
      this.#syncAgain = true
      return
    }
    this.#syncing = true
    try {
      if (this.#global === undefined) {
        // nothing to write: only what changed outside this XO (vdf#32)
        for (const pool of this.#pools()) {
          await this.#watch(pool.id)
        }
        return
      }
      await this.#refreshVmCache()
      const analysis = this.#analysis()
      for (const pool of this.#pools()) {
        const last = this.#syncs[pool.id]
        if (last?.ok === false && Date.now() < (last.retryAt ?? last.at + SYNC_RETRY_MS)) {
          await this.#watch(pool.id)
          continue
        }
        try {
          const result = await this.#syncPool(pool.id, analysis)
          if (result.unchanged || result.unreachable || result.otherXo) {
            continue
          }
          this.#recordSync(pool.id, {
            ok: result.ok,
            error: result.error,
            state: result.state,
            revision: this.#global.revision,
            retryAt: result.ok ? undefined : Date.now() + SYNC_RETRY_MS,
          })
          log.info('pool synced with the global configuration', { pool: pool.id, state: result.state, ok: result.ok })
        } catch (error) {
          this.#recordSync(pool.id, { ok: false, error: error.message, retryAt: Date.now() + SYNC_RETRY_MS })
          log.warn('sync', { pool: pool.id, error })
        }
      }
    } finally {
      this.#syncing = false
      if (this.#syncAgain) {
        this.#syncAgain = false
        this.#scheduleSync()
      }
    }
  }

  #getXapi(poolId) {
    // throws no such object for an unknown pool
    this.#xo.getObject(poolId, 'pool')
    return this.#withPool(this.#xo.getXapi(poolId), poolId)
  }

  async #callPlugin(xapi, hostRef, fn, args = {}) {
    let out
    try {
      out = await xapi.call('host.call_plugin', hostRef, PLUGIN, fn, args)
    } catch (error) {
      if (/UNKNOWN_XENAPI_PLUGIN|XENAPI_MISSING_PLUGIN/.test(error.code ?? error.message)) {
        const host = xapi.getObjectByRef(hostRef, undefined)?.name_label ?? hostRef
        throw new Error(`the vdf agent on ${host} doesn't provide ${fn} (agent missing or older than this XO)`)
      }
      throw error
    }
    return JSON.parse(out)
  }

  #onMaster(xapi, fn, args) {
    return this.#callPlugin(xapi, xapi.pool.master, fn, args)
  }

  // hosts that can answer a plugin call: the others are reported, not fatal
  async #onEachHost(xapi, fn, args) {
    const hosts = Object.values(xapi.objects.all).filter(object => object.$type === 'host')
    return Promise.all(
      hosts.map(async host => {
        const base = { host: host.uuid, hostName: host.name_label }
        if (!host.enabled || host.$metrics?.live === false) {
          return { ...base, error: 'host is not live' }
        }
        try {
          return { ...base, ...(await this.#callPlugin(xapi, host.$ref, fn, args)) }
        } catch (error) {
          log.warn(fn, { host: host.uuid, error })
          return { ...base, error: error.message }
        }
      })
    )
  }

  // Who may do what: XO administrators everything; other users, on a pool
  // they have an ACL on, see its firewall (view) and change its own part
  // (administrate). The global configuration is for XO administrators
  // only: it applies to pools a user may not even see.
  async #canOnPool(restApi, poolId, permission) {
    const user = restApi.getCurrentUser({ throwUnauthenticated: false })
    return isAdmin(user) || (user !== undefined && (await this.#xo.hasPermissions(user.id, [[poolId, permission]])))
  }

  // a pool route open to users with `permission` on the pool
  #poolRoute({ permission = 'view', callback, ...route }) {
    return {
      ...route,
      scope: 'acl',
      callback: async context => {
        const { req, res, restApi } = context
        // throws no such object for an unknown pool
        this.#xo.getObject(req.params.id, 'pool')
        if (!(await this.#canOnPool(restApi, req.params.id, permission))) {
          return forbidden(res, `this needs the ${permission} permission on the pool`)
        }
        return callback(context)
      },
    }
  }

  // VDF LOCK (vdf#41): where XAPI refuses to lock a VIF (OPERATION_NOT_ALLOWED
  // while an SDN controller is registered), VDF enforces its allowed
  // addresses itself. They stay XAPI's (ipv4_allowed, ipv6_allowed, which
  // XAPI still lets set), and VIF.other_config['vdf:locking'] = 'locked'
  // turns VDF's enforcement on; locking_mode is left alone. XO's VIF edit
  // locks as soon as it sets the lists, so this is a path of its own. These
  // are the plugin's only VIF writes.

  // a VIF route: as XO's vif.set with a locking mode, operate on the VIF and
  // on its network (XO administrators: everything)
  #vifRoute({ callback, ...route }) {
    return {
      ...route,
      scope: 'acl',
      callback: async context => {
        const { req, res, restApi } = context
        // throws no such object for an unknown VIF
        const vif = this.#xo.getObject(req.params.id, 'VIF')
        const user = restApi.getCurrentUser({ throwUnauthenticated: false })
        const allowed =
          isAdmin(user) ||
          (user !== undefined &&
            (await this.#xo.hasPermissions(user.id, [
              [vif.id, 'operate'],
              [vif.$network, 'operate'],
            ])))
        if (!allowed) {
          return forbidden(res, 'this needs the operate permission on the interface and its network')
        }
        return callback({ ...context, vif })
      },
    }
  }

  // Why VDF can't lock a VM's interfaces, or undefined: the agent of the
  // host it runs on must support VDF locks and be running; a halted VM may
  // start on any host, so every host with a running agent must, one at least.
  #vdfLockUnavailable(vm, now = Date.now()) {
    const running = vm?.power_state === 'Running'
    const hosts = running
      ? [this.#hostOf(vm.$container)].filter(host => host !== undefined)
      : Object.values(this.#xo.getObjects({ filter: { type: 'host' } })).filter(host => host.$pool === vm?.$pool)
    const statuses = hosts.map(host => ({ host, status: hostStatus(host.otherConfig) }))
    const current = statuses.filter(
      ({ host, status }) =>
        host.power_state === 'Running' &&
        typeof status?.heartbeatSec === 'number' &&
        status.heartbeatSec > 0 &&
        isFresh(status, now)
    )
    const name = ({ host }) => host.name_label ?? host.id
    if (current.length === 0 || (running && current.length < statuses.length)) {
      const stopped =
        running && isStopping(statuses[0]?.status) ? ` (it stopped at ${statuses[0].status.stopping})` : ''
      return running
        ? `the vdf agent of ${hosts[0]?.name_label ?? 'its host'} isn't running${stopped}: it can't enforce a VDF lock`
        : 'no host of the pool has a running vdf agent to enforce a VDF lock'
    }
    const older = current.filter(({ status }) => !supportsVdfLock(status))
    if (older.length > 0) {
      return `the vdf agent of ${older.map(name).join(', ')} doesn't support VDF locks (older than this XO)`
    }
  }

  // the VIF as XAPI has it now: XO's object follows XAPI's events, after
  // writes return, so another lock or unlock may have landed meanwhile
  async #vifRecord(xapi, vif) {
    return xapi.call('VIF.get_record', vif._xapiRef)
  }

  // what the route answers: the VIF as XAPI has it after the writes, and
  // for a VDF lock whether the agent of the VM's host enforces these
  // addresses yet (just locked: not until its next round lists them)
  async #vifLocking(xapi, vif) {
    const record = await this.#vifRecord(xapi, vif)
    const locking =
      record.locking_mode === 'locked'
        ? 'xapi'
        : record.other_config?.[VDF_LOCKING_KEY] === 'locked'
          ? 'vdf'
          : 'unlocked'
    let vm
    try {
      vm = this.#xo.getObject(vif.$VM, 'VM')
    } catch {}
    return {
      vif: vif.id,
      locking,
      ipv4: record.ipv4_allowed,
      ipv6: record.ipv6_allowed,
      ...(locking === 'vdf'
        ? {
            enforced:
              vm?.power_state === 'Running' && isVdfLocked({ ...record, uuid: vif.id }, this.#enforcementOf()(vm)),
          }
        : {}),
    }
  }

  async #vdfLock(vif, body, res) {
    const refuse = (status, error) => {
      res.status(status)
      return { error }
    }
    // everything checked before the first write
    const addresses = lockAddresses(body)
    if (addresses.error !== undefined) {
      return refuse(422, addresses.error)
    }
    const { ipv4, ipv6 } = addresses
    let vm
    try {
      vm = this.#xo.getObject(vif.$VM, 'VM')
    } catch {}
    const unavailable = this.#vdfLockUnavailable(vm)
    if (unavailable !== undefined) {
      return refuse(409, unavailable)
    }
    const xapi = this.#getXapi(vif.$pool)
    const record = await this.#vifRecord(xapi, vif)
    const network = this.#networkOf(vif)
    if (
      record.locking_mode === 'disabled' ||
      (record.locking_mode === 'network_default' && network?.defaultIsLocked === true)
    ) {
      return refuse(409, 'this interface is disabled: it sends nothing')
    }
    if (record.locking_mode === 'locked') {
      return refuse(409, 'this interface is locked by XAPI already: relock it with XAPI')
    }

    const previous = { ipv4: record.ipv4_allowed ?? [], ipv6: record.ipv6_allowed ?? [] }
    const ref = vif._xapiRef
    // what was written, undone if a later step fails: the VIF is left as it
    // was, its lists never half changed
    const undo = []
    const rollBack = async () => {
      for (const step of undo.reverse()) {
        await step().catch(error => log.warn('rolling back a VDF lock', { vif: vif.id, error }))
      }
    }
    try {
      // the addresses first: with the key first, the agent would enforce
      // the previous ones meanwhile. A list XAPI already has isn't set
      // again: each setter re-runs setup-vif-rules, which deletes and
      // re-adds the VIF's port (a cut), and a call that changes nothing
      // brings no event the agent's guard could explain the re-add by
      if (!sameAddresses(previous.ipv4, ipv4)) {
        await xapi.call('VIF.set_ipv4_allowed', ref, ipv4)
        undo.push(() => xapi.call('VIF.set_ipv4_allowed', ref, previous.ipv4))
      }
      if (!sameAddresses(previous.ipv6, ipv6)) {
        await xapi.call('VIF.set_ipv6_allowed', ref, ipv6)
        undo.push(() => xapi.call('VIF.set_ipv6_allowed', ref, previous.ipv6))
      }
      // set before (a relock, or another lock meanwhile): kept on a failure
      if (await this.#addLockKey(xapi, ref)) {
        undo.push(() => xapi.call('VIF.remove_from_other_config', ref, VDF_LOCKING_KEY))
      }
      // XO's IP pools follow the allowed addresses, as with XO's VIF edit,
      // once XAPI took them (a resource set's quota may refuse: undone)
      const before = [...previous.ipv4, ...previous.ipv6]
      const after = [...ipv4, ...ipv6]
      await this.#xo.allocIpAddresses?.(
        vif.id,
        after.filter(ip => !before.includes(ip)),
        before.filter(ip => !after.includes(ip))
      )
    } catch (error) {
      await rollBack()
      throw error
    }
    return this.#vifLocking(xapi, vif)
  }

  // the vdf:locking key set to locked, whatever another writer did
  // meanwhile: true when this call added it
  async #addLockKey(xapi, ref) {
    try {
      await xapi.call('VIF.add_to_other_config', ref, VDF_LOCKING_KEY, 'locked')
      return true
    } catch (error) {
      if (!/MAP_DUPLICATE_KEY/.test(error.code ?? error.message)) {
        throw error
      }
    }
    // already there: with another value, replaced
    const record = await this.#vifRecord(xapi, { _xapiRef: ref })
    if (record.other_config?.[VDF_LOCKING_KEY] === 'locked') {
      return false
    }
    await xapi.call('VIF.remove_from_other_config', ref, VDF_LOCKING_KEY)
    await xapi.call('VIF.add_to_other_config', ref, VDF_LOCKING_KEY, 'locked')
    return true
  }

  // The key removed first (removing a missing key is no error, so whatever
  // XO's object says), then the allowed addresses with `clear`: the agent
  // never enforces an empty list. A VIF XAPI locks keeps its addresses: it
  // would be cut off.
  async #vdfUnlock(vif, { clear = false }, res) {
    const xapi = this.#getXapi(vif.$pool)
    const ref = vif._xapiRef
    const record = await this.#vifRecord(xapi, vif)
    if (clear && record.locking_mode === 'locked') {
      res.status(409)
      return { error: 'this interface is locked by XAPI: its allowed addresses are what it may send from' }
    }
    await xapi.call('VIF.remove_from_other_config', ref, VDF_LOCKING_KEY)
    if (clear) {
      // only a list that isn't empty already (setup-vif-rules, as above)
      if ((record.ipv4_allowed ?? []).length > 0) {
        await xapi.call('VIF.set_ipv4_allowed', ref, [])
      }
      if ((record.ipv6_allowed ?? []).length > 0) {
        await xapi.call('VIF.set_ipv6_allowed', ref, [])
      }
      const before = [...(record.ipv4_allowed ?? []), ...(record.ipv6_allowed ?? [])]
      // XAPI holds no address any more: XO's IP pools can't be wrong for long
      if (before.length > 0) {
        await this.#xo
          .allocIpAddresses?.(vif.id, [], before)
          ?.catch(error => log.warn('releasing the addresses of a VDF unlock', { vif: vif.id, error }))
      }
    }
    return this.#vifLocking(xapi, vif)
  }

  #routes() {
    return [
      {
        endpoint: '/info',
        method: 'get',
        description:
          'Answers while the plugin is loaded: XO 6 shows the firewall interface only then (tech preview, opt-in).',
        tags: ['vdf'],
        responses: [{ status: 200, description: 'The plugin is loaded' }],
        scope: 'acl',
        callback: () => ({ techPreview: true }),
      },
      {
        endpoint: '/global',
        method: 'get',
        description:
          "The XO-wide configuration (groups and policies written into every pool in scope), each pool's sync state and the members of the global groups across pools.",
        tags: ['vdf'],
        responses: [{ status: 200, description: 'Global configuration and status' }],
        // other users see the configuration, and the pools they may view
        scope: 'acl',
        callback: ({ restApi }) => this.#globalStatus(restApi.getCurrentUser({ throwUnauthenticated: false })),
      },
      {
        endpoint: '/global/actions/check',
        method: 'post',
        description:
          "Validate a global configuration: every pool in scope checks its resulting document with its master's vdf-agent. Nothing is written.",
        tags: ['vdf'],
        body: BODY_GLOBAL,
        middlewares: [{ name: 'json', options: { limit: '8mb' } }],
        responses: [{ status: 200, description: 'Per-pool validation results' }],
        callback: async ({ req }) => {
          const { texts, ...result } = await this.#checkGlobal(req.body.policy, req.body.scope)
          return result
        },
      },
      {
        endpoint: '/global/actions/publish',
        method: 'post',
        description:
          'Validate a global configuration on every pool in scope and, if all reachable pools accept it, publish it to each of them. Pools XO cannot reach catch up when it reaches them again.',
        tags: ['vdf'],
        body: BODY_GLOBAL,
        middlewares: [{ name: 'json', options: { limit: '8mb' } }],
        responses: [{ status: 200, description: 'Per-pool publish results' }],
        callback: ({ req, restApi, createAction }) => {
          const user = restApi.getCurrentUser({ throwUnauthenticated: false })
          return createAction(() => this.#publishGlobal(req.body, user), {
            sync: true,
            taskProperties: { name: 'publish global firewall configuration' },
          })
        },
      },
      {
        endpoint: '/global/history',
        method: 'get',
        description:
          'The last published global configurations, oldest first, without their content: id, revision, publishedAt, publishedBy, summary.',
        tags: ['vdf'],
        responses: [{ status: 200, description: 'Publish history' }],
        callback: async () => ({
          entries: listEntries(await this.#history(GLOBAL_SCOPE), ({ document, scope }) => ({ ...document, scope })),
        }),
      },
      {
        endpoint: '/global/history/{entry}',
        method: 'get',
        description: 'One published global configuration (document and scope), and the one before it (`previous`).',
        tags: ['vdf'],
        params: PARAMS_GLOBAL_ENTRY,
        responses: [
          { status: 200, description: 'Published version' },
          { status: 404, description: 'No such version' },
        ],
        callback: ({ req, res }) => this.#historyEntry(GLOBAL_SCOPE, req.params.entry, res),
      },
      {
        endpoint: '/pools/{id}/actions/take_over_global',
        method: 'post',
        description:
          "Make this XO the one whose global configuration the pool holds, in place of another XO's (which then leaves the pool alone). Refused (conflict: true) if the pool's owner isn't expectedOwner any more. The pool syncs within seconds.",
        tags: ['vdf'],
        params: PARAMS_ID,
        body: {
          expectedOwner: {
            type: 'string',
            description: "id of the owner the user saw ('' for none), as GET /global reports it (ownerId)",
          },
        },
        middlewares: [{ name: 'json' }],
        responses: [
          { status: 200, description: 'The previous owner, if any' },
          { status: 409, description: 'The owner changed since the user looked' },
        ],
        callback: async ({ req, res }) => {
          const result = await this.#takeOver(req.params.id, req.body.expectedOwner)
          if (result.conflict) {
            res.status(409)
          }
          return result
        },
      },
      {
        endpoint: '/global/actions/take_over_replaced',
        method: 'post',
        description:
          "Take over every pool holding the global configuration of the XO this one replaces (its configuration was imported here, GET /global: replaces), one take_over_global per pool with that XO as the expected owner. Refused (409) if this XO doesn't replace `replaces` any more.",
        tags: ['vdf'],
        body: {
          replaces: { type: 'string', description: 'id of the replaced XO the user saw (GET /global: replaces.id)' },
        },
        middlewares: [{ name: 'json' }],
        responses: [
          { status: 200, description: 'Per-pool results' },
          { status: 409, description: 'This XO replaces another XO, or none, now' },
        ],
        callback: async ({ req, res }) => {
          const replaced = this.#replaces
          if (replaced === undefined || replaced.id !== req.body.replaces) {
            res.status(409)
            return {
              conflict: true,
              replaces: replaced ?? null,
              error: `this XO replaces ${replaced?.name ?? 'no other XO'} now: look again before taking its pools over`,
            }
          }
          const owned = this.#pools().filter(pool => {
            const xapi = this.#connectedXapi(pool.id)
            return xapi !== undefined && poolOwner(xapi.pool?.other_config)?.id === replaced.id
          })
          const pools = await Promise.all(
            owned.map(async pool => {
              const base = { id: pool.id, name: pool.name_label }
              try {
                const result = await this.#takeOver(pool.id, replaced.id)
                return { ...base, ...result, ok: result.conflict !== true }
              } catch (error) {
                return { ...base, ok: false, error: error.message }
              }
            })
          )
          return { pools }
        },
      },
      this.#poolRoute({
        endpoint: '/pools/{id}/policy',
        method: 'get',
        description: 'The policy document the pool enforces (the newest pool key whose base still matches) and its id.',
        tags: ['vdf'],
        params: PARAMS_ID,
        responses: [{ status: 200, description: 'Published policy' }],
        callback: async ({ req, restApi }) => {
          const xapi = this.#getXapi(req.params.id)
          const policy = publishedPolicy(xapi.pool.other_config)
          const global = this.#global
          const owner = this.#otherOwner(xapi)
          return {
            ...policy,
            // the last change made outside this XO (vdf#32)
            outside: (await this.#outsideOf(req.params.id, policy.docId)) ?? null,
            canEdit: await this.#canOnPool(restApi, req.params.id, 'administrate'),
            global: {
              revision: global?.revision ?? 0,
              inScope: global !== undefined && inScope(global.scope, req.params.id),
              // the global part is another XO's
              owner: owner?.name,
            },
          }
        },
      }),
      this.#poolRoute({
        endpoint: '/pools/{id}/actions/check_policy',
        permission: 'administrate',
        method: 'post',
        description: "Validate a policy document with the pool master's vdf-agent, without publishing it.",
        tags: ['vdf'],
        params: PARAMS_ID,
        body: BODY_POLICY,
        middlewares: [{ name: 'json', options: { limit: '8mb' } }],
        responses: [{ status: 200, description: 'Validation result (ok, error, warnings, version, keys, document)' }],
        callback: ({ req }) => {
          const xapi = this.#getXapi(req.params.id)
          const { text, error } = this.#poolDocument(req.params.id, req.body.policy)
          return error === undefined
            ? this.#onMaster(xapi, 'check', { policy: text })
            : { ok: false, error, warnings: [] }
        },
      }),
      this.#poolRoute({
        endpoint: '/pools/{id}/actions/publish_policy',
        permission: 'administrate',
        method: 'post',
        description:
          "Validate and publish a policy document to the pool's keys, through the pool master's vdf-agent. Agents apply it within tens of milliseconds. With expectedDocId, refused (nothing written) if the pool's document changed since.",
        tags: ['vdf'],
        params: PARAMS_ID,
        body: BODY_PUBLISH,
        middlewares: [{ name: 'json', options: { limit: '8mb' } }],
        responses: [
          {
            status: 200,
            description:
              'Publish result (published, ok, error, warnings, keys, document); conflict: true if the pool changed since expectedDocId',
          },
        ],
        callback: ({ req, restApi, createAction }) => {
          const user = restApi.getCurrentUser({ throwUnauthenticated: false })
          return createAction(() => this.#publishPool(req.params.id, req.body, user), {
            sync: true,
            taskProperties: { name: 'publish firewall policy', objectId: req.params.id, objectType: 'pool' },
          })
        },
      }),
      this.#poolRoute({
        endpoint: '/pools/{id}/history',
        method: 'get',
        description:
          'The last documents published to the pool through XO, oldest first, without their content: id, docId, previousDocId, publishedAt, publishedBy, summary.',
        tags: ['vdf'],
        params: PARAMS_ID,
        responses: [{ status: 200, description: 'Publish history' }],
        callback: async ({ req }) => ({
          entries: listEntries(await this.#history(req.params.id), entry => localPart(entry.document)),
        }),
      }),
      this.#poolRoute({
        endpoint: '/pools/{id}/history/{entry}',
        method: 'get',
        description: 'One published version of the pool document, and the version it replaced (`previous`, if kept).',
        tags: ['vdf'],
        params: PARAMS_ENTRY,
        responses: [
          { status: 200, description: 'Published version' },
          { status: 404, description: 'No such version' },
        ],
        callback: ({ req, res }) => this.#historyEntry(req.params.id, req.params.entry, res),
      }),
      this.#poolRoute({
        endpoint: '/pools/{id}/actions/trace',
        method: 'post',
        description:
          'Why is this blocked? Trace a packet between two VMs (uuid or IP; an IP of no VM is an external host) through the flows installed on the hosts involved, answered in policy terms.',
        tags: ['vdf'],
        params: PARAMS_ID,
        body: BODY_TRACE,
        middlewares: [{ name: 'json' }],
        responses: [{ status: 200, description: 'Trace result: verdict, deciding stage, hops' }],
        callback: ({ req }) => {
          const xapi = this.#getXapi(req.params.id)
          return trace(xapi, req.body, (hostRef, args) => this.#callPlugin(xapi, hostRef, 'trace', args))
        },
      }),
      this.#poolRoute({
        endpoint: '/pools/{id}/stats',
        method: 'get',
        description:
          'Live view per host: rule hit rates, open connections with the rule that let them in, blocked attempts.',
        tags: ['vdf'],
        params: PARAMS_ID,
        responses: [{ status: 200, description: 'Per-host stats' }],
        callback: async ({ req }) => ({ hosts: await this.#onEachHost(this.#getXapi(req.params.id), 'stats') }),
      }),
      this.#poolRoute({
        endpoint: '/pools/{id}/rule-log',
        method: 'get',
        description:
          'Entries of the per-rule audit log of every host of the pool (rules with `log: true`), oldest first.',
        tags: ['vdf'],
        params: PARAMS_ID,
        query: QUERY_LOG,
        responses: [{ status: 200, description: 'Merged rule log' }],
        callback: async ({ req }) => {
          const args = { lines: String(req.query.lines ?? 200) }
          if (req.query.since !== undefined) {
            args.since = req.query.since
          }
          const hosts = await this.#onEachHost(this.#getXapi(req.params.id), 'rule_log', args)
          const entries = hosts
            .flatMap(({ host, hostName, entries = [] }) => entries.map(entry => ({ ...entry, host, hostName })))
            .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0))
          return { entries, errors: hosts.filter(host => host.error !== undefined) }
        },
      }),
      this.#poolRoute({
        endpoint: '/pools/{id}/monitor',
        method: 'get',
        description:
          "What the pool's policies in monitor mode would drop if enforced, from every host: per source, VM, protocol, port, policy and rule, with sampled counts and first and last seen, most recently seen first (vdf#13).",
        tags: ['vdf'],
        params: PARAMS_ID,
        query: QUERY_MONITOR,
        responses: [{ status: 200, description: 'Merged monitor report' }],
        callback: async ({ req }) => {
          const args = { lines: String(req.query.lines ?? 500) }
          for (const name of ['policy', 'since']) {
            if (req.query[name] !== undefined) {
              args[name] = String(req.query[name])
            }
          }
          const hosts = await this.#onEachHost(this.#getXapi(req.params.id), 'monitor', args)
          return {
            entries: mergeMonitor(hosts),
            // vdf#86: shadowed tiers past the agents' cap, not checked
            unchecked: mergeUnchecked(hosts),
            keepDays: hosts.find(host => host.keepDays !== undefined)?.keepDays,
            errors: hosts.filter(host => host.error !== undefined),
          }
        },
      }),
      this.#vifRoute({
        endpoint: '/vifs/{id}/actions/vdf_lock',
        method: 'post',
        description:
          "Lock a VIF with VDF (vdf#41), where XAPI refuses to lock it while an SDN controller is registered: sets its allowed addresses, then VIF.other_config['vdf:locking'] = 'locked', locking_mode unchanged. The agent of the VM's host then drops anything else it sends. Refused (409) where an agent can't enforce it (stopped, or older than VDF locks), on a VIF XAPI locks or disables.",
        tags: ['vdf'],
        params: PARAMS_ID,
        body: BODY_VDF_LOCK,
        middlewares: [{ name: 'json' }],
        responses: [
          { status: 200, description: 'Locked: the addresses it may send from' },
          { status: 409, description: 'VDF cannot lock this interface (error)' },
          { status: 422, description: 'No address given' },
        ],
        callback: ({ req, res, vif }) => this.#vdfLock(vif, req.body, res),
      }),
      this.#vifRoute({
        endpoint: '/vifs/{id}/actions/vdf_unlock',
        method: 'post',
        description:
          "Remove a VIF's VDF lock (vdf#41): the vdf:locking key goes, its allowed addresses stay unless `clear` is set.",
        tags: ['vdf'],
        params: PARAMS_ID,
        body: BODY_VDF_UNLOCK,
        middlewares: [{ name: 'json' }],
        responses: [
          { status: 200, description: 'Unlocked, or still locked by XAPI' },
          { status: 409, description: 'clear refused on a VIF XAPI locks' },
        ],
        callback: ({ req, res, vif }) => this.#vdfUnlock(vif, req.body ?? {}, res),
      }),
    ]
  }
}

// xo-server reads the schema on the default export (registerPlugin), as
// Babel-compiled plugins have it: a named export alone is ignored
const createPlugin = opts => new VdfPlugin(opts)
createPlugin.configurationSchema = configurationSchema
export default createPlugin
