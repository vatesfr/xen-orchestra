import { createLogger } from '@xen-orchestra/log'
import { incorrectState, noSuchObject, objectAlreadyExists } from 'xo-common/api-errors.js'
import { SDN_CONTROLLER_OF_FORMAT_KEY, SDN_CONTROLLER_TRAFFIC_RULES_KEY } from '@vates/types'
import { synchronized } from 'decorator-synchronized'

import * as store from './store'
import { apply, remove, rewrite } from './engine'
import { hostsOf, TrafficRulesPlugin } from './plugin'
import { hasLegacyRules, migrate, neutralizeLegacy, neutralizeVifCopy } from './migration'
import { appendPriority, generateCookie, planRewrite, sameMatch, sameRule, toEntryFields } from './rules'

const log = createLogger('xo:sdn-controller:traffic-rules')

function cookiesOf(entries) {
  return new Set(entries.flatMap(entry => [entry.cookie, ...(entry.previousCookies ?? [])]))
}

function logFailures(outcomes, message, context) {
  for (const [host, error] of outcomes) {
    if (error !== undefined) {
      log.warn(message, { ...context, host, error })
    }
  }
}

// How an entry is named in a reorder request
function toItem({ mac, allow, protocol, port, ipRange, direction }) {
  return { type: mac === undefined ? 'network' : 'VIF', mac, allow, protocol, port, ipRange, direction }
}

// The entries in the order of `items`, or undefined unless the items name every
// entry exactly once
function matchItems(entries, items) {
  if (items.length !== entries.length) {
    return
  }
  const remaining = [...entries]
  const ordered = []
  for (const item of items) {
    if (item.type === 'VIF' && item.mac === undefined) {
      return
    }
    const fields = toEntryFields({ ...item, mac: item.type === 'VIF' ? item.mac : undefined })
    const index = remaining.findIndex(entry => sameRule(entry, fields))
    if (index === -1) {
      return
    }
    ordered.push(...remaining.splice(index, 1))
  }
  return ordered
}

// =============================================================================
// Traffic rules as one ordered list per network, network-wide and VIF rules
// alike, enforced with OpenFlow priorities through sdncontroller.py.
// SDNController routes a network here when handles() says so, and this module
// never calls back into it: the plugin is going to be reworked, and this is meant
// to move into it with as few ties as possible.
// =============================================================================

export class TrafficRules {
  #beforeVifRuleChange
  #getXapiObject
  #plugin = new TrafficRulesPlugin()

  // One queue per network: a change reads the list, picks priorities and writes it
  // back, and two appends running together would take the same priority. Only the
  // public methods take it, and none of them calls another: it is not reentrant.
  #withNetworkLock = synchronized.withKey()((networkId, fn) => fn())

  // getXapiObject(id, type): the XAPI record of an XO object.
  // beforeVifRuleChange(vif): lets the plugin prepare the pool before a VIF rule
  // changes, as its legacy code does (SDN controller, XAPI event listeners).
  constructor({ getXapiObject, beforeVifRuleChange = async () => {} }) {
    this.#getXapiObject = getXapiObject
    this.#beforeVifRuleChange = beforeVifRuleChange
  }

  // Whether this module handles a network's rules: once its list exists, and
  // before that as soon as the network is eligible, its first operation then
  // migrating it
  async handles(network) {
    return store.isManaged(network) || (await this.#whyNotEligible(network)) === undefined
  }

  // Why a network keeps the legacy behaviour, or undefined when it can use the
  // ordered list: its pool's rules are in the XAPI-plugin format (or none was
  // recorded yet), and every host with a PIF on it runs a plugin with cookies.
  async #whyNotEligible(network) {
    const format = network.$pool.other_config[SDN_CONTROLLER_OF_FORMAT_KEY]
    if (format !== undefined && format !== 'xapi-plugin') {
      return `traffic rules are in the ${format} format`
    }
    const hosts = hostsOf(network)
    if (hosts.length === 0) {
      return 'no host has a PIF on this network'
    }
    const support = await Promise.all(hosts.map(host => this.#plugin.supportsCookies(host)))
    const missing = hosts.filter((host, index) => support[index] !== true).map(host => host.uuid)
    if (missing.length !== 0) {
      return `sdncontroller.py without cookie support, or unreachable, on ${missing.join(', ')}`
    }
  }

  // The network's current record and list, migrating it first if needed. Runs
  // inside the lock.
  async #open(network) {
    network = network.$xapi.getObjectByRef(network.$ref)
    if (!store.isManaged(network)) {
      const reason = await this.#whyNotEligible(network)
      if (reason !== undefined) {
        throw incorrectState({
          actual: reason,
          expected: 'ordered traffic rules',
          object: network.uuid,
          property: SDN_CONTROLLER_TRAFFIC_RULES_KEY,
        })
      }
      network = await migrate({ network, plugin: this.#plugin, store })
    }
    return { network, entries: store.readList(network) }
  }

  // The network holding a rule's list, and the MAC of a VIF rule
  #target({ networkId, vifId, mac }) {
    if (vifId !== undefined) {
      const vif = this.#getXapiObject(vifId, 'VIF')
      return { vif, network: vif.$network, mac: vif.MAC }
    }
    return { network: this.#getXapiObject(networkId, 'network'), mac }
  }

  // Replaces an entry in place: same priority, fresh cookie, the new flows added
  // before the old ones go (engine.apply). When the match changes, the cookie-0
  // flows of the old match go too: an older XO may have installed them, and the
  // entry no longer shadows them.
  async #replace(network, entries, old, fields) {
    const entry = {
      ...fields,
      priority: old.priority,
      cookie: generateCookie(cookiesOf(entries)),
      previousCookies: [old.cookie, ...(old.previousCookies ?? [])],
    }
    entries[entries.indexOf(old)] = entry
    network = await store.save(network, entries)
    network = await apply({ network, list: entries, entries: [entry], plugin: this.#plugin, store })
    if (!sameMatch(old, fields)) {
      logFailures(await this.#plugin.deleteLegacy(network, old), 'legacy flows of a traffic rule not deleted', {
        network: network.uuid,
      })
    }
  }

  // Appends a rule at the bottom of its network's list. Adding a match the list
  // already has on the same target changes its action in place, as the legacy
  // network rules do. A rule that installs nowhere is not kept, and the error is
  // the caller's.
  async addRule({ networkId, vifId, mac, ...rule }) {
    const { vif, network: initialNetwork, mac: targetMac } = this.#target({ networkId, vifId, mac })
    if (vif !== undefined) {
      await this.#beforeVifRuleChange(vif)
    }

    const network = await this.#withNetworkLock(initialNetwork.$id, async () => {
      const { network: currentNetwork, entries } = await this.#open(initialNetwork)
      const fields = toEntryFields({ ...rule, mac: targetMac })

      const existing = entries.find(entry => sameMatch(entry, fields))
      if (existing !== undefined) {
        if (existing.allow === fields.allow) {
          return currentNetwork
        }
        await this.#replace(currentNetwork, entries, existing, fields)
        return currentNetwork.$xapi.getObjectByRef(currentNetwork.$ref)
      }

      const priority = appendPriority(entries)
      if (priority === undefined) {
        const { entries: planned, deleteOrder } = planRewrite([...entries, fields])
        await rewrite({ network: currentNetwork, entries: planned, deleteOrder, plugin: this.#plugin, store })
        return currentNetwork.$xapi.getObjectByRef(currentNetwork.$ref)
      }

      const entry = {
        ...fields,
        priority,
        cookie: generateCookie(cookiesOf(entries)),
      }
      entries.push(entry)
      const savedNetwork = await store.save(currentNetwork, entries)

      const outcomes = await this.#plugin.install(savedNetwork, entry)
      const allFailed = [...outcomes.values()].every(error => error !== undefined)

      if (allFailed) {
        entries.pop()
        await store.save(currentNetwork, entries)
        throw [...outcomes.values()][0]
      }

      logFailures(outcomes, 'traffic rule not installed on this host', { network: savedNetwork.uuid, priority })

      return savedNetwork
    })

    return network
  }

  // Deletes a rule from the list. Without `allow`, deletes by match (XO 5). With
  // `allow`, deletes by match and action (REST API). Matching the old behavior,
  // throws 404 when the rule is missing.
  async deleteRule({ networkId, vifId, mac, ...rule }) {
    const { vif, network: initialNetwork, mac: targetMac } = this.#target({ networkId, vifId, mac })
    if (vif !== undefined) {
      await this.#beforeVifRuleChange(vif)
    }

    await this.#withNetworkLock(initialNetwork.$id, async () => {
      const { network: currentNetwork, entries } = await this.#open(initialNetwork)
      const fields = toEntryFields({ ...rule, mac: targetMac })

      const matcher = rule.allow !== undefined ? sameRule : sameMatch
      const entry = entries.find(e => matcher(e, fields))

      if (entry === undefined) {
        throw noSuchObject(JSON.stringify(rule), 'traffic-rule')
      }

      await remove({ network: currentNetwork, entry, plugin: this.#plugin })
      entries.splice(entries.indexOf(entry), 1)
      await store.save(currentNetwork, entries)
    })
  }

  // Replaces a rule in place: same priority, fresh cookie, the new flows added
  // before the old ones go. Changing the match deletes the old match's cookie-0
  // flows. Throws 404 when the old rule is missing, 409 when the new one collides
  // with another entry.
  async updateRule({ networkId, vifId }, oldRule, newRule) {
    const { vif, network: initialNetwork, mac: targetMac } = this.#target({ networkId, vifId, mac: undefined })
    if (vif !== undefined) {
      await this.#beforeVifRuleChange(vif)
    }

    await this.#withNetworkLock(initialNetwork.$id, async () => {
      const { network: currentNetwork, entries } = await this.#open(initialNetwork)
      const oldFields = toEntryFields({ ...oldRule, mac: targetMac })
      const newFields = toEntryFields({ ...newRule, mac: targetMac })

      const old = entries.find(entry => sameRule(entry, oldFields))
      if (old === undefined) {
        throw noSuchObject(JSON.stringify(oldRule), 'traffic-rule')
      }

      if (sameRule(old, newFields)) {
        return
      }

      const colliding = entries.find(entry => entry !== old && sameMatch(entry, newFields))
      if (colliding !== undefined) {
        throw objectAlreadyExists({ objectId: JSON.stringify(newRule), objectType: 'traffic-rule' })
      }

      await this.#replace(currentNetwork, entries, old, newFields)
    })
  }

  // Reorders the whole list: every entry moves to the other band, so this
  // rewrites them all (engine.rewrite). Anything but a permutation of the current
  // list means the caller's view is stale.
  async reorderRules(networkId, items) {
    const network = this.#getXapiObject(networkId, 'network')

    await this.#withNetworkLock(network.$id, async () => {
      const { network: currentNetwork, entries } = await this.#open(network)
      const ordered = matchItems(entries, items)

      if (ordered === undefined) {
        throw incorrectState({
          actual: items,
          expected: entries.map(toItem),
          object: networkId,
          property: 'traffic rules order',
        })
      }

      if (ordered.every((entry, index) => entry === entries[index])) {
        return
      }

      const { entries: planned, deleteOrder } = planRewrite(ordered)
      await rewrite({ network: currentNetwork, entries: planned, deleteOrder, plugin: this.#plugin, store })
    })
  }

  // At every connection to a pool. The pool's plugins may have been updated, so
  // its hosts are probed again. Then, network by network:
  // - a network with legacy rules is migrated if it is eligible, or stays legacy
  //   with a warning;
  // - a network that uses the list gets all its entries installed again (XO may
  //   have missed VM starts while it was away), which also finishes an interrupted
  //   rewrite; then any legacy data on it is neutralized, and the copies are
  //   written again.
  // A network without any rule stays untouched until its first rule.
  async handleConnectedXapi(xapi) {
    this.#plugin.forgetHosts(Object.values(xapi.objects.indexes.type.host ?? {}))
    for (const network of Object.values(xapi.objects.indexes.type.network ?? {})) {
      if (!store.isManaged(network) && !hasLegacyRules(network)) {
        continue
      }
      try {
        await this.#withNetworkLock(network.$id, () => this.#reconcile(network))
      } catch (error) {
        log.error('error while reconciling the traffic rules of a network', { error, network: network.uuid })
      }
    }
  }

  async #reconcile(network) {
    network = network.$xapi.getObjectByRef(network.$ref)
    if (!store.isManaged(network)) {
      const reason = await this.#whyNotEligible(network)
      if (reason !== undefined) {
        log.warn('traffic rules of this network stay in legacy mode, without order', {
          network: network.uuid,
          reason,
        })
        return
      }
      await migrate({ network, plugin: this.#plugin, store })
      return
    }
    const entries = store.readList(network)
    network = await apply({ network, list: entries, entries, plugin: this.#plugin, store })
    network = await neutralizeLegacy({ network, entries, plugin: this.#plugin })
    await store.save(network, entries)
  }

  // A VIF was plugged, or its VM started, rebooted or migrated. Its entries and the
  // network-wide ones are installed again: its host may have lost its flows
  // (restart), and network-wide rules need its new port. Its copy is checked too:
  // a clone, a revert or a VM created from a template brings another VIF's.
  //
  // Nothing happens when a VIF goes away. Its entries match its MAC on the whole
  // bridge and stay installed, so a live migration never leaves the VM
  // unfiltered.
  //
  // Called from XAPI event handlers: never throws.
  async vifAttached(vif) {
    const network = vif.$network
    try {
      await this.#withNetworkLock(network.$id, async () => {
        let { network: current, entries } = await this.#open(network)
        const mac = vif.MAC.toLowerCase()
        const own = entries.filter(entry => entry.mac === undefined || entry.mac === mac)
        current = await apply({ network: current, list: entries, entries: own, plugin: this.#plugin, store })
        await neutralizeVifCopy({ network: current, vif, entries, plugin: this.#plugin })
        await store.save(current, entries)
      })
    } catch (error) {
      log.error('error while installing the traffic rules of a VIF', { error, vif: vif.uuid, network: network.uuid })
    }
  }
}
