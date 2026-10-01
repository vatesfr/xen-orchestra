import { createLogger } from '@xen-orchestra/log'

import { hostsOf } from './plugin'
import { LEGACY_COOKIE } from './rules'

const log = createLogger('xo:sdn-controller:traffic-rules:engine')

function logFailures(outcomes, message, context) {
  for (const [host, error] of outcomes) {
    if (error !== undefined) {
      log.warn(message, { ...context, host, error })
    }
  }
}

// The $refs of the hosts where the entry's flows are now in place
async function install(plugin, network, entry) {
  const outcomes = await plugin.install(network, entry)
  logFailures(outcomes, 'traffic rule not installed on this host', { network: network.uuid, priority: entry.priority })
  return new Set([...outcomes].filter(([, error]) => error === undefined).map(([ref]) => ref))
}

// Deletes the flows of the entry's previous versions, on the hosts in
// `installed` only: where its new flows did not go in, the old ones are what
// still enforces the rule. A previous cookie is dropped once deleted on every
// host of the network. The others stay, and are retried the next time the entry
// is installed.
async function deletePrevious(plugin, network, entry, installed) {
  if (entry.previousCookies === undefined) {
    return
  }
  const hosts = hostsOf(network)
  const targets = hosts.filter(host => installed.has(host.$ref))
  const remaining = []
  for (const cookie of entry.previousCookies) {
    const outcomes =
      cookie === LEGACY_COOKIE
        ? await plugin.deleteLegacy(network, entry, targets)
        : await plugin.deleteCookie(network, entry, cookie, targets)
    logFailures(outcomes, 'previous flows of a traffic rule not deleted on this host', {
      network: network.uuid,
      cookie,
    })
    const failed = [...outcomes.values()].some(error => error !== undefined)
    if (failed || targets.length !== hosts.length) {
      remaining.push(cookie)
    }
  }
  if (remaining.length === 0) {
    delete entry.previousCookies
  } else {
    entry.previousCookies = remaining
  }
}

// Rewrites the whole list as planned by planRewrite: the new flows go in
// top-down, then the previous ones are deleted in `deleteOrder`. A packet keeps
// its old verdict until it switches, once, to its new one:
// - new band below the old one: the new flows stay shadowed while the old ones
//   go, lowest first, so the old flows left are always the top of the old list,
//   and a packet matching none of them meets the complete new list;
// - new band above: the new flows in place are always the top of the new list,
//   and any other packet still meets the complete old list.
//
// The list is saved first, with the previous cookies: if XO stops half-way, the
// next connection finishes the job (see apply).
export async function rewrite({ network, entries, deleteOrder, plugin, store }) {
  network = await store.save(network, entries)
  const installed = new Map()
  for (const entry of entries) {
    installed.set(entry, await install(plugin, network, entry))
  }
  for (const entry of deleteOrder) {
    await deletePrevious(plugin, network, entry, installed.get(entry))
  }
  return store.save(network, entries)
}

// Installs `entries` again with their current cookie, then deletes their previous
// flows where the install worked. This is a refresh (VIF attached, XAPI connect),
// the end of an update, and the resumption of an interrupted rewrite. `list` is
// the whole list, saved when some previous cookie was dropped.
//
// Every install comes before any delete, so no rule is ever missing. A resumed
// rewrite no longer knows the old priorities, so its deletes follow the list
// order: every rule stays enforced, but rewrite's single switch per packet only
// holds for an uninterrupted rewrite.
export async function apply({ network, list, entries, plugin, store }) {
  const installed = new Map()
  for (const entry of entries) {
    installed.set(entry, await install(plugin, network, entry))
  }
  let changed = false
  for (const entry of entries) {
    const before = entry.previousCookies?.length ?? 0
    await deletePrevious(plugin, network, entry, installed.get(entry))
    if ((entry.previousCookies?.length ?? 0) !== before) {
      changed = true
    }
  }
  return changed ? store.save(network, list) : network
}

// Deletes every flow of an entry leaving the list: its cookie, its previous ones,
// and the cookie-0 flows of its match. Only an older XO can have installed those
// (from a VIF copy, after a downgrade), and they would apply as soon as this entry
// stops shadowing them.
//
// Throws, leaving everything in place, when the current flows could not be deleted
// on any host: the caller then keeps the entry, and the user can retry.
export async function remove({ network, entry, plugin }) {
  const hosts = hostsOf(network)
  const outcomes = await plugin.deleteCookie(network, entry, entry.cookie, hosts)
  const errors = [...outcomes.values()].filter(error => error !== undefined)
  if (hosts.length !== 0 && errors.length === hosts.length) {
    throw errors[0]
  }
  logFailures(outcomes, 'traffic rule flows not deleted on this host', { network: network.uuid, cookie: entry.cookie })
  for (const cookie of entry.previousCookies ?? []) {
    if (cookie !== LEGACY_COOKIE) {
      logFailures(
        await plugin.deleteCookie(network, entry, cookie, hosts),
        'traffic rule flows not deleted on this host',
        {
          network: network.uuid,
          cookie,
        }
      )
    }
  }
  logFailures(
    await plugin.deleteLegacy(network, entry, hosts),
    'legacy flows of a traffic rule not deleted on this host',
    {
      network: network.uuid,
    }
  )
}
