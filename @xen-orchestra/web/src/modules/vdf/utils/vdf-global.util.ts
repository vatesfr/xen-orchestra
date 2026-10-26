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
export function vdfGlobalRoute(page: VdfPage, query: { group?: string; policy?: string; rule?: number } = {}) {
  return vdfPageRoute(VDF_GLOBAL_SCOPE, page, query)
}
