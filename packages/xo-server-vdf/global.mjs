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
// first.

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
    for (const rule of policy.ingress ?? []) {
      if (!(rule.id > 0 && rule.id < GLOBAL_RULE_BASE)) {
        errors.push(`policy "${policy.name}" rule ${rule.id}: global rule ids must be 1..${GLOBAL_RULE_BASE - 1}`)
      }
    }
  }
  return errors
}

// Errors in a pool's own part: ids XO keeps for the global rules.
export function checkLocalDocument(document) {
  const errors = []
  for (const policy of localPart(document).policies) {
    for (const rule of policy.ingress ?? []) {
      if (rule.id >= GLOBAL_RULE_BASE) {
        errors.push(
          `policy "${policy.name}" rule ${rule.id}: ids from ${GLOBAL_RULE_BASE} up are kept for global rules`
        )
      }
    }
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
    for (const policy of global.policies ?? []) {
      policies.push({
        ...policy,
        name: globalName(policy.name),
        appliedTo: globalName(policy.appliedTo),
        ingress: (policy.ingress ?? []).map(rule => ({
          ...rule,
          id: GLOBAL_RULE_BASE + rule.id,
          from: rule.from === 'any' ? 'any' : globalName(rule.from),
        })),
      })
    }
  }
  return { ...own, groups: { ...groups, ...own.groups }, policies: [...policies, ...own.policies] }
}

export const serialize = document => JSON.stringify(document, null, 2)

// key order doesn't matter when comparing documents
function canonical(value) {
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

// A VM's IPs as agents count them for group membership
// (agent/inventory.go): a locked VIF's allowed addresses are authoritative
// (trusted), else what the guest reports; IPv6 link-local left out.
export function vmIps(vm, vifs) {
  const locked = vifs.filter(vif => vif.lockingMode === 'locked')
  const trusted = locked.length > 0
  const raw = trusted
    ? locked.flatMap(vif => [...(vif.allowedIpv4Addresses ?? []), ...(vif.allowedIpv6Addresses ?? [])])
    : Object.values(vm.addresses ?? {})
  const ips = [...new Set(raw.filter(ip => typeof ip === 'string' && !ip.includes('/') && !/^fe80:/i.test(ip)))]
  return { ips: ips.sort(), trusted }
}

// what XO knows of a running VM, enough to resolve global groups and to
// spot an address held twice; kept for a pool XO can't reach (fail static)
export const vmRecord = (vm, vifs) => ({
  vm: vm.id,
  vmName: vm.name_label,
  pool: vm.$pool,
  tags: vm.tags,
  ...vmIps(vm, vifs),
})

export const runningVmRecords = (vms, vifsOf) =>
  vms.filter(vm => vm.power_state === 'Running').map(vm => vmRecord(vm, vifsOf(vm)))

const isMember = (record, group) => (group.tags ?? []).length > 0 && group.tags.every(tag => record.tags.includes(tag))

// Members of each global group, in every pool in scope: running VMs
// carrying all the group's tags, with their IPs.
export function globalMembers({ global, records, scope }) {
  const members = {}
  for (const [name, group] of Object.entries(global?.groups ?? {})) {
    members[name] = records
      .filter(record => inScope(scope, record.pool) && isMember(record, group))
      .map(({ tags, ...member }) => member)
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
