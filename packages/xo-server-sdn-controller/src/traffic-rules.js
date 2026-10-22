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

// A rule as the API sends it
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

// A rule as its owner stores it, in `xo:sdn-controller:of-rules`. Only a network
// rule stores its cookie: a VIF rule's is derived (vifCookie).
/**
 * @typedef {Match & { allow: boolean, priority?: number, cookie?: string }} Rule
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
// A rule has a priority from LAST_PRIORITY + 1 to MAX_PRIORITY. One from before
// priorities is installed at LAST_PRIORITY until refresh() numbers it.
const LAST_PRIORITY = 8001
const MAX_PRIORITY = 65535

// A rule added without a priority is appended: it gets the lowest priority of its
// network minus APPEND_STEP, or FIRST_PRIORITY for the first one, which leaves
// room above. The step is small so that a network holds thousands of them, and
// leaves gaps to move a rule between two others in one update.
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

// In the field order of the legacy code
/**
 * @param {RuleParams} params
 * @returns {Rule}
 */
function toRule({ allow, priority, ...match }) {
  const { protocol, port, ipRange, direction } = toMatch(match)
  return { allow, protocol, port, ipRange, direction, priority: priority ?? undefined }
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
  /** @type {Array<RuleParams & { cookie?: string }>} */
  const stored = raw === undefined ? [] : JSON.parse(raw).map(JSON.parse)
  const rules = stored.map(rule => ({ ...toRule(rule), cookie: rule.cookie }))
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
  const sorted = [...rules].sort((a, b) => (b.priority ?? LAST_PRIORITY) - (a.priority ?? LAST_PRIORITY))
  // `null` removes the key
  const value = sorted.length === 0 ? null : JSON.stringify(sorted.map(rule => JSON.stringify(rule)))
  if ((owner.other_config[OF_RULES_KEY] ?? null) !== value) {
    await owner.update_other_config(OF_RULES_KEY, value)
    // the next change must read these rules
    await owner.$xapi.barrier(owner.$ref)
  }
}

// Exported for the REST API, which checks a priority before starting its task
/**
 * @param {number} priority
 */
export function checkPriorityValue(priority) {
  if (!Number.isInteger(priority) || priority <= LAST_PRIORITY || priority > MAX_PRIORITY) {
    throw invalidParameters(
      `traffic rule priority must be an integer from ${LAST_PRIORITY + 1} to ${MAX_PRIORITY}, not ${priority}`
    )
  }
}

// The priority a rule moves to must be valid, and free on the network: two
// overlapping flows of the same priority have no defined winner
/**
 * @param {Network} network
 * @param {number} priority
 */
function checkPriority(network, priority) {
  checkPriorityValue(priority)
  if (ownersOf(network).some(owner => readRules(owner).some(rule => rule.priority === priority))) {
    throw objectAlreadyExists({ objectId: String(priority), objectType: 'traffic rule priority' })
  }
}

// The priority of a rule appended after `rules`, those of a network, or
// `undefined` when the lowest one allowed is taken
/**
 * @param {Rule[]} rules
 */
function nextPriority(rules) {
  const priorities = rules.flatMap(({ priority }) => (priority === undefined ? [] : [priority]))
  if (priorities.length === 0) {
    return FIRST_PRIORITY
  }
  const lowest = Math.min(...priorities)
  const priority = Math.max(lowest - APPEND_STEP, LAST_PRIORITY + 1)
  return priority < lowest ? priority : undefined
}

// As nextPriority(), for a change that fails without room left
/**
 * @param {Rule[]} rules
 */
function appendedPriority(rules) {
  const priority = nextPriority(rules)
  if (priority === undefined) {
    throw objectAlreadyExists({ objectId: String(LAST_PRIORITY + 1), objectType: 'traffic rule priority' })
  }
  return priority
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
  args.priority = String(rule.priority ?? LAST_PRIORITY)
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

// The rules of a network and of its VIFs, highest priority first: the order in
// which they apply. Rules of the same priority, which have no defined order in OVS
// either, keep network rules first, then the order of the VIFs.
/**
 * @param {Network} network
 */
export function listRules(network) {
  const rules = ownersOf(network).flatMap(owner =>
    readRules(owner).map(({ cookie, ...rule }) => ({
      ...rule,
      type: owner.$type,
      sourceId: owner.uuid,
      networkId: network.uuid,
      active: isActive(owner),
    }))
  )
  return rules.sort((a, b) => (b.priority ?? LAST_PRIORITY) - (a.priority ?? LAST_PRIORITY))
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
// decides. Rules stay where they always were, in the `xo:sdn-controller:of-rules`
// of their network or VIF.
// =============================================================================

export class TrafficRules {
  // A change reads the rules of the network to check the priority, and writes
  // those of its owner back: one at a time per network. The owner is fetched
  // again, as its record may have been replaced while waiting.
  /** @type {<O extends Owner, T>(owner: O, fn: (owner: O) => Promise<T>) => Promise<T>} */
  #withLock = synchronized.withKey((/** @type {Owner} */ owner) => networkOf(owner).$id)((owner, fn) =>
    fn(owner.$xapi.getObjectByRef(owner.$ref))
  )

  // A rule with the same match on the same owner only gets the new action and
  // priority. Without a priority, it keeps the one it had, as XO 5 knows nothing of
  // them, and a new rule is appended.
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
      const rules = await this.#rulesOf(owner)
      const rule = toRule(params)

      const existing = rules.find(other => sameMatch(other, rule))
      if (rule.priority === undefined) {
        rule.priority =
          existing === undefined ? appendedPriority(ownersOf(networkOf(owner)).flatMap(readRules)) : existing.priority
      } else if (rule.priority !== existing?.priority) {
        checkPriority(networkOf(owner), rule.priority)
      }
      if (existing !== undefined) {
        Object.assign(existing, rule)
      } else {
        rules.push(owner.$type === 'VIF' ? rule : { ...rule, cookie: newCookie(rules) })
      }

      await writeRules(owner, rules)
      if (isActive(owner)) {
        await addFlows(owner, existing ?? rules[rules.length - 1])
      }
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

  // `newParams` is the whole new rule, its priority included: without one, the rule
  // moves after the last rule of the network
  /**
   * @param {Owner} target the network or the VIF
   * @param {RuleParams} oldParams
   * @param {RuleParams} newParams
   */
  updateRule(target, oldParams, newParams) {
    return this.#withLock(target, async owner => {
      const rules = await this.#rulesOf(owner)
      const newRule = toRule(newParams)

      const rule = rules.find(other => sameMatch(other, toMatch(oldParams)))
      if (rule === undefined) {
        throw noSuchObject(JSON.stringify(oldParams), 'traffic-rule')
      }
      if (rules.some(other => other !== rule && sameMatch(other, newRule))) {
        throw objectAlreadyExists({ objectId: JSON.stringify(newParams), objectType: 'traffic-rule' })
      }
      if (newRule.priority === undefined) {
        // the rule itself aside, which may be the last one already
        const others = ownersOf(networkOf(owner)).flatMap(other =>
          other.$ref === owner.$ref ? rules.filter(r => r !== rule) : readRules(other)
        )
        newRule.priority = appendedPriority(others)
      } else if (newRule.priority !== rule.priority) {
        // a clone's copy shares the priority of its original: it can still change
        // without moving
        checkPriority(networkOf(owner), newRule.priority)
      }

      const previous = { ...rule }
      Object.assign(rule, newRule)
      await writeRules(owner, rules)
      if (isActive(owner)) {
        await addFlows(owner, rule)
      }
      // a VIF rule's cookie comes from its match: its previous flows carry another
      if (owner.$type === 'VIF' && !sameMatch(previous, rule)) {
        await deleteFlows(owner, previous)
      }
    })
  }

  // At every connection to a pool, as hosts may have restarted while XO was away.
  // Rules from before priorities are numbered first, as if appended network rules
  // first; without room left, they stay at LAST_PRIORITY. The flows of rules whose
  // VIF is unplugged go, and so do the legacy flows (cookie 0): this is all a
  // network from before priorities needs.
  //
  // Called from event handlers: never throws.
  /**
   * @param {Network} network
   */
  async refresh(network) {
    try {
      await this.#withLock(network, async network => {
        const owners = ownersOf(network)
        /** @type {Rule[][]} */
        const rulesByOwner = []
        for (const owner of owners) {
          rulesByOwner.push(await this.#rulesOf(owner))
        }
        const all = rulesByOwner.flat()
        for (const rule of all) {
          rule.priority ??= nextPriority(all)
        }

        for (const [index, owner] of owners.entries()) {
          await writeRules(owner, rulesByOwner[index])
          for (const rule of rulesByOwner[index]) {
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
