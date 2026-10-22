import { createHash } from 'node:crypto'
import { createLogger } from '@xen-orchestra/log'

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

const BODY_TRACE = {
  from: { type: 'string', example: '6c51b800-7de2-3b18-23b3-26d89b749a46' },
  to: { type: 'string', example: '192.168.1.76' },
  proto: { type: 'enum', enum: ['tcp', 'udp', 'icmp', 'any'] },
  port: { type: 'number', optional: true, example: 5432 },
  state: { type: 'enum', enum: ['new', 'established', 'revoked'], optional: true },
  family: { type: 'number', optional: true },
  broadcast: { type: 'boolean', optional: true },
}

const QUERY_LOG = {
  lines: { type: 'number', optional: true, example: 200 },
  since: { type: 'string', optional: true, example: '2026-10-22T08:00:00.000Z' },
}

class VdfPlugin {
  #unregisterRoutes
  #xo

  constructor({ xo }) {
    this.#xo = xo
  }

  load() {
    this.#unregisterRoutes = this.#xo.registerRestRoutes(this.#routes(), '/plugins/vdf')
  }

  unload() {
    this.#unregisterRoutes?.()
    this.#unregisterRoutes = undefined
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
        endpoint: '/pools/{id}/policy',
        method: 'get',
        description: 'The policy document the pool enforces (the newest pool key whose base still matches) and its id.',
        tags: ['vdf'],
        params: PARAMS_ID,
        responses: [{ status: 200, description: 'Published policy' }],
        callback: ({ req }) => publishedPolicy(this.#getXapi(req.params.id).pool.other_config),
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
        callback: ({ req }) => this.#onMaster(this.#getXapi(req.params.id), 'check', { policy: req.body.policy }),
      },
      {
        endpoint: '/pools/{id}/actions/publish_policy',
        method: 'post',
        description:
          "Validate and publish a policy document to the pool's keys, through the pool master's vdf-agent. Agents apply it within tens of milliseconds.",
        tags: ['vdf'],
        params: PARAMS_ID,
        body: BODY_POLICY,
        middlewares: [{ name: 'json', options: { limit: '8mb' } }],
        responses: [{ status: 200, description: 'Publish result (published, ok, error, warnings, keys, document)' }],
        callback: ({ req, createAction }) => {
          const xapi = this.#getXapi(req.params.id)
          return createAction(() => this.#onMaster(xapi, 'publish', { policy: req.body.policy }), {
            sync: true,
            taskProperties: { name: 'publish firewall policy', objectId: req.params.id, objectType: 'pool' },
          })
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
