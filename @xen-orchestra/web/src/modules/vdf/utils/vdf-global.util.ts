import {
  VDF_GLOBAL_PREFIX,
  VDF_GLOBAL_RULE_BASE,
  VDF_GLOBAL_SCOPE,
  VDF_LAST_RESERVED_TIER,
  type VdfDocument,
  type VdfGlobalScope,
  type VdfPublishedPolicy,
  type VdfScopeId,
} from '@/modules/vdf/types.ts'
import type { RouteLocationRaw } from 'vue-router'

export function isGlobalName(name: string | undefined) {
  return name?.startsWith(VDF_GLOBAL_PREFIX) ?? false
}

// how a pool document's `global:x` reads in the UI: x, with a global badge
export function displayName(name: string) {
  return isGlobalName(name) ? name.slice(VDF_GLOBAL_PREFIX.length) : name
}

// a rule id as the global configuration writes it
export function globalRuleId(id: number) {
  return id >= VDF_GLOBAL_RULE_BASE ? id - VDF_GLOBAL_RULE_BASE : id
}

// A rule's number as shown: a global (XO-wide) rule's with a G (in a
// pool's document, the ids from VDF_GLOBAL_RULE_BASE up; in the global
// configuration, all of them: `global`), a pool rule's with # (G10, #10)
export function ruleNumber(id: number, { global = false }: { global?: boolean } = {}) {
  return id >= VDF_GLOBAL_RULE_BASE || global ? `G${globalRuleId(id)}` : `#${id}`
}

// group names as lists and selects order them: the pool's own first, then
// the global ones, by name in each (a global group may share a pool
// group's name)
export const byOwnThenGlobal = (nameA: string, nameB: string) =>
  Number(isGlobalName(nameA)) - Number(isGlobalName(nameB)) || displayName(nameA).localeCompare(displayName(nameB))

export function isGlobalScope(scopeId: VdfScopeId) {
  return scopeId === VDF_GLOBAL_SCOPE
}

export function inGlobalScope(scope: VdfGlobalScope | undefined, poolId: string) {
  return scope?.all === true || (scope?.pools ?? []).includes(poolId)
}

// A pool the global configuration applies to (this XO's, or another XO's
// it holds) keeps the tiers up to securityops for global policies (vdf#21)
export function reservesTiers(global: VdfPublishedPolicy['global'] | undefined) {
  return global !== undefined && (global.inScope || global.owner !== undefined)
}

export function isReservedTier(value: number) {
  return value <= VDF_LAST_RESERVED_TIER
}

// A pool document as the pool's UI edits it: its own part from `local`,
// the global part as currently published (XO rewrites it on every publish
// anyway, so a draft never carries a stale copy of it).
export function withGlobalOf(local: VdfDocument, published: VdfDocument): VdfDocument {
  const groups = Object.fromEntries([
    ...Object.entries(published.groups).filter(([name]) => isGlobalName(name)),
    ...Object.entries(local.groups).filter(([name]) => !isGlobalName(name)),
  ])

  return {
    ...local,
    groups,
    policies: [
      ...published.policies.filter(policy => isGlobalName(policy.name)),
      ...local.policies.filter(policy => !isGlobalName(policy.name)),
    ],
  }
}

// A pool's document once the global configuration is written into it, as
// xo-server-vdf global.mjs compose() writes it: global groups and policies
// under their `global:` names, first, rule ids from VDF_GLOBAL_RULE_BASE
// up, then the pool's own part. The members XO adds from the other pools
// are left out.
export function composeWithGlobal(own: VdfDocument, global: VdfDocument): VdfDocument {
  const prefixed = (name: string) => VDF_GLOBAL_PREFIX + name
  const peer = (name: string | undefined) => (name === undefined || name === 'any' ? name : prefixed(name))

  return {
    ...own,
    groups: {
      ...Object.fromEntries(Object.entries(global.groups).map(([name, group]) => [prefixed(name), group])),
      ...Object.fromEntries(Object.entries(own.groups).filter(([name]) => !isGlobalName(name))),
    },
    policies: [
      ...global.policies.map(policy => ({
        ...policy,
        name: prefixed(policy.name),
        appliedTo: prefixed(policy.appliedTo),
        ingress: policy.ingress.map(rule => ({ ...rule, id: VDF_GLOBAL_RULE_BASE + rule.id, from: peer(rule.from) })),
        ...(policy.egress === undefined
          ? {}
          : {
              egress: policy.egress.map(rule => ({ ...rule, id: VDF_GLOBAL_RULE_BASE + rule.id, to: peer(rule.to) })),
            }),
      })),
      ...own.policies.filter(policy => !isGlobalName(policy.name)),
    ],
  }
}

// Where each global policy applies (vdf#47): per pool, the VMs its group
// holds there (vmCount); pools where it holds none are left out
export type VdfPolicyReach = { policy: string; pools: { id: string; name: string; vms: number }[] }

export function policyReach(
  document: VdfDocument,
  pools: { id: string; name: string }[],
  vmCount: (group: string, poolId: string) => number
): VdfPolicyReach[] {
  return document.policies.map(policy => ({
    policy: policy.name,
    pools: pools
      .map(pool => ({ id: pool.id, name: pool.name, vms: vmCount(policy.appliedTo, pool.id) }))
      .filter(pool => pool.vms > 0),
  }))
}

type VdfPage = 'groups' | 'policies'

// A scope's page for a group or a policy. In a pool, global objects are
// shown there too (read-only, under their full `global:` name); the
// XO-wide pages name them without the prefix, and number their rules as
// the global configuration does.
export function vdfPageRoute(
  scopeId: VdfScopeId,
  page: VdfPage,
  query: { group?: string; policy?: string; rule?: number } = {}
): RouteLocationRaw {
  const toGlobal = isGlobalScope(scopeId)
  const name = (value: string) => (toGlobal ? displayName(value) : value)
  const routeQuery: Record<string, string> = {}

  if (query.group !== undefined) {
    routeQuery.group = name(query.group)
  }

  if (query.policy !== undefined) {
    routeQuery.policy = name(query.policy)
  }

  if (query.rule !== undefined) {
    routeQuery.rule = String(toGlobal ? globalRuleId(query.rule) : query.rule)
  }

  if (toGlobal) {
    return { name: `/(site)/firewall/${page}`, query: routeQuery } as RouteLocationRaw
  }

  return { name: `/pool/[id]/firewall/${page}`, params: { id: scopeId }, query: routeQuery } as RouteLocationRaw
}

// where a global object is edited
// "Allow this flow…": the policies page's rule drawer, prefilled, in the
// policy that dropped it (a global one in the global firewall): from the
// source (egress: to the destination), an address the drawer offers to
// make a group of, or a group
export function allowFlowRoute(
  poolId: string,
  {
    policy,
    egress = false,
    peer,
    proto,
    port,
  }: { policy: string; egress?: boolean; peer: string; proto: string; port?: string }
): RouteLocationRaw {
  const isGlobal = isGlobalName(policy)
  const route = vdfPageRoute(isGlobal ? VDF_GLOBAL_SCOPE : poolId, 'policies', { policy }) as {
    query: Record<string, string>
  }

  return {
    ...route,
    query: {
      ...route.query,
      newRule: '1',
      [egress ? 'to' : 'from']: isGlobal && isGlobalName(peer) ? displayName(peer) : peer,
      proto,
      port: port === undefined || port === '' ? undefined : port,
    },
  } as RouteLocationRaw
}

export function vdfGlobalRoute(page: VdfPage, query: { group?: string; policy?: string; rule?: number } = {}) {
  return vdfPageRoute(VDF_GLOBAL_SCOPE, page, query)
}
