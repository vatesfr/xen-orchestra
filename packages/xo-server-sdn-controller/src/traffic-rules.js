// @ts-check
/// <reference path="../types/decorator-synchronized.d.ts" />
/// <reference path="../types/promise-toolbox.d.ts" />

import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { invalidParameters, noSuchObject, objectAlreadyExists } from 'xo-common/api-errors.js'
import { createHash, randomBytes } from 'crypto'
import pTimeout from 'promise-toolbox/timeout'
import { synchronized } from 'decorator-synchronized'

// TypeScript reads this Babel package as CommonJS, and `@vates/types` is ESM
/**
 * @import { XenApiHostWrapped, XenApiNetworkWrapped, XenApiVifWrapped, XenApiVm } from '@vates/types' with { 'resolution-mode': 'import' }
 */

// The xen-api records, with what it adds to them, which `@vates/types` does not describe
/**
 * @typedef {XenApiNetworkWrapped & {
 *   $id: string,
 *   $PIFs: Array<{ $host: XenApiHostWrapped }>,
 *   $VIFs: Vif[],
 *   $xapi: { getObjectByRef<T>(ref: string): T },
 *   update_other_config(key: string, value: string | null): Promise<void>,
 * }} Network
 *
 * @typedef {XenApiVifWrapped & {
 *   $network: Network,
 *   $VM: XenApiVm,
 *   $xapi: { getObjectByRef<T>(ref: string): T },
 *   update_other_config(key: string, value: string | null): Promise<void>,
 * }} Vif
 *
 * @typedef {Network | Vif} Owner
 */

// A rule as the API sends it: `priority` is its rank in its network, 1 applying first
/**
 * @typedef {object} RuleParams
 * @property {boolean} allow
 * @property {string} protocol
 * @property {number | string} [port]
 * @property {string} [ipRange]
 * @property {string} direction
 * @property {number | null} [priority]
 */

// What OVS sees as the same rule, whatever its action and priority
/**
 * @typedef {object} Match
 * @property {string} protocol
 * @property {number} [port]
 * @property {string} ipRange
 * @property {string} direction
 */

// A rule as its owner stores it, in `of-rules`. A VIF rule's cookie is not stored, see cookieOf
/**
 * @typedef {Match & { allow: boolean, ofPriority?: number, cookie?: string }} Rule
 */

// The rules of an owner. Those of the VIF of a snapshot or a template are not `live`: never applied
/**
 * @typedef {{ owner: Owner, rules: Rule[], live: boolean }} Entry
 */

const log = createLogger('xo:sdn-controller:traffic-rules')

const PLUGIN_NAME = 'sdncontroller.py'

// A host silent for 30 s is hung: failing releases the network lock, which xen-api's default
// would hold for an hour
const CALL_PLUGIN_TIMEOUT = 30e3

// `SDN_CONTROLLER_OF_RULES_KEY` of `@vates/types`, which this file cannot import either
const OF_RULES_KEY = 'xo:sdn-controller:of-rules'

// Above the flows of a locked VIF, which XAPI installs from 4000 to 8000, down to a drop: no rule
// ties with them, or sits unreached under that drop. See
// https://github.com/xapi-project/xen-api/blob/master/ocaml/xenopsd/scripts/setup-vif-rules
// A rule from before priorities is installed at LAST_PRIORITY until refresh() numbers it.
const LAST_PRIORITY = 8001
const MAX_PRIORITY = 65535

// fit() puts a network's first rule at FIRST_PRIORITY, one put first or last APPEND_STEP past its
// neighbour, and any other between its neighbours
const FIRST_PRIORITY = 60000
const APPEND_STEP = 5

// Not failures: an offline host restarts without flows, and a network rule builds none on a host
// where its network has no VIF (E_PORTS, code '4'). A VIF rule is built on every host.
/**
 * @param {Owner} owner
 * @param {unknown} error
 */
function isIgnored(owner, error) {
  if (!(error instanceof Error) || !('code' in error)) {
    return false
  }
  return error.code === 'HOST_OFFLINE' || (error.code === '4' && owner.$type !== 'VIF')
}

/**
 * @param {Owner} owner
 * @returns {Network}
 */
function networkOf(owner) {
  return owner.$type === 'VIF' ? owner.$network : owner
}

// As in the legacy code: without a PIF, no host would apply a network rule, yet the call succeeds
/**
 * @param {Owner} target
 * @param {'add' | 'update' | 'delete'} action
 */
function assertPlugged(target, action) {
  if (target.$type !== 'VIF' && target.$PIFs.length === 0) {
    throw invalidParameters(`Network needs to be plugged to ${action} a rule`)
  }
}

// A network rule always applies, a VIF rule while its VIF is plugged
/**
 * @param {Owner} owner
 */
function isActive(owner) {
  return owner.$type !== 'VIF' || owner.currently_attached
}

// A network and its VIFs, but not those of snapshots and templates, whose rules never apply
/**
 * @param {Network} network
 * @returns {Owner[]}
 */
function ownersOf(network) {
  const vifs = network.$VIFs.filter(({ $VM: vm }) => !vm.is_a_snapshot && !vm.is_a_template)
  return [network, ...vifs]
}

/**
 * @param {Omit<RuleParams, 'allow' | 'priority'>} params
 * @returns {Match}
 */
function toMatch({ protocol, port, ipRange = '', direction }) {
  return { protocol, port: port == null ? undefined : Number(port), ipRange, direction }
}

// In the field order of the legacy code, without an OpenFlow priority: place() gives it
/**
 * @param {RuleParams} params
 * @returns {Rule}
 */
function toRule({ allow, ...match }) {
  return { allow, ...toMatch(match) }
}

// XO 6 sends `TCP`, XO 5 `tcp`
/**
 * @param {Match} a
 * @param {Match} b
 */
function sameMatch(a, b) {
  return (
    a.direction === b.direction &&
    a.ipRange === b.ipRange &&
    a.port === b.port &&
    a.protocol.toLowerCase() === b.protocol.toLowerCase()
  )
}

/**
 * @param {Rule[]} rules
 */
function newCookie(rules) {
  /** @type {string} */
  let cookie
  do {
    cookie = '0x' + randomBytes(8).toString('hex')
  } while (cookie === '0x0000000000000000' || rules.some(rule => rule.cookie === cookie))
  return cookie
}

// XAPI copies a VIF's other_config to the clones of its VM, and add-rule first deletes the flows
// of its cookie: a VIF rule's comes from the MAC and the match, so that clones don't share it
/**
 * @param {Owner} owner
 * @param {Rule} rule
 */
function cookieOf(owner, rule) {
  if (owner.$type !== 'VIF') {
    return rule.cookie
  }
  const key = [owner.MAC, rule.protocol, rule.port ?? '', rule.ipRange, rule.direction].join('|').toLowerCase()
  return '0x' + createHash('sha256').update(key).digest('hex').slice(0, 16)
}

/**
 * @param {string | null | undefined} raw
 * @returns {Array<RuleParams & { ofPriority?: number, cookie?: string }>}
 */
export function parseRules(raw) {
  return raw == null ? [] : JSON.parse(raw).map(JSON.parse)
}

/**
 * @param {Pick<Owner, 'other_config'>} owner
 * @returns {Rule[]}
 */
function readRules(owner) {
  const stored = parseRules(owner.other_config[OF_RULES_KEY])
  const rules = stored.map(rule => ({ ...toRule(rule), ofPriority: rule.ofPriority, cookie: rule.cookie }))
  // the legacy `_addRule` could store two rules with the same match: the last one is in effect
  return rules.filter((rule, index) => !rules.slice(index + 1).some(other => sameMatch(other, rule)))
}

// Highest priority first, and only when changed. No timeout, unlike the plugin call: rejecting
// the wait would release the lock while the write can still land, unseen by the next change.
/**
 * @param {Owner} owner
 * @param {Rule[]} rules
 */
async function writeRules(owner, rules) {
  const sorted = [...rules].sort((a, b) => (b.ofPriority ?? LAST_PRIORITY) - (a.ofPriority ?? LAST_PRIORITY))
  // `null` removes the key
  const value = sorted.length === 0 ? null : JSON.stringify(sorted.map(rule => JSON.stringify(rule)))
  if ((owner.other_config[OF_RULES_KEY] ?? null) !== value) {
    await owner.update_other_config(OF_RULES_KEY, value)
    // the next change must read these rules
    await owner.$xapi.barrier(owner.$ref)
  }
}

// A rank, as the API takes it. Exported for the REST API, which checks it before its task starts.
/**
 * @param {number} priority
 */
export function checkPriorityValue(priority) {
  if (!Number.isInteger(priority) || priority < 1) {
    throw invalidParameters(`traffic rule priority must be an integer from 1, which applies first, not ${priority}`)
  }
}

// Highest first. With `legacy`, a rule from before priorities counts as LAST_PRIORITY.
/**
 * @param {Rule[]} rules
 * @param {boolean} legacy
 */
function prioritiesOf(rules, legacy) {
  const priorities = rules
    .filter(({ ofPriority }) => legacy || ofPriority !== undefined)
    .map(({ ofPriority }) => ofPriority ?? LAST_PRIORITY)
  return [...new Set(priorities)].sort((a, b) => b - a)
}

// 1 for the network's highest priority. Rules of one priority, like a clone's copies, share it.
/**
 * @param {Rule[]} rules
 * @param {Rule} rule
 */
function rankOf(rules, rule) {
  return prioritiesOf([...rules, rule], true).indexOf(rule.ofPriority ?? LAST_PRIORITY) + 1
}

// Gives `rule` a priority between those of the ranks `rank - 1` and `rank` among `others` (past
// the last: last), keeping its own when still in place. False when none is free there.
/**
 * @param {Rule[]} others
 * @param {Rule} rule
 * @param {number} rank
 */
function fit(others, rule, rank) {
  // rules from before priorities stay last, at LAST_PRIORITY
  const priorities = prioritiesOf(others, false)
  const index = Math.min(rank, priorities.length + 1) - 1
  const above = index === 0 ? MAX_PRIORITY + 1 : priorities[index - 1]
  const below = index === priorities.length ? LAST_PRIORITY : priorities[index]
  if (rule.ofPriority !== undefined && rule.ofPriority < above && rule.ofPriority > below) {
    return true
  }

  let priority
  if (priorities.length === 0) {
    priority = FIRST_PRIORITY
  } else if (index === priorities.length) {
    priority = above - APPEND_STEP
  } else if (index === 0) {
    priority = below + APPEND_STEP
  } else {
    priority = Math.floor((above + below) / 2)
  }
  if (priority >= above || priority <= below) {
    priority = Math.floor((above + below) / 2)
  }
  if (priority <= below) {
    return false
  }
  rule.ofPriority = priority
  return true
}

// Spreads the priorities down from FIRST_PRIORITY, keeping order and ties. Returns the moved rules.
/**
 * @param {Rule[]} rules
 */
function respace(rules) {
  const priorities = prioritiesOf(rules, false)
  const gap = Math.floor((FIRST_PRIORITY - LAST_PRIORITY) / (priorities.length + 1))
  const newPriorities = new Map(priorities.map((priority, index) => [priority, FIRST_PRIORITY - index * gap]))
  /** @type {Rule[]} */
  const moved = []
  for (const rule of rules) {
    const priority = rule.ofPriority === undefined ? undefined : newPriorities.get(rule.ofPriority)
    if (priority !== rule.ofPriority) {
      rule.ofPriority = priority
      moved.push(rule)
    }
  }
  return moved
}

// Moves `rule` to `rank` (Infinity: last), spreading the priorities when none is free there.
// Returns the other rules it moved: their flows must be installed again.
/**
 * @param {Rule[]} rules
 * @param {Rule} rule
 * @param {number} rank
 */
function place(rules, rule, rank) {
  const others = rules.filter(other => other !== rule)
  if (fit(others, rule, rank)) {
    return []
  }
  const moved = respace(others)
  if (!fit(others, rule, rank)) {
    throw objectAlreadyExists({ objectId: String(rank), objectType: 'traffic rule priority' })
  }
  return moved
}

/**
 * @param {Entry[]} entries
 */
function liveRules(entries) {
  return entries.flatMap(({ rules, live }) => (live ? rules : []))
}

// Runs a sdncontroller.py method on every host with a PIF on the network. A VIF rule matches its
// MAC on the whole bridge, so it is on every host too, and keeps applying while its VM migrates.
/**
 * @param {Owner} owner
 * @param {'add-rule' | 'del-rule'} method
 * @param {Rule} rule
 * @param {Record<string, string>} extraArgs
 */
function callPlugin(owner, method, rule, extraArgs) {
  const network = networkOf(owner)
  // the plugin takes strings, and no key for a missing value
  /** @type {Record<string, string>} */
  const args = { bridge: network.bridge, protocol: rule.protocol, ipRange: rule.ipRange, direction: rule.direction }
  if (owner.$type === 'VIF') {
    args.mac = owner.MAC
  }
  if (rule.port !== undefined) {
    args.port = String(rule.port)
  }
  return asyncEach(
    network.$PIFs,
    async ({ $host: host }) => {
      try {
        await pTimeout.call(
          host.$xapi.call('host.call_plugin', host.$ref, PLUGIN_NAME, method, { ...args, ...extraArgs }),
          CALL_PLUGIN_TIMEOUT
        )
      } catch (error) {
        if (!isIgnored(owner, error)) {
          throw error
        }
        log.info('sdncontroller.py failure ignored', {
          method,
          host: host.uuid,
          network: network.uuid,
          vif: owner.$type === 'VIF' ? owner.uuid : undefined,
          rule,
          error,
        })
      }
    },
    { stopOnError: false }
  )
}

// add-rule first deletes the flows of the rule's cookie: the same call moves a rule
/**
 * @param {Owner} owner
 * @param {Rule} rule
 */
function addFlows(owner, rule) {
  /** @type {Record<string, string>} */
  const args = { allow: String(rule.allow) }
  const cookie = cookieOf(owner, rule)
  // a network rule always has one, see TrafficRules#rulesOf
  if (cookie !== undefined) {
    args.cookie = cookie
  }
  args.priority = String(rule.ofPriority ?? LAST_PRIORITY)
  return callPlugin(owner, 'add-rule', rule, args)
}

// With a cookie, del-rule deletes exactly the flows carrying it
/**
 * @param {Owner} owner
 * @param {Rule} rule
 */
function deleteFlows(owner, rule) {
  const cookie = cookieOf(owner, rule)
  return callPlugin(owner, 'del-rule', rule, cookie === undefined ? {} : { cookie })
}

// TODO: remove when Node >=15.0, as in `@xen-orchestra/xapi/_AggregateError.mjs`
class AggregateError extends Error {
  /**
   * @param {unknown[]} errors
   * @param {string} message
   */
  constructor(errors, message) {
    super(message)
    this.errors = errors
  }
}

// Saves the changed owners, installs the flows of `rule`, deletes those of `previous` (the old
// match of an updated VIF rule) and installs those of the `moved` rules. The rules are saved
// already, so each step runs past a failed one, and their failures are thrown together.
/**
 * @param {Entry[]} entries
 * @param {Owner} owner
 * @param {Rule} rule
 * @param {Rule[]} moved
 * @param {Rule} [previous]
 */
async function applyChange(entries, owner, rule, moved, previous) {
  for (const entry of entries) {
    if (entry.owner === owner || entry.rules.some(other => moved.includes(other))) {
      await writeRules(entry.owner, entry.rules)
    }
  }
  /** @type {unknown[]} */
  const errors = []
  /** @param {() => Promise<void>} step */
  const attempt = async step => {
    try {
      await step()
    } catch (error) {
      errors.push(error)
    }
  }

  if (isActive(owner)) {
    await attempt(() => addFlows(owner, rule))
  }
  // a VIF rule's cookie comes from its match: its previous flows carry another
  if (previous !== undefined && owner.$type === 'VIF' && !sameMatch(previous, rule)) {
    await attempt(() => deleteFlows(owner, previous))
  }
  // concurrently, as a respace can move every rule: OVS orders flows by priority, not insertion
  const movedSet = new Set(moved)
  const toAdd = entries.flatMap(entry =>
    isActive(entry.owner)
      ? entry.rules.filter(other => movedSet.has(other)).map(rule => ({ owner: entry.owner, rule }))
      : []
  )
  await attempt(() =>
    asyncEach(toAdd, ({ owner: movedOwner, rule }) => addFlows(movedOwner, rule), {
      concurrency: 4,
      stopOnError: false,
    })
  )

  if (errors.length > 1) {
    throw new AggregateError(errors, 'the flows of a traffic rule change were not all updated')
  }
  if (errors.length === 1) {
    throw errors[0]
  }
}

// The rules of a network and of its VIFs, by rank, then network rules first and in VIF order
/**
 * @param {Network} network
 */
export function listRules(network) {
  const owners = ownersOf(network).map(owner => ({ owner, rules: readRules(owner) }))
  const all = owners.flatMap(({ rules }) => rules)
  const priorities = prioritiesOf(all, true)
  const rules = owners.flatMap(({ owner, rules: owned }) =>
    owned.map(({ cookie, ofPriority, ...rule }) => ({
      ...rule,
      priority: priorities.indexOf(ofPriority ?? LAST_PRIORITY) + 1,
      type: owner.$type,
      sourceId: owner.uuid,
      networkId: network.uuid,
      active: isActive(owner),
    }))
  )
  return rules.sort((a, b) => a.priority - b.priority)
}

// For the ACL of the REST API: it only reads `other_config`, so it takes XO records too
/**
 * @param {Pick<Owner, 'other_config'>} owner
 * @param {Omit<RuleParams, 'allow' | 'priority'>} params
 */
export function findRule(owner, params) {
  return readRules(owner).find(rule => sameMatch(rule, toMatch(params)))
}

// =============================================================================
// With sdncontroller.py, the matching rule of highest OpenFlow priority decides,
// network and VIF rules alike. The API speaks of ranks. Rules stay in the
// `of-rules` of their network or VIF.
// =============================================================================

// refresh, vifAttached and vifDetached, which XO runs on its own events, never throw
export class TrafficRules {
  // One change at a time per network, as each reads all its rules. The owner is fetched again:
  // its record may have been replaced while waiting.
  /** @type {<O extends Owner, T>(owner: O, fn: (owner: O) => Promise<T>) => Promise<T>} */
  #withLock = synchronized.withKey((/** @type {Owner} */ owner) => networkOf(owner).$id)((owner, fn) =>
    fn(owner.$xapi.getObjectByRef(owner.$ref))
  )

  // A rule with the same match gets the new action, and moves only to a given rank (XO 5 gives
  // none). A new rule goes last by default. Returns the rank. Saved before its flows, a rule
  // stays listed if a host fails: it can be deleted, and is installed at the next connection.
  /**
   * @param {Owner} target the network or the VIF
   * @param {RuleParams} params
   */
  async addRule(target, params) {
    assertPlugged(target, 'add')
    return this.#withLock(target, async owner => {
      const { entries, rules } = await this.#read(owner)
      const rule = toRule(params)

      let saved = rules.find(other => sameMatch(other, rule))
      const isNew = saved === undefined
      if (saved === undefined) {
        saved = owner.$type === 'VIF' ? rule : { ...rule, cookie: newCookie(rules) }
        rules.push(saved)
      } else {
        Object.assign(saved, rule)
      }

      const network = liveRules(entries)
      const rank = params.priority ?? (isNew ? Infinity : undefined)
      const moved = rank === undefined ? [] : place(network, saved, rank)
      await applyChange(entries, owner, saved, moved)
      return rankOf(network, saved)
    })
  }

  // A missing rule is not an error, as in the legacy code: the REST API checks it first
  /**
   * @param {Owner} target the network or the VIF
   * @param {Omit<RuleParams, 'allow' | 'priority'>} params
   */
  async deleteRule(target, params) {
    assertPlugged(target, 'delete')
    return this.#withLock(target, async owner => {
      const rules = await this.#rulesOf(owner)

      const index = rules.findIndex(rule => sameMatch(rule, toMatch(params)))
      if (index !== -1) {
        await deleteFlows(owner, rules[index])
        rules.splice(index, 1)
        await writeRules(owner, rules)
      }
    })
  }

  // `newParams` is the whole new rule: its priority moves it to that rank, `null` after the last
  // rule, and without one it keeps its place. Returns the rank of the rule.
  /**
   * @param {Owner} target the network or the VIF
   * @param {RuleParams} oldParams
   * @param {RuleParams} newParams
   */
  async updateRule(target, oldParams, newParams) {
    assertPlugged(target, 'update')
    return this.#withLock(target, async owner => {
      const { entries, rules } = await this.#read(owner)
      const newRule = toRule(newParams)

      const rule = rules.find(other => sameMatch(other, toMatch(oldParams)))
      if (rule === undefined) {
        throw noSuchObject(JSON.stringify(oldParams), 'traffic-rule')
      }
      if (rules.some(other => other !== rule && sameMatch(other, newRule))) {
        throw objectAlreadyExists({ objectId: JSON.stringify(newParams), objectType: 'traffic-rule' })
      }

      const previous = { ...rule }
      Object.assign(rule, newRule)
      const network = liveRules(entries)
      // a clone's copy shares its original's priority: it can change without moving
      const rank = newParams.priority === null ? Infinity : newParams.priority
      const moved = rank === undefined ? [] : place(network, rule, rank)
      await applyChange(entries, owner, rule, moved, previous)
      return rankOf(network, rule)
    })
  }

  // For the methods XO runs on its own events: the error is logged, not thrown
  /**
   * @template {Owner} O
   * @param {O} target
   * @param {string} message
   * @param {object} logFields
   * @param {(owner: O) => Promise<void>} fn
   */
  async #withLockOrLog(target, message, logFields, fn) {
    try {
      await this.#withLock(target, fn)
    } catch (error) {
      log.error(message, { error, ...logFields })
    }
  }

  // At each pool connection, as hosts may have restarted: numbers the rules from before
  // priorities (last, network rules first), then installs every rule but an unplugged VIF's.
  /**
   * @param {Network} network
   */
  async refresh(network) {
    await this.#withLockOrLog(
      network,
      'error while installing the traffic rules of a network',
      { network: network.uuid },
      async network => {
        const { entries } = await this.#read(network)
        const all = liveRules(entries)
        // before they are numbered
        const legacy = new Set(all.filter(rule => rule.ofPriority === undefined))
        for (const rule of all) {
          // the flows of every rule are installed below, those a respace moves too
          if (rule.ofPriority === undefined) {
            place(all, rule, Infinity)
          }
        }

        for (const { owner, rules } of entries) {
          // Legacy flows (cookie 0) go before any add: before xcp-ng-xapi-plugins 1.16.0,
          // del-rule ignores the cookie and deletes by match. Only rules read without a priority
          // have them (a rolled-back XO saves rules without one), and their priority is saved
          // after the delete, so that a failed one is retried at the next connection.
          const options = { concurrency: 4 }
          await asyncEach(
            rules.filter(rule => legacy.has(rule)),
            rule => callPlugin(owner, 'del-rule', rule, {}),
            options
          )
          await writeRules(owner, rules)
          await asyncEach(rules, rule => (isActive(owner) ? addFlows(owner, rule) : deleteFlows(owner, rule)), options)
        }
      }
    )
  }

  // A VIF was plugged, or its VM started or migrated: its host may have lost its
  // flows, and the network rules need its new port.
  /**
   * @param {Vif} vif
   */
  async vifAttached(vif) {
    await this.#withLockOrLog(
      vif,
      'error while installing the traffic rules of a VIF',
      { vif: vif.uuid },
      async vif => {
        // past a failed rule, the VIF's own, more restrictive ones still go: never fail-open
        const rules = [
          ...(await this.#rulesOf(vif.$network)).map(rule => ({ owner: vif.$network, rule })),
          ...readRules(vif).map(rule => ({ owner: vif, rule })),
        ]
        await asyncEach(rules, ({ owner, rule }) => addFlows(owner, rule), { concurrency: 1, stopOnError: false })
      }
    )
  }

  // A VIF was unplugged, or its VM halted: its rules go until it is back, and the
  // network rules drop its port. A migration or a reboot keeps them.
  /**
   * @param {Vif} vif
   */
  async vifDetached(vif) {
    await this.#withLockOrLog(vif, 'error while removing the traffic rules of a VIF', { vif: vif.uuid }, async vif => {
      for (const rule of readRules(vif)) {
        await deleteFlows(vif, rule)
      }
      for (const rule of await this.#rulesOf(vif.$network)) {
        await addFlows(vif.$network, rule)
      }
    })
  }

  // The rules of the network of `owner`, by owner, and those of `owner`, live or not
  /**
   * @param {Owner} owner
   */
  async #read(owner) {
    /** @type {Entry[]} */
    const entries = []
    for (const other of ownersOf(networkOf(owner))) {
      const current = other.$ref === owner.$ref ? owner : other
      entries.push({ owner: current, rules: await this.#rulesOf(current), live: true })
    }
    let entry = entries.find(entry => entry.owner === owner)
    if (entry === undefined) {
      entry = { owner, rules: await this.#rulesOf(owner), live: false }
      entries.push(entry)
    }
    return { entries, rules: entry.rules }
  }

  // A network rule from before cookies gets one, saved before any flow uses it
  /**
   * @param {Owner} owner
   */
  async #rulesOf(owner) {
    const rules = readRules(owner)
    if (owner.$type !== 'VIF' && rules.some(rule => rule.cookie === undefined)) {
      for (const rule of rules) {
        rule.cookie ??= newCookie(rules)
      }
      await writeRules(owner, rules)
    }
    return rules
  }
}
