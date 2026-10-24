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
import { displayName, globalRuleId } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isMonitored, withFormatVersion } from '@/modules/vdf/utils/vdf-monitor.util.ts'
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

// ids from VDF_GLOBAL_RULE_BASE up belong to the global configuration. A
// rule id labels the connections it admits: pass the published document
// too, so a rule deleted in the draft doesn't lend its id to a new one.
export function nextRuleId(document: VdfDocument, ...others: VdfDocument[]) {
  const ids = [document, ...others]
    .flatMap(({ policies }) => policies.flatMap(policy => policy.ingress.map(rule => rule.id)))
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

// as published: version 4 when a policy is in monitor mode (vdf#13)
export function serializeDocument(document: VdfDocument) {
  return JSON.stringify(withFormatVersion(document), null, 2)
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

// What applies to a VM carrying these tags, in order; a tier's default is
// what its enforced policies decide (monitored ones decide nothing)
export function effectiveTiers(vmTags: string[], document: VdfDocument): VdfEffectiveTier[] {
  const vmGroups = new Set(vmGroupNames(vmTags, document))

  return policiesByTier(document)
    .map(tier => {
      const policies = tier.policies.map(({ policy }) => policy).filter(policy => vmGroups.has(policy.appliedTo))

      return {
        value: tier.value,
        name: tier.name,
        policies,
        default: tierDefault(policies.filter(policy => !isMonitored(policy))),
      }
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

// THE RULE BASE as the policies board shows it: every tier in evaluation
// order, each policy with its rules, and what the draft changes compared
// to the document it started from. Objects the draft deletes stay listed,
// marked removed, where they were, so they can be restored until a publish.

export type VdfDraftState = 'new' | 'modified' | 'removed'

export type VdfRuleBaseRule = {
  rule: VdfRule
  state: VdfDraftState | undefined
  // within the policy's rules (removed ones aside)
  isFirst: boolean
  isLast: boolean
}

export type VdfRuleBasePolicy = {
  policy: VdfPolicy
  state: VdfDraftState | undefined
  locked: boolean
  rules: VdfRuleBaseRule[]
  // within the tier's policies that can move (global and removed ones aside)
  isFirst: boolean
  isLast: boolean
}

export type VdfRuleBaseTier = {
  value: number
  name: VdfTierName | undefined
  // for the VMs the tier's policies apply to, when none of their rules match
  default: VdfDefaultAction
  policies: VdfRuleBasePolicy[]
}

// `entries` in draft order, plus the published ones the draft no longer
// has, each right after its published predecessor
function withRemoved<T, P, K>(
  entries: T[],
  published: P[],
  {
    keyOf,
    publishedKeyOf,
    removed,
  }: { keyOf: (entry: T) => K; publishedKeyOf: (entry: P) => K; removed: (entry: P) => T }
): T[] {
  const merged = [...entries]
  let previous = -1

  for (const entry of published) {
    const index = merged.findIndex(candidate => keyOf(candidate) === publishedKeyOf(entry))

    if (index === -1) {
      merged.splice(previous + 1, 0, removed(entry))
      previous += 1
    } else {
      previous = index
    }
  }

  return merged
}

function markFirstLast<T extends { state: VdfDraftState | undefined; isFirst: boolean; isLast: boolean }>(
  entries: T[],
  canMove: (entry: T) => boolean = () => true
) {
  const movable = entries.filter(entry => entry.state !== 'removed' && canMove(entry))

  movable.forEach((entry, index) => {
    entry.isFirst = index === 0
    entry.isLast = index === movable.length - 1
  })

  return entries
}

function ruleBaseRules(policy: VdfPolicy, publishedPolicy: VdfPolicy | undefined): VdfRuleBaseRule[] {
  const publishedRules = new Map((publishedPolicy?.ingress ?? []).map(rule => [rule.id, rule]))

  const entries = policy.ingress.map((rule): VdfRuleBaseRule => {
    const publishedRule = publishedRules.get(rule.id)
    let state: VdfDraftState | undefined

    // in a new policy, every rule is new: the policy says it
    if (publishedPolicy !== undefined) {
      state = publishedRule === undefined ? 'new' : isEqual(publishedRule, rule) ? undefined : 'modified'
    }

    return { rule, state, isFirst: false, isLast: false }
  })

  return markFirstLast(
    withRemoved(entries, publishedPolicy?.ingress ?? [], {
      keyOf: ({ rule }) => rule.id,
      publishedKeyOf: rule => rule.id,
      removed: rule => ({ rule, state: 'removed', isFirst: false, isLast: false }),
    })
  )
}

// Every named tier, empty ones too (where a policy goes decides what it
// wins over), and the numeric tiers a hand-written document may use
export function ruleBase(
  document: VdfDocument,
  published: VdfDocument,
  isLocked: (name: string) => boolean = () => false
): VdfRuleBaseTier[] {
  const publishedPolicies = new Map(published.policies.map(policy => [policy.name, policy]))
  const draftPolicies = new Map(document.policies.map(policy => [policy.name, policy]))

  function policyState(policy: VdfPolicy): VdfDraftState | undefined {
    const publishedPolicy = publishedPolicies.get(policy.name)

    if (publishedPolicy === undefined) {
      return 'new'
    }

    return isEqual(omit(publishedPolicy, 'ingress'), omit(policy, 'ingress')) ? undefined : 'modified'
  }

  const values = new Set<number>([
    ...VDF_TIERS.map(tier => tier.value),
    ...[...document.policies, ...published.policies].map(policy => tierValue(policy.tier)),
  ])

  return [...values]
    .sort((valueA, valueB) => valueA - valueB)
    .map(value => {
      const inTier = (policy: VdfPolicy | undefined) => policy !== undefined && tierValue(policy.tier) === value
      const tierPolicies = document.policies.filter(inTier)

      const entries = tierPolicies.map(
        (policy): VdfRuleBasePolicy => ({
          policy,
          state: policyState(policy),
          locked: isLocked(policy.name),
          rules: ruleBaseRules(policy, publishedPolicies.get(policy.name)),
          isFirst: false,
          isLast: false,
        })
      )

      // a deleted policy shows in its published tier; one moved to another
      // tier only in its new one
      const publishedInTier = published.policies.filter(
        policy => inTier(policy) && (!draftPolicies.has(policy.name) || inTier(draftPolicies.get(policy.name)))
      )

      const policies = withRemoved(entries, publishedInTier, {
        keyOf: ({ policy }) => policy.name,
        publishedKeyOf: policy => policy.name,
        removed: (policy): VdfRuleBasePolicy => ({
          policy,
          state: 'removed',
          locked: isLocked(policy.name),
          rules: ruleBaseRules(policy, policy),
          isFirst: false,
          isLast: false,
        }),
      })

      return {
        value,
        name: tierName(value),
        default: tierDefault(tierPolicies),
        policies: markFirstLast(policies, ({ locked }) => !locked),
      }
    })
}

// SEARCH: every word must be found in the policy (name, applied-to group)
// or in the rule (id, source, protocol, ports, log label). A policy found
// by itself shows all its rules.

function words(query: string) {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

function policyTexts(policy: VdfPolicy) {
  return [displayName(policy.name), displayName(policy.appliedTo)].map(text => text.toLowerCase())
}

function ruleTexts(rule: VdfRule) {
  return [
    `#${globalRuleId(rule.id)}`,
    displayName(rule.from),
    rule.proto,
    ...(rule.ports ?? []).map(String),
    rule.logLabel ?? '',
  ].map(text => text.toLowerCase())
}

export function filterRuleBase(tiers: VdfRuleBaseTier[], query: string): VdfRuleBaseTier[] {
  const terms = words(query)

  if (terms.length === 0) {
    return tiers
  }

  const found = (texts: string[], term: string) => texts.some(text => text.includes(term))

  return tiers
    .map(tier => ({
      ...tier,
      policies: tier.policies.flatMap(entry => {
        const texts = policyTexts(entry.policy)

        if (terms.every(term => found(texts, term))) {
          return [entry]
        }

        const rules = entry.rules.filter(({ rule }) => {
          const all = [...texts, ...ruleTexts(rule)]

          return terms.every(term => found(all, term))
        })

        return rules.length === 0 ? [] : [{ ...entry, rules }]
      }),
    }))
    .filter(tier => tier.policies.length > 0)
}

// REORDERING, as draft edits. `to` is a step (up, down) or an end (top,
// bottom); a policy moves among the policies of its tier, global ones
// aside (in a pool, they always come first). Returns false when nothing
// moves.

export type VdfMove = 'up' | 'down' | 'top' | 'bottom'

function moveAmong<T>(list: T[], slots: number[], from: number, to: VdfMove) {
  const position = slots.indexOf(from)
  const target = { up: position - 1, down: position + 1, top: 0, bottom: slots.length - 1 }[to]

  if (position === -1 || target < 0 || target >= slots.length || target === position) {
    return false
  }

  const items = slots.map(slot => list[slot])
  const [moved] = items.splice(position, 1)

  items.splice(target, 0, moved)
  slots.forEach((slot, index) => {
    list[slot] = items[index]
  })

  return true
}

export function movePolicy(
  document: VdfDocument,
  name: string,
  to: VdfMove,
  isLocked: (name: string) => boolean = () => false
) {
  const index = document.policies.findIndex(policy => policy.name === name)

  if (index === -1 || isLocked(name)) {
    return false
  }

  const tier = tierValue(document.policies[index].tier)
  const slots = document.policies
    .map((policy, slot) => ({ policy, slot }))
    .filter(({ policy }) => tierValue(policy.tier) === tier && !isLocked(policy.name))
    .map(({ slot }) => slot)

  return moveAmong(document.policies, slots, index, to)
}

export function moveRule(document: VdfDocument, policyName: string, id: number, to: VdfMove) {
  const policy = document.policies.find(({ name }) => name === policyName)
  const index = policy?.ingress.findIndex(rule => rule.id === id) ?? -1

  if (policy === undefined || index === -1) {
    return false
  }

  return moveAmong(
    policy.ingress,
    policy.ingress.map((_, slot) => slot),
    index,
    to
  )
}
