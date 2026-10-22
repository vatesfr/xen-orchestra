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
  const hasGlobal = Object.keys(actual.groups).length > 0 || actual.policies.length > 0
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

const isMember = (vm, group) => (group.tags ?? []).length > 0 && group.tags.every(tag => vm.tags.includes(tag))

// Members of each global group, in every pool in scope: running VMs
// carrying all the group's tags, with their IPs.
export function globalMembers({ global, vms, vifsOf, scope }) {
  const members = {}
  for (const [name, group] of Object.entries(global?.groups ?? {})) {
    members[name] = vms
      .filter(vm => vm.power_state === 'Running' && inScope(scope, vm.$pool) && isMember(vm, group))
      .map(vm => ({ vm: vm.id, vmName: vm.name_label, pool: vm.$pool, ...vmIps(vm, vifsOf(vm)) }))
  }
  return members
}

// For one pool: per global group, the IPs of its members in the other pools
// (its own members are resolved by its agents, from the tags).
export function remoteIpsFor(poolId, members) {
  return Object.fromEntries(
    Object.entries(members).map(([name, list]) => [
      name,
      [...new Set(list.filter(member => member.pool !== poolId).flatMap(member => member.ips))].sort(),
    ])
  )
}
