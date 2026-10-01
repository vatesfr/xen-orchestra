import { randomBytes } from 'crypto'

// =============================================================================

// Every flow XO installed before the ordered list sits at the OVS default
// priority: XO never sent one, so overlapping rules had no defined precedence.
export const LEGACY_PRIORITY = 32768

// A network's ordered list always lives in one of these bands. A rewrite
// (reorder, migration, full band) moves the whole list to the other band, so its
// new flows never share a priority with the flows they replace: OpenFlow leaves
// the winner undefined between two overlapping flows of the same priority.
//
// Both bands are above LEGACY_PRIORITY, so a legacy flow left behind can never
// override a rule of the list for the packets that rule matches. 65000 keeps
// headroom below 65535, and 35001 stays far above XAPI's VIF-locking flows
// (priorities 4000 to 8000, ocaml/xenopsd/scripts/setup-vif-rules in xen-api).
export const BANDS = [
  { top: 65000, bottom: 50001 },
  { top: 50000, bottom: 35001 },
]

// In `previousCookies`, the flows an entry had before the ordered list: the
// plugin's default cookie, which a delete by fields reaches, since a delete by
// cookie 0 would hit every legacy flow of the bridge.
export const LEGACY_COOKIE = '0x0'

// The plugin's default cookie, carried by every legacy flow
const DEFAULT_COOKIE = '0x0000000000000000'

// The cookie of XAPI's VIF-locking flows (ocaml/xenopsd/scripts/setup-vif-rules
// in xen-api): deleting it would drop the anti-spoofing rules of every locked VIF
// on the bridge.
const XAPI_LOCKING_COOKIE = '0x0000000000000001'

// =============================================================================

// The fields that define a rule, normalized: XO 6 sends `TCP` and a numeric port,
// XO 5 and xo-cli `tcp`, the channel migration script a port of any type. The
// protocol keeps its case for display and is compared without it.
export function toEntryFields({ mac, allow, protocol, port, ipRange = '', direction }) {
  return {
    ...(mac != null && { mac: mac.toLowerCase() }),
    allow,
    protocol,
    ...(port != null && port !== '' && { port: Number(port) }),
    ipRange,
    direction,
  }
}

function portOf(rule) {
  return rule.port == null || rule.port === '' ? undefined : Number(rule.port)
}

// Same VIF (by MAC), or both network-wide
export function sameTarget(a, b) {
  return a.mac?.toLowerCase() === b.mac?.toLowerCase()
}

// Same OpenFlow match on the same target: what OVS sees as one rule, whatever
// its action
export function sameMatch(a, b) {
  return (
    sameTarget(a, b) &&
    a.direction === b.direction &&
    (a.ipRange ?? '') === (b.ipRange ?? '') &&
    portOf(a) === portOf(b) &&
    a.protocol.toLowerCase() === b.protocol.toLowerCase()
  )
}

// Same match and same action: how the REST API identifies a rule
export function sameRule(a, b) {
  return sameMatch(a, b) && a.allow === b.allow
}

// A random 64-bit cookie that is neither the plugin's default nor XAPI's, nor in
// `usedCookies`. `random` is injectable for the tests.
export function generateCookie(usedCookies = new Set(), random = () => randomBytes(8)) {
  let cookie
  do {
    cookie = '0x' + random().toString('hex')
  } while (cookie === DEFAULT_COOKIE || cookie === XAPI_LOCKING_COOKIE || usedCookies.has(cookie))
  return cookie
}

// The index of the band holding `priority`, -1 when none does (legacy flows)
export function bandOf(priority) {
  return BANDS.findIndex(band => priority <= band.top && priority >= band.bottom)
}

// The priority of a rule appended at the bottom of the list, or undefined when
// the list's band is full and the list has to be rewritten into the other band
export function appendPriority(entries) {
  if (entries.length === 0) {
    return BANDS[0].top
  }
  const lowest = Math.min(...entries.map(entry => entry.priority))
  const band = BANDS[bandOf(lowest)]
  return band === undefined || lowest - 1 < band.bottom ? undefined : lowest - 1
}

// Plans the rewrite of a whole list, in the order of `entries`, into the band the
// list does not use (the HIGH one when no entry has a priority yet: legacy rules
// or a first rule). Each entry gets its new priority and a fresh cookie, and its
// current cookie joins its previous ones, whose flows the engine deletes once
// the new flows are in place.
//
// `deleteOrder` holds the entries with flows to delete, from the lowest old
// priority up. When the new band is below the old one, the old flows left at any
// moment are then the top of the old list: a packet either still meets the rule
// that decided it before, or falls through to the complete new list.
export function planRewrite(entries) {
  const priorities = entries.map(entry => entry.priority).filter(priority => priority !== undefined)
  const currentBand = priorities.length === 0 ? -1 : bandOf(Math.max(...priorities))
  const band = BANDS[currentBand === 0 ? 1 : 0]
  const size = band.top - band.bottom + 1
  if (entries.length > size) {
    throw new Error(`a network cannot hold more than ${size} traffic rules`)
  }

  const usedCookies = new Set(entries.flatMap(entry => [entry.cookie, ...(entry.previousCookies ?? [])]))
  const planned = entries.map((entry, index) => {
    const previousCookies = [entry.cookie, ...(entry.previousCookies ?? [])].filter(cookie => cookie !== undefined)
    const cookie = generateCookie(usedCookies)
    usedCookies.add(cookie)
    return {
      ...toEntryFields(entry),
      priority: band.top - index,
      cookie,
      ...(previousCookies.length !== 0 && { previousCookies }),
    }
  })

  const deleteOrder = planned
    .map((entry, index) => ({ entry, oldPriority: entries[index].priority ?? LEGACY_PRIORITY }))
    .filter(({ entry }) => entry.previousCookies !== undefined)
    .sort((a, b) => a.oldPriority - b.oldPriority)
    .map(({ entry }) => entry)

  return { entries: planned, deleteOrder }
}

// The list stored on a network, or undefined when the network does not use the
// ordered list yet
export function parseList(raw) {
  return raw === undefined ? undefined : JSON.parse(raw)
}

// What a VIF keeps in `xo:sdn-controller:of-rules` once its network uses the
// ordered list: its rules in the legacy format and in the list's order, for XO 5
// and for an older XO after a downgrade. The same fields, in the same order, as
// the legacy `_addRule` writes them. `null` removes the key.
export function serializeCopy(entries, mac) {
  const rules = entries
    .filter(entry => entry.mac === mac)
    .map(({ allow, protocol, port, ipRange, direction }) =>
      JSON.stringify({ allow, protocol, port, ipRange, direction })
    )
  return rules.length === 0 ? null : JSON.stringify(rules)
}
