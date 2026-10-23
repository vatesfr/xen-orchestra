import { createHash } from 'node:crypto'
import { createLogger } from '@xen-orchestra/log'

import {
  checkGlobalDocument,
  checkLocalDocument,
  compose,
  emptyDocument,
  globalMembers,
  inScope,
  localPart,
  poolSyncState,
  remoteIpsFor,
  serialize,
} from './global.mjs'
import { appendEntry, listEntry, nextEntryId, summarize } from './history.mjs'
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

const PLUGIN = 'vdf'

const sha256Hex = (text, bytes) =>
  createHash('sha256')
    .update(text)
    .digest('hex')
    .slice(0, bytes * 2)

const v2Base = v1 => sha256Hex(v1, 8)
const v3Base = (v1, v2) => v2Base(v1 + '\x00' + v2)

// short id of a document, as agents report it in host other_config vdf:status
export const docId = text => (text ? sha256Hex(text, 6) : '')

export function publishedPolicy(otherConfig) {
  const v1 = otherConfig[KEY_V1] ?? ''
  const v2 = otherConfig[KEY_V2] ?? ''
  const v3 = otherConfig[KEY_V3] ?? ''

  let key
  let text
  if (v3 !== '' && otherConfig[KEY_V3_BASE] === v3Base(v1, v2)) {
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

const BODY_TRACE = {
  from: { type: 'string', example: '6c51b800-7de2-3b18-23b3-26d89b749a46' },
  to: { type: 'string', example: '192.168.1.76' },
  proto: { type: 'enum', enum: ['tcp', 'udp', 'icmp', 'any'] },
  port: { type: 'number', optional: true, example: 5432 },
  state: { type: 'enum', enum: ['new', 'established', 'revoked'], optional: true },
  family: { type: 'number', optional: true },
  broadcast: { type: 'boolean', optional: true },
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
    description: 'revision the edit started from (refused if another publish came first)',
  },
}

// pools whose sync failed are retried at most this often
const SYNC_RETRY_MS = 60e3

const QUERY_LOG = {
  lines: { type: 'number', optional: true, example: 200 },
  since: { type: 'string', optional: true, example: '2026-10-22T08:00:00.000Z' },
}

const userLabel = user => user?.email ?? user?.name ?? user?.id

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

function registerConfigManager(xo) {
  if (configManagerRegistered || typeof xo.addConfigManager !== 'function') {
    return
  }
  configManagerRegistered = true
  xo.addConfigManager(
    'vdf',
    async () => readStore(await xo.getStore('vdf')),
    async data => {
      await writeStore(await xo.getStore('vdf'), data)
      await loadedPlugin?.reloadStore()
    }
  )
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
  #syncTimer
  #syncInterval
  #syncing
  #syncAgain

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
    // the history starts with the configuration published before it was kept
    if (this.#global !== undefined && !(await this.#store.has(historyKey(GLOBAL_SCOPE)))) {
      await this.#appendHistory(GLOBAL_SCOPE, [], this.#globalEntry(this.#global, undefined))
    }
  }

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

  // GLOBAL CONFIGURATION

  #pools() {
    return Object.values(this.#xo.getObjects({ filter: { type: 'pool' } }))
  }

  #connectedXapi(poolId) {
    try {
      return this.#xo.getXapi(poolId)
    } catch {
      return undefined
    }
  }

  #members(global = this.#global?.document, scope = this.#global?.scope) {
    if (global === undefined) {
      return {}
    }
    const vms = Object.values(this.#xo.getObjects({ filter: { type: 'VM' } }))
    const vifsOf = vm =>
      (vm.VIFs ?? []).flatMap(id => {
        try {
          return [this.#xo.getObject(id, 'VIF')]
        } catch {
          return []
        }
      })
    return globalMembers({ global, vms, vifsOf, scope })
  }

  // the document a pool must hold: its own part, plus the global
  // configuration when it's in scope
  #composeFor(poolId, local, { global = this.#global, members = this.#members() } = {}) {
    const isInScope = global !== undefined && inScope(global.scope, poolId)
    return compose(local, isInScope ? global.document : null, isInScope ? remoteIpsFor(poolId, members) : {})
  }

  // pool routes: what the user sent, with XO's global part in place of
  // whatever global part it holds
  #poolDocument(poolId, text) {
    let document
    try {
      document = JSON.parse(text)
    } catch {
      return { text } // the agent reports the parse error
    }
    const errors = checkLocalDocument(document)
    if (errors.length > 0) {
      return { error: errors[0] }
    }
    return { text: serialize(this.#composeFor(poolId, document)) }
  }

  #globalStatus() {
    const global = this.#global
    const members = this.#members()
    const poolName = Object.fromEntries(this.#pools().map(pool => [pool.id, pool.name_label]))
    const pools = this.#pools().map(pool => {
      const xapi = this.#connectedXapi(pool.id)
      const base = {
        id: pool.id,
        name: pool.name_label,
        inScope: global !== undefined && inScope(global.scope, pool.id),
      }
      if (xapi === undefined) {
        return { ...base, state: 'unreachable', sync: this.#syncs[pool.id] }
      }
      const published = publishedPolicy(xapi.pool?.other_config ?? {})
      const expected = this.#composeFor(pool.id, published.document, { members })
      return {
        ...base,
        docId: published.docId,
        state:
          global === undefined ? 'out-of-scope' : poolSyncState({ ...base, published: published.document, expected }),
        sync: this.#syncs[pool.id],
      }
    })
    return {
      document: global?.document ?? emptyDocument(),
      revision: global?.revision ?? 0,
      scope: global?.scope ?? { all: true },
      publishedAt: global?.publishedAt,
      publishedBy: global?.publishedBy,
      pools,
      members: Object.fromEntries(
        Object.entries(members).map(([name, list]) => [
          name,
          list.map(member => ({ ...member, poolName: poolName[member.pool] })),
        ])
      ),
    }
  }

  // Every pool in scope (and every pool still holding a global part)
  // checks its new document with its master's agent: nothing is published
  // unless every reachable one accepts it. Unreachable pools are reported
  // and catch up once XO reaches them again.
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
    const global = { document, scope }
    const members = this.#members(document, scope)
    const pools = await Promise.all(
      this.#pools().map(async pool => {
        const base = { id: pool.id, name: pool.name_label, inScope: inScope(scope, pool.id) }
        const xapi = this.#connectedXapi(pool.id)
        if (xapi === undefined) {
          return { ...base, ok: false, unreachable: true, error: 'XO is not connected to this pool' }
        }
        const published = publishedPolicy(xapi.pool?.other_config ?? {})
        const next = this.#composeFor(pool.id, published.document, { global, members })
        const state = poolSyncState({ ...base, published: published.document, expected: next })
        if (state === 'out-of-scope') {
          return { ...base, ok: true, skipped: true }
        }
        try {
          const text = serialize(next)
          return { ...base, ...(await this.#onMaster(xapi, 'check', { policy: text })), text }
        } catch (error) {
          return { ...base, ok: false, error: error.message }
        }
      })
    )
    const ok = pools.every(pool => pool.ok || pool.unreachable)
    return {
      ok,
      pools: pools.map(({ text, ...pool }) => pool),
      texts: Object.fromEntries(pools.map(pool => [pool.id, pool.text])),
    }
  }

  #recordSync(poolId, sync) {
    this.#syncs = { ...this.#syncs, [poolId]: { at: Date.now(), ...sync } }
    this.#store.put('syncs', this.#syncs).catch(error => log.warn('saving syncs', { error }))
  }

  // one publish at a time per scope: a compare-and-swap must see what the
  // previous publish wrote
  #serialized(scopeId, fn) {
    const previous = this.#publishing.get(scopeId) ?? Promise.resolve()
    const next = previous.then(fn, fn)
    const settled = next.catch(() => {})
    this.#publishing.set(scopeId, settled)
    settled.then(() => {
      if (this.#publishing.get(scopeId) === settled) {
        this.#publishing.delete(scopeId)
      }
    })
    return next
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
      const result = await this.#onMaster(xapi, 'publish', { policy: text })
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
    if (revision !== undefined && revision !== current) {
      throw new Error(
        `the global configuration changed meanwhile (revision ${current}, edit started from ${revision}): reload it`
      )
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
    const pools = await Promise.all(
      check.pools.map(async pool => {
        if (pool.skipped || pool.unreachable) {
          return pool
        }
        try {
          const result = await this.#onMaster(this.#xo.getXapi(pool.id), 'publish', { policy: texts[pool.id] })
          this.#recordSync(pool.id, { ok: result.ok, error: result.error, revision: this.#global.revision })
          return { ...pool, ...result }
        } catch (error) {
          this.#recordSync(pool.id, { ok: false, error: error.message })
          return { ...pool, ok: false, error: error.message }
        }
      })
    )
    return {
      ok: pools.every(pool => pool.ok || pool.unreachable),
      published: true,
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
    if (this.#global === undefined) {
      return
    }
    if (this.#syncing) {
      this.#syncAgain = true
      return
    }
    this.#syncing = true
    try {
      const members = this.#members()
      for (const pool of this.#pools()) {
        const xapi = this.#connectedXapi(pool.id)
        const last = this.#syncs[pool.id]
        if (xapi === undefined || (last?.ok === false && Date.now() - last.at < SYNC_RETRY_MS)) {
          continue
        }
        const published = publishedPolicy(xapi.pool?.other_config ?? {})
        const expected = this.#composeFor(pool.id, published.document, { members })
        const state = poolSyncState({
          inScope: inScope(this.#global.scope, pool.id),
          published: published.document,
          expected,
        })
        if (state === 'in-sync' || state === 'out-of-scope') {
          continue
        }
        try {
          const result = await this.#onMaster(xapi, 'publish', { policy: serialize(expected) })
          this.#recordSync(pool.id, { ok: result.ok, error: result.error, state, revision: this.#global.revision })
          log.info('pool synced with the global configuration', { pool: pool.id, state, ok: result.ok })
        } catch (error) {
          this.#recordSync(pool.id, { ok: false, error: error.message, state })
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
    return this.#xo.getXapi(poolId)
  }

  async #callPlugin(xapi, hostRef, fn, args = {}) {
    let out
    try {
      out = await xapi.call('host.call_plugin', hostRef, PLUGIN, fn, args)
    } catch (error) {
      if (/UNKNOWN_XENAPI_PLUGIN/.test(error.code ?? error.message)) {
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

  #routes() {
    return [
      {
        endpoint: '/global',
        method: 'get',
        description:
          "The XO-wide configuration (groups and policies written into every pool in scope), each pool's sync state and the members of the global groups across pools.",
        tags: ['vdf'],
        responses: [{ status: 200, description: 'Global configuration and status' }],
        callback: () => this.#globalStatus(),
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
        callback: async () => ({ entries: (await this.#history(GLOBAL_SCOPE)).map(listEntry) }),
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
        endpoint: '/pools/{id}/policy',
        method: 'get',
        description: 'The policy document the pool enforces (the newest pool key whose base still matches) and its id.',
        tags: ['vdf'],
        params: PARAMS_ID,
        responses: [{ status: 200, description: 'Published policy' }],
        callback: ({ req }) => {
          const policy = publishedPolicy(this.#getXapi(req.params.id).pool.other_config)
          const global = this.#global
          return {
            ...policy,
            global: {
              revision: global?.revision ?? 0,
              inScope: global !== undefined && inScope(global.scope, req.params.id),
            },
          }
        },
      },
      {
        endpoint: '/pools/{id}/actions/check_policy',
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
      },
      {
        endpoint: '/pools/{id}/actions/publish_policy',
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
          // throws no such object for an unknown pool
          this.#getXapi(req.params.id)
          const user = restApi.getCurrentUser({ throwUnauthenticated: false })
          return createAction(() => this.#publishPool(req.params.id, req.body, user), {
            sync: true,
            taskProperties: { name: 'publish firewall policy', objectId: req.params.id, objectType: 'pool' },
          })
        },
      },
      {
        endpoint: '/pools/{id}/history',
        method: 'get',
        description:
          'The last documents published to the pool through XO, oldest first, without their content: id, docId, previousDocId, publishedAt, publishedBy, summary.',
        tags: ['vdf'],
        params: PARAMS_ID,
        responses: [{ status: 200, description: 'Publish history' }],
        callback: async ({ req }) => {
          this.#xo.getObject(req.params.id, 'pool')
          return { entries: (await this.#history(req.params.id)).map(listEntry) }
        },
      },
      {
        endpoint: '/pools/{id}/history/{entry}',
        method: 'get',
        description: 'One published version of the pool document, and the version it replaced (`previous`, if kept).',
        tags: ['vdf'],
        params: PARAMS_ENTRY,
        responses: [
          { status: 200, description: 'Published version' },
          { status: 404, description: 'No such version' },
        ],
        callback: ({ req, res }) => {
          this.#xo.getObject(req.params.id, 'pool')
          return this.#historyEntry(req.params.id, req.params.entry, res)
        },
      },
      {
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
      },
      {
        endpoint: '/pools/{id}/stats',
        method: 'get',
        description:
          'Live view per host: rule hit rates, open connections with the rule that let them in, blocked attempts.',
        tags: ['vdf'],
        params: PARAMS_ID,
        responses: [{ status: 200, description: 'Per-host stats' }],
        callback: async ({ req }) => ({ hosts: await this.#onEachHost(this.#getXapi(req.params.id), 'stats') }),
      },
      {
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
      },
    ]
  }
}

export default opts => new VdfPlugin(opts)
