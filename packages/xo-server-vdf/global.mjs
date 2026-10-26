// XO-wide firewall configuration: groups and policies XO writes into every
// pool in scope, next to the pool's own. Agents never see XO, only their
// pool's document, so a pool keeps enforcing its last document whatever
// happens to XO or to the other pools.
//
// In a pool's document, XO owns every group and policy named `global:*`
// (the agent rejects unknown fields, so names carry the origin) and rule
// ids from GLOBAL_RULE_BASE up (ids must be unique in a document). Global
// policies come first: agents take a tier's policies in document order, so
// in a tier shared with the pool's own policies, the global rules match
// first; the earliest tiers are the global configuration's alone
// (RESERVED_TIERS), so no pool policy comes before them.

export const GLOBAL_PREFIX = 'global:'

// below the agent's tier-default observation points (0xff000000)
export const GLOBAL_RULE_BASE = 0x800000

export const isGlobalName = name => typeof name === 'string' && name.startsWith(GLOBAL_PREFIX)

const globalName = name => GLOBAL_PREFIX + name

export const emptyDocument = () => ({ groups: {}, policies: [] })

// what the pool owns in its document: everything XO didn't write there
export function localPart(document) {
  if (document == null) {
    return emptyDocument()
  }
  const { groups = {}, policies = [], ...rest } = document
  return {
    ...rest,
    groups: Object.fromEntries(Object.entries(groups).filter(([name]) => !isGlobalName(name))),
    policies: policies.filter(policy => !isGlobalName(policy.name)),
  }
}

// what XO wrote in a pool's document
export function globalPart(document) {
  const { groups = {}, policies = [] } = document ?? {}
  return {
    groups: Object.fromEntries(Object.entries(groups).filter(([name]) => isGlobalName(name))),
    policies: policies.filter(policy => isGlobalName(policy.name)),
  }
}

// a policy's rules, ingress and egress (vdf#53)
const allRules = policy => [...(policy.ingress ?? []), ...(policy.egress ?? [])]

// Errors XO reports before asking any agent: names and ids that would
// collide once the global configuration is written into a pool.
export function checkGlobalDocument(document) {
  const errors = []
  for (const name of Object.keys(document.groups ?? {})) {
    if (isGlobalName(name)) {
      errors.push(`group "${name}": global names are written without the "${GLOBAL_PREFIX}" prefix`)
    }
  }
  for (const policy of document.policies ?? []) {
    if (isGlobalName(policy.name)) {
      errors.push(`policy "${policy.name}": global names are written without the "${GLOBAL_PREFIX}" prefix`)
    }
    for (const rule of allRules(policy)) {
      if (!(rule.id > 0 && rule.id < GLOBAL_RULE_BASE)) {
        errors.push(`policy "${policy.name}" rule ${rule.id}: global rule ids must be 1..${GLOBAL_RULE_BASE - 1}`)
      }
    }
  }
  return errors
}

// Tiers are evaluated in order, whoever wrote the policies in them: a
// pool's own allow in an earlier tier would decide before a global drop
// (vdf#21). In a pool the global configuration applies to, the emergency
// and securityops tiers are therefore kept for global policies, so that a
// global policy in an earlier or the same tier always wins. A numbered tier
// up to securityops would come first too. Pools out of scope keep every
// tier, and global policies may use any.
export const RESERVED_TIERS = ['emergency', 'securityops']

// the agent's named tiers (agent/policy.go tierNames)
const TIER_VALUES = { emergency: 0, securityops: 25, networkops: 50, platform: 75, application: 100, baseline: 110 }

export const LAST_RESERVED_TIER = TIER_VALUES.securityops

// a policy's tier as a number: application when absent, undefined for a
// name the agent doesn't know (it reports it)
export function tierNumber(tier) {
  if (tier === undefined) {
    return TIER_VALUES.application
  }
  return typeof tier === 'number' ? tier : TIER_VALUES[tier]
}

const inReservedTier = policy => {
  const tier = tierNumber(policy.tier)
  return tier !== undefined && tier <= LAST_RESERVED_TIER
}

// the pool's own policies in a tier kept for global policies
export const reservedTierPolicies = document =>
  localPart(document)
    .policies.filter(inReservedTier)
    .map(policy => policy.name)

// "a", "b": the pool's own policies to move before it can publish
export const reservedTiersError = names =>
  `the global configuration applies to this pool, where the tiers up to securityops are kept for global policies: move ${names.map(name => `"${name}"`).join(', ')} to networkops or a later tier`

// Errors in a pool's own part: ids XO keeps for the global rules, and, in
// a pool the global configuration applies to (globalScope), the tiers kept
// for global policies.
export function checkLocalDocument(document, { globalScope = false } = {}) {
  const errors = []
  for (const policy of localPart(document).policies) {
    for (const rule of allRules(policy)) {
      if (rule.id >= GLOBAL_RULE_BASE) {
        errors.push(
          `policy "${policy.name}" rule ${rule.id}: ids from ${GLOBAL_RULE_BASE} up are kept for global rules`
        )
      }
    }
  }
  const reserved = globalScope ? reservedTierPolicies(document) : []
  if (reserved.length > 0) {
    errors.push(reservedTiersError(reserved))
  }
  return errors
}

// A pool's document: XO's global configuration (when the pool is in
// scope), then the pool's own part. remoteIps adds, per global group, the
// IPs of its members in the other pools in scope: agents resolve tags in
// their own pool only.
export function compose(local, global, remoteIps = {}) {
  const own = localPart(local)
  const groups = {}
  const policies = []
  if (global != null) {
    for (const [name, group] of Object.entries(global.groups ?? {})) {
      const ips = [...new Set([...(group.ips ?? []), ...(remoteIps[name] ?? [])])].sort()
      groups[globalName(name)] = { ...group, ips }
    }
    const peer = name => (name === 'any' ? 'any' : globalName(name))
    for (const policy of global.policies ?? []) {
      const composed = {
        ...policy,
        name: globalName(policy.name),
        appliedTo: globalName(policy.appliedTo),
        ingress: (policy.ingress ?? []).map(rule => ({
          ...rule,
          id: GLOBAL_RULE_BASE + rule.id,
          from: peer(rule.from),
        })),
      }
      // egress rules (vdf#53): their destinations
      if (policy.egress !== undefined) {
        composed.egress = policy.egress.map(rule => ({ ...rule, id: GLOBAL_RULE_BASE + rule.id, to: peer(rule.to) }))
      }
      policies.push(composed)
    }
  }
  return withFormatVersion({ ...own, groups: { ...groups, ...own.groups }, policies: [...policies, ...own.policies] })
}

// version 4 when a policy (global or the pool's own) is in monitor mode:
// agents before monitor mode must reject the document (vdf#13); without a
// version 4 nothing needs any more
// version 7 when a group is scoped to networks (vdf#36): agents before
// them must reject the document rather than widen the groups
export function withFormatVersion(document) {
  const required = Math.max(
    document.policies.some(policy => policy.mode === 'monitor') ? 4 : 0,
    Object.values(document.groups ?? {}).some(group => (group.networks ?? []).length > 0) ? 7 : 0
  )
  const managed = document.version === undefined || document.version === 4 || document.version === 7
  if (required > 0) {
    return { ...document, version: managed ? required : Math.max(document.version, required) }
  }
  if (document.version !== undefined && managed) {
    const { version: _, ...rest } = document
    return rest
  }
  return document
}

export const serialize = document => JSON.stringify(document, null, 2)

// key order doesn't matter when comparing documents
export function canonical(value) {
  if (Array.isArray(value)) {
    return value.map(canonical)
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, canonical(value[key])])
    )
  }
  return value
}

export const sameDocument = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))

// in-sync: the pool enforces what XO's global configuration says, remote
// members included; behind: it enforces something else (a pool that was
// unreachable at publish, members that changed, an edit made outside XO);
// not-published: no global part at all yet; out-of-scope: XO has nothing
// to write there (stale-global: but an old global part is still there).
export function poolSyncState({ inScope, published, expected }) {
  const actual = globalPart(published)
  const hasGlobal = hasGlobalPart(published)
  if (!inScope) {
    return hasGlobal ? 'stale-global' : 'out-of-scope'
  }
  if (sameDocument(actual, globalPart(expected))) {
    return 'in-sync'
  }
  return hasGlobal ? 'behind' : 'not-published'
}

export const inScope = (scope, poolId) => scope?.all === true || (scope?.pools ?? []).includes(poolId)

const usableIp = ip => typeof ip === 'string' && !ip.includes('/') && !/^fe80:/i.test(ip)

const sortedIps = ips => [...new Set(ips.filter(usableIp))].sort()

// A VM's interfaces as agents see them (agent/inventory.go vmIfaces,
// vdf#36): each VIF with its network's tags and its own addresses, a
// locked VIF's allowed ones (trusted), else what the guest reports for its
// device ("N/ipv4/0"…, untrusted); addresses of no known VIF on no network.
// networkOf: a VIF's network object, if XO knows it.
export function vmIfaces(vm, vifs, networkOf = () => undefined) {
  const reported = new Map()
  for (const [key, ip] of Object.entries(vm.addresses ?? {})) {
    const device = key.split('/')[0]
    reported.set(device, [...(reported.get(device) ?? []), ip])
  }
  const ifaces = vifs.map(vif => {
    const network = networkOf(vif)
    // a network's default is unlocked or disabled, never locked
    const locked = vif.lockingMode === 'locked'
    return {
      device: String(vif.device),
      network: vif.$network,
      netTags: network?.tags ?? [],
      ips: sortedIps(
        locked
          ? [...(vif.allowedIpv4Addresses ?? []), ...(vif.allowedIpv6Addresses ?? [])]
          : (reported.get(String(vif.device)) ?? [])
      ),
      trusted: locked,
    }
  })
  const known = new Set(ifaces.map(iface => iface.device))
  for (const [device, ips] of reported) {
    if (!known.has(device)) {
      ifaces.push({ device, network: undefined, netTags: [], ips: sortedIps(ips), trusted: false })
    }
  }
  return ifaces.sort((a, b) => (a.device < b.device ? -1 : a.device > b.device ? 1 : 0))
}

// What a set of interfaces adds up to: their addresses, trusted when one
// is locked and none has addresses from the guest (agent: ifaceAddrs).
function ifaceIps(ifaces) {
  return {
    ips: sortedIps(ifaces.flatMap(iface => iface.ips)),
    trusted: ifaces.some(iface => iface.trusted) && !ifaces.some(iface => !iface.trusted && iface.ips.length > 0),
  }
}

// A VM's IPs as agents count them for a group without networks: all its
// interfaces'.
export const vmIps = (vm, vifs, networkOf) => ifaceIps(vmIfaces(vm, vifs, networkOf))

// what XO knows of a running VM, enough to resolve global groups and to
// spot an address held twice; kept for a pool XO can't reach (fail static)
export function vmRecord(vm, vifs, networkOf) {
  const ifaces = vmIfaces(vm, vifs, networkOf)
  return {
    vm: vm.id,
    vmName: vm.name_label,
    pool: vm.$pool,
    tags: vm.tags,
    ...ifaceIps(ifaces),
    ifaces,
  }
}

export const runningVmRecords = (vms, vifsOf, networkOf) =>
  vms.filter(vm => vm.power_state === 'Running').map(vm => vmRecord(vm, vifsOf(vm), networkOf))

const isMember = (record, group) => (group.tags ?? []).length > 0 && group.tags.every(tag => record.tags.includes(tag))

// a member's addresses as a group sees them: all, or with networks those
// of its interfaces on a network carrying them all (a record saved before
// interfaces were known has none there)
function memberIps(record, group) {
  const networks = group.networks ?? []
  if (networks.length === 0) {
    return { ips: record.ips, trusted: record.trusted }
  }
  const ifaces = (record.ifaces ?? []).filter(iface => networks.every(tag => iface.netTags.includes(tag)))
  return ifaces.length === 0 ? undefined : ifaceIps(ifaces)
}

// Members of each global group, in every pool in scope: running VMs
// carrying all the group's tags, with their IPs (on the group's networks).
export function globalMembers({ global, records, scope }) {
  const members = {}
  for (const [name, group] of Object.entries(global?.groups ?? {})) {
    members[name] = records
      .filter(record => inScope(scope, record.pool) && isMember(record, group))
      .flatMap(({ tags, ifaces, ...member }) => {
        const scoped = memberIps({ ...member, ifaces }, group)
        return scoped === undefined ? [] : [{ ...member, ...scoped }]
      })
  }
  return members
}

// IPs held by more than one running VM, whatever their pool
export function duplicateAddresses(records) {
  const holders = new Map()
  for (const record of records) {
    for (const ip of record.ips) {
      holders.set(ip, [...(holders.get(ip) ?? []), record])
    }
  }
  return new Map(
    [...holders]
      .filter(([, list]) => new Set(list.map(record => record.vm)).size > 1)
      .sort(([a], [b]) => (a < b ? -1 : 1))
  )
}

const vmRef = ({ vm, vmName, pool }) => ({ vm, vmName, pool })

// A member's IP that another VM holds too (reused by DHCP, a clone, a
// guest that set it): other pools can't tell the two apart, so it's left out
// of the remote IPs at once, instead of letting the other VM in as a member
// (approach notes §10.6).
export function memberConflicts(members, duplicates) {
  const conflicts = []
  for (const [group, list] of Object.entries(members)) {
    const memberIds = new Set(list.map(member => member.vm))
    for (const member of list) {
      for (const ip of member.ips) {
        const others = (duplicates.get(ip) ?? []).filter(record => !memberIds.has(record.vm))
        if (others.length > 0) {
          conflicts.push({ group, ip, member: vmRef(member), holders: others.map(vmRef) })
        }
      }
    }
  }
  return conflicts
}

// Members across pools only make sense if the pools share a routed address
// space: the same IP on VMs of two pools in scope says they may not (two
// private networks numbered alike), or that an address is used twice.
export function addressOverlaps(duplicates, scope) {
  const overlaps = []
  for (const [ip, holders] of duplicates) {
    const inScopeHolders = holders.filter(record => inScope(scope, record.pool))
    if (new Set(inScopeHolders.map(record => record.pool)).size > 1) {
      overlaps.push({ ip, holders: inScopeHolders.map(vmRef) })
    }
  }
  return overlaps
}

// For one pool: per global group, the IPs of its members in the other pools
// (its own members are resolved by its agents, from the tags), without the
// IPs another VM holds too.
export function remoteIpsFor(poolId, members, conflicts = []) {
  const excluded = new Set(conflicts.map(({ group, ip }) => `${group}\x00${ip}`))
  return Object.fromEntries(
    Object.entries(members).map(([name, list]) => [
      name,
      [
        ...new Set(
          list
            .filter(member => member.pool !== poolId)
            .flatMap(member => member.ips)
            .filter(ip => !excluded.has(`${name}\x00${ip}`))
        ),
      ].sort(),
    ])
  )
}

// A pool takes the global configuration of one XO only: the first one to
// write a global part there records itself in the pool's other_config, and
// the others leave that pool's global part alone until an administrator
// takes the pool over.
export const OWNER_KEY = 'vdf:global.owner'

export function poolOwner(otherConfig) {
  try {
    const owner = JSON.parse(otherConfig?.[OWNER_KEY] ?? '')
    return typeof owner?.id === 'string' ? owner : undefined
  } catch {
    return undefined
  }
}

// a pool's own part with the global part it already holds: what XO
// publishes for a pool another XO owns
export function keepGlobalPart(local, published) {
  const own = localPart(local)
  const global = globalPart(published)
  return { ...own, groups: { ...global.groups, ...own.groups }, policies: [...global.policies, ...own.policies] }
}

export function hasGlobalPart(document) {
  const { groups, policies } = globalPart(document)
  return Object.keys(groups).length > 0 || policies.length > 0
}
