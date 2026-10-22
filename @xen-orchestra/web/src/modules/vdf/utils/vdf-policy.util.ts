import {
  VDF_APPLICATION_TIER,
  VDF_GLOBAL_RULE_BASE,
  VDF_TIERS,
  type VdfDefaultAction,
  type VdfDocument,
  type VdfGroup,
  type VdfPolicy,
  type VdfRule,
  type VdfRuleAction,
  type VdfTierName,
} from '@/modules/vdf/types.ts'
import { isEqual, omit } from 'lodash-es'

export function tierValue(tier: VdfPolicy['tier']): number {
  if (tier === undefined) {
    return VDF_APPLICATION_TIER
  }

  if (typeof tier === 'number') {
    return tier
  }

  return VDF_TIERS.find(({ name }) => name === tier)?.value ?? VDF_APPLICATION_TIER
}

export function tierName(value: number): VdfTierName | undefined {
  return VDF_TIERS.find(tier => tier.value === value)?.name
}

// Policies are written with a tier name, or without one for application:
// a name makes the document a version 3 one, which only current agents read.
export function toTierRef(value: number): VdfPolicy['tier'] {
  if (value === VDF_APPLICATION_TIER) {
    return undefined
  }

  return tierName(value) ?? value
}

export function ruleAction(rule: VdfRule): VdfRuleAction {
  return rule.action ?? 'allow'
}

export function formatPorts(ports: number[] | undefined) {
  return ports === undefined || ports.length === 0 ? '' : ports.join(', ')
}

export function parsePorts(text: string): number[] | undefined {
  const ports = text
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)

  if (ports.some(port => !Number.isInteger(port) || port < 1 || port > 65535)) {
    return undefined
  }

  return [...new Set(ports)]
}

export type VdfTierPolicies = {
  value: number
  name: VdfTierName | undefined
  policies: { policy: VdfPolicy; index: number }[]
}

// Evaluation order: tier by tier, document order within a tier
export function policiesByTier(document: VdfDocument): VdfTierPolicies[] {
  const tiers = new Map<number, VdfTierPolicies>()

  document.policies.forEach((policy, index) => {
    const value = tierValue(policy.tier)
    let tier = tiers.get(value)

    if (tier === undefined) {
      tier = { value, name: tierName(value), policies: [] }
      tiers.set(value, tier)
    }

    tier.policies.push({ policy, index })
  })

  return [...tiers.values()].sort((tierA, tierB) => tierA.value - tierB.value)
}

// For the VIFs a tier's policies apply to, no matching rule means: drop if
// one of them says drop, else allow if one says allow, else on to the next
// tier (agent/policy.go)
export function tierDefault(policies: VdfPolicy[]): VdfDefaultAction {
  if (policies.some(policy => policy.default === 'drop')) {
    return 'drop'
  }

  if (policies.some(policy => policy.default === 'allow')) {
    return 'allow'
  }

  return 'pass'
}

// ids from VDF_GLOBAL_RULE_BASE up belong to the global configuration
export function nextRuleId(document: VdfDocument) {
  const ids = document.policies
    .flatMap(policy => policy.ingress.map(rule => rule.id))
    .filter(id => id < VDF_GLOBAL_RULE_BASE)

  return ids.length === 0 ? 1 : Math.max(...ids) + 1
}

export function emptyDocument(): VdfDocument {
  return { groups: {}, policies: [] }
}

// documents are JSON, and often reactive proxies, which structuredClone refuses
export function cloneDocument(document: VdfDocument): VdfDocument {
  return JSON.parse(JSON.stringify(document))
}

export function serializeDocument(document: VdfDocument) {
  return JSON.stringify(document, null, 2)
}

// A VM is in a group when it carries all the group's tags; IPs are static
// members (external hosts). A group without tags has no VM members.
export function isVmInGroup(vmTags: string[], group: VdfGroup | undefined) {
  const tags = group?.tags ?? []

  return tags.length > 0 && tags.every(tag => vmTags.includes(tag))
}

export function vmGroupNames(vmTags: string[], document: VdfDocument) {
  return Object.entries(document.groups)
    .filter(([, group]) => isVmInGroup(vmTags, group))
    .map(([name]) => name)
}

export function groupUsage(document: VdfDocument, groupName: string) {
  return {
    appliedTo: document.policies.filter(policy => policy.appliedTo === groupName).map(policy => policy.name),
    sourceOf: document.policies
      .filter(policy => policy.ingress.some(rule => rule.from === groupName))
      .map(policy => policy.name),
  }
}

export type VdfEffectiveTier = {
  value: number
  name: VdfTierName | undefined
  policies: VdfPolicy[]
  default: VdfDefaultAction
}

// What decides a new connection to a VM carrying these tags, in order
export function effectiveTiers(vmTags: string[], document: VdfDocument): VdfEffectiveTier[] {
  const vmGroups = new Set(vmGroupNames(vmTags, document))

  return policiesByTier(document)
    .map(tier => {
      const policies = tier.policies.map(({ policy }) => policy).filter(policy => vmGroups.has(policy.appliedTo))

      return { value: tier.value, name: tier.name, policies, default: tierDefault(policies) }
    })
    .filter(tier => tier.policies.length > 0)
}

export type VdfChange = {
  kind: 'group' | 'policy' | 'rule'
  type: 'added' | 'removed' | 'modified' | 'moved'
  label: string
  context?: string
}

function diffRules(publishedPolicy: VdfPolicy, draftPolicy: VdfPolicy): VdfChange[] {
  const changes: VdfChange[] = []
  const publishedRules = new Map(publishedPolicy.ingress.map(rule => [rule.id, rule]))
  const draftRules = new Map(draftPolicy.ingress.map(rule => [rule.id, rule]))

  for (const [id, rule] of draftRules) {
    const publishedRule = publishedRules.get(id)

    if (publishedRule === undefined) {
      changes.push({ kind: 'rule', type: 'added', label: String(id), context: draftPolicy.name })
    } else if (!isEqual(publishedRule, rule)) {
      changes.push({ kind: 'rule', type: 'modified', label: String(id), context: draftPolicy.name })
    }
  }

  for (const id of publishedRules.keys()) {
    if (!draftRules.has(id)) {
      changes.push({ kind: 'rule', type: 'removed', label: String(id), context: draftPolicy.name })
    }
  }

  const commonOrder = (rules: VdfRule[]) =>
    rules.map(rule => rule.id).filter(id => publishedRules.has(id) && draftRules.has(id))

  if (!isEqual(commonOrder(publishedPolicy.ingress), commonOrder(draftPolicy.ingress))) {
    changes.push({ kind: 'rule', type: 'moved', label: '', context: draftPolicy.name })
  }

  return changes
}

// What a publish would change, for the review before publishing
export function diffDocuments(published: VdfDocument, draft: VdfDocument): VdfChange[] {
  const changes: VdfChange[] = []

  for (const [name, group] of Object.entries(draft.groups)) {
    const publishedGroup = published.groups[name]

    if (publishedGroup === undefined) {
      changes.push({ kind: 'group', type: 'added', label: name })
    } else if (!isEqual(publishedGroup, group)) {
      changes.push({ kind: 'group', type: 'modified', label: name })
    }
  }

  for (const name of Object.keys(published.groups)) {
    if (draft.groups[name] === undefined) {
      changes.push({ kind: 'group', type: 'removed', label: name })
    }
  }

  const publishedPolicies = new Map(published.policies.map(policy => [policy.name, policy]))
  const draftPolicies = new Map(draft.policies.map(policy => [policy.name, policy]))

  for (const [name, policy] of draftPolicies) {
    const publishedPolicy = publishedPolicies.get(name)

    if (publishedPolicy === undefined) {
      changes.push({ kind: 'policy', type: 'added', label: name })
      continue
    }

    const { ingress: publishedRules, ...publishedSettings } = publishedPolicy
    const { ingress: draftRules, ...draftSettings } = policy

    if (!isEqual(publishedSettings, draftSettings)) {
      changes.push({ kind: 'policy', type: 'modified', label: name })
    }

    if (!isEqual(publishedRules, draftRules)) {
      changes.push(...diffRules(publishedPolicy, policy))
    }
  }

  for (const name of publishedPolicies.keys()) {
    if (!draftPolicies.has(name)) {
      changes.push({ kind: 'policy', type: 'removed', label: name })
    }
  }

  const commonOrder = (policies: VdfPolicy[]) =>
    policies.map(policy => policy.name).filter(name => publishedPolicies.has(name) && draftPolicies.has(name))

  if (!isEqual(commonOrder(published.policies), commonOrder(draft.policies))) {
    changes.push({ kind: 'policy', type: 'moved', label: '' })
  }

  if (!isEqual(omit(published, ['groups', 'policies']), omit(draft, ['groups', 'policies']))) {
    changes.push({ kind: 'policy', type: 'modified', label: '' })
  }

  return changes
}
