// @ts-check
/// <reference path="../types/decorator-synchronized.d.ts" />

import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { invalidParameters, noSuchObject, objectAlreadyExists } from 'xo-common/api-errors.js'
import { createHash, randomBytes } from 'crypto'
import { synchronized } from 'decorator-synchronized'

// TypeScript reads this Babel package as CommonJS, and `@vates/types` is ESM
/**
 * @import { XenApiHostWrapped, XenApiNetworkWrapped, XenApiVifWrapped, XenApiVm } from '@vates/types' with { 'resolution-mode': 'import' }
 */

// The xen-api records, with what it adds to them and `@vates/types` does not
// describe
/**
 * @typedef {{
 *   getObjectByRef<T>(ref: string): T,
 * }} XapiCache
 *
 * @typedef {XenApiNetworkWrapped & {
 *   $id: string,
 *   $PIFs: Array<{ $host: XenApiHostWrapped }>,
 *   $VIFs: Vif[],
 *   $xapi: XapiCache,
 *   update_other_config(key: string, value: string | null): Promise<void>,
 * }} Network
 *
 * @typedef {XenApiVifWrapped & {
 *   $network: Network,
 *   $VM: XenApiVm,
 *   $xapi: XapiCache,
 *   update_other_config(key: string, value: string | null): Promise<void>,
 * }} Vif
 *
 * @typedef {Network | Vif} Owner
 */

// A rule as the API sends it. Its priority is its rank among the rules of its
// network, 1 applying first.
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

// A rule as its owner stores it, in `xo:sdn-controller:of-rules`, with its
// OpenFlow priority. Only a network rule stores its cookie: a VIF rule's is
// derived (vifCookie).
/**
 * @typedef {Match & { allow: boolean, ofPriority?: number, cookie?: string }} Rule
 */

// The rules of an owner, as a change reads them under the lock. The VIF of a
// snapshot or a template is not `live`: its rules never apply.
/**
 * @typedef {{ owner: Owner, rules: Rule[], live: boolean }} Entry
 */

const log = createLogger('xo:sdn-controller:traffic-rules')

const PLUGIN_NAME = 'sdncontroller.py'

// `SDN_CONTROLLER_OF_RULES_KEY` of `@vates/types`, a value TypeScript does not
// let this file import, for the same reason as above
const OF_RULES_KEY = 'xo:sdn-controller:of-rules'

// XAPI installs the flows of a locked VIF from 4000 to 8000, ending with a drop at
// 4000: every rule is above them, so that none ties with them, nor sits under that
// drop where it would never be reached. See
// https://github.com/xapi-project/xen-api/blob/master/ocaml/xenopsd/scripts/setup-vif-rules
//
// A rule has an OpenFlow priority from LAST_PRIORITY + 1 to MAX_PRIORITY. One from
// before priorities is installed at LAST_PRIORITY until refresh() numbers it.
const LAST_PRIORITY = 8001
const MAX_PRIORITY = 65535

// The API speaks of ranks: a rule goes between the OpenFlow priorities of the rules
// around its rank. A rule put last gets the lowest priority of its network minus
// APPEND_STEP, or FIRST_PRIORITY for the first one, which leaves room above; one put
// first, the highest plus APPEND_STEP; one in between, the middle of its
// neighbours'. When they leave no free priority, the network's are spread again.
const FIRST_PRIORITY = 60000
const APPEND_STEP = 5

// Not failures, as for the legacy code: a network rule builds no flow on a host
// where the network has no VIF (sdncontroller.py's E_PORTS), and an offline host
// restarts without any flow
const IGNORED_ERRORS = ['4', 'HOST_OFFLINE']

/**
 * @param {unknown} error
 */
function isIgnored(error) {
  return error instanceof Error && 'code' in error && IGNORED_ERRORS.some(code => code === error.code)
}

/**
 * @param {Owner} owner
 * @returns {Network}
 */
function networkOf(owner) {
  return owner.$type === 'VIF' ? owner.$network : owner
}

// A network rule always applies, a VIF rule while its VIF is plugged
/**
 * @param {Owner} owner
 */
function isActive(owner) {
  return owner.$type !== 'VIF' || owner.currently_attached
}

// Snapshots and templates keep a frozen copy of their VM's VIFs
/**
 * @param {Network} network
 */
function liveVifs(network) {
  return network.$VIFs.filter(({ $VM: vm }) => !vm.is_a_snapshot && !vm.is_a_template)
}

// The owners of the rules the priorities of a network order
/**
 * @param {Network} network
 * @returns {Owner[]}
 */
function ownersOf(network) {
  return [network, ...liveVifs(network)]
}

/**
 * @param {Omit<RuleParams, 'allow' | 'priority'>} params
 * @returns {Match}
 */
function toMatch({ protocol, port, ipRange = '', direction }) {
  return { protocol, port: port == null || port === '' ? undefined : Number(port), ipRange, direction }
}

// In the field order of the legacy code. Without its OpenFlow priority, which only
// placing it gives.
/**
 * @param {RuleParams} params
 * @returns {Rule}
 */
function toRule({ allow, ...match }) {
  const { protocol, port, ipRange, direction } = toMatch(match)
  return { allow, protocol, port, ipRange, direction }
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

// XAPI copies the other_config of a VM's VIFs to its clones, whose rules must not
// share their cookies: add-rule first deletes the flows carrying its cookie. So a
// VIF rule's cookie comes from its VIF's MAC and its match instead.
/**
 * @param {Vif} vif
 * @param {Match} match
 */
function vifCookie(vif, { protocol, port, ipRange, direction }) {
  const key = [vif.MAC, protocol, port ?? '', ipRange, direction].join('|').toLowerCase()
  return '0x' + createHash('sha256').update(key).digest('hex').slice(0, 16)
}

/**
 * @param {Owner} owner
 * @param {Rule} rule
 */
function cookieOf(owner, rule) {
  return owner.$type === 'VIF' ? vifCookie(owner, rule) : rule.cookie
}

/**
 * @param {Pick<Owner, 'other_config'>} owner
 * @returns {Rule[]}
 */
function readRules(owner) {
  const raw = owner.other_config[OF_RULES_KEY]
  /** @type {Array<RuleParams & { ofPriority?: number, cookie?: string }>} */
  const stored = raw === undefined ? [] : JSON.parse(raw).map(JSON.parse)
  const rules = stored.map(rule => ({ ...toRule(rule), ofPriority: rule.ofPriority, cookie: rule.cookie }))
  // the legacy `_addRule` could store two rules with the same match: the last one
  // is the one in effect
  return rules.filter((rule, index) => !rules.slice(index + 1).some(other => sameMatch(other, rule)))
}

// Highest priority first, as they apply. A key already up to date is not written
// again.
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

// A rank, as the API takes it. Exported for the REST API, which checks it before
// starting its task.
/**
 * @param {number} priority
 */
export function checkPriorityValue(priority) {
  if (!Number.isInteger(priority) || priority < 1) {
    throw invalidParameters(`traffic rule priority must be an integer from 1, which applies first, not ${priority}`)
  }
}

// The distinct OpenFlow priorities of `rules`, highest first. With `legacy`, those
// of rules from before priorities count as LAST_PRIORITY.
/**
 * @param {Rule[]} rules
 * @param {boolean} legacy
 */
function prioritiesOf(rules, legacy) {
  const priorities = new Set()
  for (const { ofPriority } of rules) {
    if (ofPriority !== undefined || legacy) {
      priorities.add(ofPriority ?? LAST_PRIORITY)
    }
  }
  return [...priorities].sort((a, b) => b - a)
}

// The rank of `rule` among `rules`, those of its network: 1 for the highest
// priority, one more for each lower one. Rules of the same priority, like the
// copies a clone makes, share their rank.
/**
 * @param {Rule[]} rules
 * @param {Rule} rule
 */
function rankOf(rules, rule) {
  return prioritiesOf([...rules, rule], true).indexOf(rule.ofPriority ?? LAST_PRIORITY) + 1
}

// Gives `rule` an OpenFlow priority between those of the ranks `rank - 1` and
// `rank` among `others`, the other rules of its network, keeping the one it has
// when it is there already. A rank past the last one puts it last. Returns false
// when they leave no free priority.
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

// Spreads the OpenFlow priorities of `rules` down from FIRST_PRIORITY, as far apart
// as the range allows, keeping their order and their ties. Returns the rules whose
// priority changed.
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

// Moves `rule` to `rank` (Infinity: after the last rule) among `rules`, those of its
// network, spreading their priorities again when none is free there. Returns the
// other rules whose priority changed: their flows must be installed again.
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

// Runs a sdncontroller.py method on every host with a PIF on the network. A VIF
// rule matches its MAC on the whole bridge, so it is on every host too, and keeps
// applying while its VM migrates.
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
        await host.$xapi.call('host.call_plugin', host.$ref, PLUGIN_NAME, method, { ...args, ...extraArgs })
      } catch (error) {
        if (!isIgnored(error)) {
          throw error
        }
      }
    },
    { stopOnError: false }
  )
}

// add-rule first deletes the flows carrying the rule's cookie: the same call
// installs a rule, and moves it to another priority or match
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

// Without a cookie, del-rule deletes by match the flows with cookie 0: those of
// the legacy code, and of network rules from before cookies. Rules installed here
// always have a cookie.
/**
 * @param {Owner} owner
 * @param {Rule} rule
 */
function deleteLegacyFlows(owner, rule) {
  return callPlugin(owner, 'del-rule', rule, {})
}

// Saves the rules of `owner`, and of the owners of the rules `moved` to another
// priority
/**
 * @param {Entry[]} entries
 * @param {Owner} owner
 * @param {Rule[]} moved
 */
async function save(entries, owner, moved) {
  for (const entry of entries) {
    if (entry.owner === owner || entry.rules.some(rule => moved.includes(rule))) {
      await writeRules(entry.owner, entry.rules)
    }
  }
}

// Installs the flows of the rules `moved` to another priority again
/**
 * @param {Entry[]} entries
 * @param {Rule[]} moved
 */
async function installMoved(entries, moved) {
  for (const { owner, rules } of entries) {
    for (const rule of rules) {
      if (isActive(owner) && moved.includes(rule)) {
        await addFlows(owner, rule)
      }
    }
  }
}

// The rules of a network and of its VIFs, by rank: the order in which they apply.
// Rules of the same rank, which have no defined order in OVS either, keep network
// rules first, then the order of the VIFs.
/**
 * @param {Network} network
 */
export function listRules(network) {
  const owners = ownersOf(network).map(owner => ({ owner, rules: readRules(owner) }))
  const all = owners.flatMap(({ rules }) => rules)
  const priorities = prioritiesOf(all, true)
  const rules = owners.flatMap(({ owner, rules }) =>
    rules.map(({ cookie, ofPriority, ...rule }) => ({
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

// The rule `owner` stores with this match, for the ACL of the REST API. It only
// reads `other_config`, so XO records do too.
/**
 * @param {Pick<Owner, 'other_config'>} owner
 * @param {Omit<RuleParams, 'allow' | 'priority'>} params
 */
export function findRule(owner, params) {
  const match = toMatch(params)
  return readRules(owner).find(rule => sameMatch(rule, match))
}

// =============================================================================
// With sdncontroller.py, traffic rules carry an OpenFlow priority: of the rules
// of a network matching a packet, network and VIF rules alike, the highest one
// decides. The API gives a rule a rank instead, from which its priority follows.
// Rules stay where they always were, in the `xo:sdn-controller:of-rules` of their
// network or VIF.
// =============================================================================

export class TrafficRules {
  // A change reads the rules of the network to check the priority, and writes
  // those of its owner back: one at a time per network. The owner is fetched
  // again, as its record may have been replaced while waiting.
  /** @type {<O extends Owner, T>(owner: O, fn: (owner: O) => Promise<T>) => Promise<T>} */
  #withLock = synchronized.withKey((/** @type {Owner} */ owner) => networkOf(owner).$id)((owner, fn) =>
    fn(owner.$xapi.getObjectByRef(owner.$ref))
  )

  // A rule with the same match on the same owner only gets the new action, and moves
  // to the new rank. Without one, it keeps its place, as XO 5 knows nothing of
  // priorities, and a new rule goes last. Returns the rank of the rule.
  //
  // The rule is saved before its flows are installed: if that failed on some
  // host, it is still listed, so it can be deleted, and is installed again at the
  // next connection.
  /**
   * @param {Owner} target the network or the VIF
   * @param {RuleParams} params
   */
  addRule(target, params) {
    return this.#withLock(target, async owner => {
      if (params.priority != null) {
        checkPriorityValue(params.priority)
      }
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
      await save(entries, owner, moved)
      if (isActive(owner)) {
        await addFlows(owner, saved)
      }
      await installMoved(entries, moved)
      return rankOf(network, saved)
    })
  }

  // A missing rule is not an error, as for the legacy code: the REST API checks
  // that it exists beforehand
  /**
   * @param {Owner} target the network or the VIF
   * @param {Omit<RuleParams, 'allow' | 'priority'>} params
   */
  deleteRule(target, params) {
    return this.#withLock(target, async owner => {
      const rules = await this.#rulesOf(owner)
      const match = toMatch(params)

      const index = rules.findIndex(rule => sameMatch(rule, match))
      if (index !== -1) {
        await deleteFlows(owner, rules[index])
        rules.splice(index, 1)
        await writeRules(owner, rules)
      }
    })
  }

  // `newParams` is the whole new rule. Its priority moves it to this rank, and `null`
  // after the last rule; without one, it keeps its place. Returns the rank of the
  // rule.
  /**
   * @param {Owner} target the network or the VIF
   * @param {RuleParams} oldParams
   * @param {RuleParams} newParams
   */
  updateRule(target, oldParams, newParams) {
    return this.#withLock(target, async owner => {
      if (newParams.priority != null) {
        checkPriorityValue(newParams.priority)
      }
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
      // a clone's copy shares the priority of its original: it can still change
      // without moving
      const rank = newParams.priority === null ? Infinity : newParams.priority
      const moved = rank === undefined ? [] : place(network, rule, rank)
      await save(entries, owner, moved)
      if (isActive(owner)) {
        await addFlows(owner, rule)
      }
      // a VIF rule's cookie comes from its match: its previous flows carry another
      if (owner.$type === 'VIF' && !sameMatch(previous, rule)) {
        await deleteFlows(owner, previous)
      }
      await installMoved(entries, moved)
      return rankOf(network, rule)
    })
  }

  // At every connection to a pool, as hosts may have restarted while XO was away.
  // Rules from before priorities are numbered first, put last one after the other,
  // network rules first. The flows of rules whose VIF is unplugged go, and so do
  // the legacy flows (cookie 0): this is all a network from before priorities
  // needs.
  //
  // Called from event handlers: never throws.
  /**
   * @param {Network} network
   */
  async refresh(network) {
    try {
      await this.#withLock(network, async network => {
        const { entries } = await this.#read(network)
        const all = liveRules(entries)
        for (const rule of all) {
          // the flows of every rule are installed below, those a respace moves too
          if (rule.ofPriority === undefined) {
            place(all, rule, Infinity)
          }
        }

        for (const { owner, rules } of entries) {
          await writeRules(owner, rules)
          for (const rule of rules) {
            // before installing the rule: on hosts whose xcp-ng-xapi-plugins is older
            // than 1.16.0, del-rule ignores the cookie and deletes its flows too
            await deleteLegacyFlows(owner, rule)
            await (isActive(owner) ? addFlows(owner, rule) : deleteFlows(owner, rule))
          }
        }
      })
    } catch (error) {
      log.error('error while installing the traffic rules of a network', { error, network: network.uuid })
    }
  }

  // A VIF was plugged, or its VM started or migrated: its host may have lost its
  // flows, and the network rules need its new port.
  //
  // Called from event handlers: never throws.
  /**
   * @param {Vif} vif
   */
  async vifAttached(vif) {
    try {
      await this.#withLock(vif, async vif => {
        for (const rule of await this.#rulesOf(vif.$network)) {
          await addFlows(vif.$network, rule)
        }
        for (const rule of readRules(vif)) {
          await addFlows(vif, rule)
        }
      })
    } catch (error) {
      log.error('error while installing the traffic rules of a VIF', { error, vif: vif.uuid })
    }
  }

  // A VIF was unplugged, or its VM halted: its rules go until it is back, and the
  // network rules drop its port. A migration or a reboot keeps them.
  //
  // Called from event handlers: never throws.
  /**
   * @param {Vif} vif
   */
  async vifDetached(vif) {
    try {
      await this.#withLock(vif, async vif => {
        for (const rule of readRules(vif)) {
          await deleteFlows(vif, rule)
        }
        for (const rule of await this.#rulesOf(vif.$network)) {
          await addFlows(vif.$network, rule)
        }
      })
    } catch (error) {
      log.error('error while removing the traffic rules of a VIF', { error, vif: vif.uuid })
    }
  }

  // The rules of the network of `owner`, by owner, and those of `owner`, which is
  // not live when it is the VIF of a snapshot
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

  // A network rule from before cookies gets one here, saved before any flow is
  // installed with it
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
