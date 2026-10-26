import type { VdfDefaultAction, VdfDocument, VdfGroup, VdfPolicy, VdfRule } from '@/modules/vdf/types.ts'
import { isGlobalName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isMonitored } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { tierValue } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { allRules, rulesOf, VDF_DIRECTIONS } from '@/modules/vdf/utils/vdf-rules.util.ts'
import type { VdfAgentGaps } from '@/modules/vdf/utils/vdf-status.util.ts'
import { isEqual, omit } from 'lodash-es'

// What a publish changes (or changed, in the history), object by object,
// with the rules of each policy: for reviews, where diffDocuments' flat
// list only names the objects.

export type VdfChangeType = 'added' | 'removed' | 'modified'

export type VdfRuleChange = { type: VdfChangeType; rule: VdfRule; previous?: VdfRule }

export type VdfPolicyChange = {
  type: VdfChangeType
  name: string
  // the new version, or the removed one
  policy: VdfPolicy
  previous?: VdfPolicy
  settingsChanged: boolean
  rules: VdfRuleChange[]
  rulesReordered: boolean
}

export type VdfGroupChange = { type: VdfChangeType; name: string; group: VdfGroup; previous?: VdfGroup }

export type VdfChangeDetails = {
  policies: VdfPolicyChange[]
  groups: VdfGroupChange[]
  policiesReordered: boolean
  // limits, the global scope...
  settings: string[]
}

function ruleChanges(before: VdfRule[], after: VdfRule[]): VdfRuleChange[] {
  const previous = new Map(before.map(rule => [rule.id, rule]))
  const next = new Set(after.map(rule => rule.id))
  const changes: VdfRuleChange[] = []

  for (const rule of after) {
    const old = previous.get(rule.id)

    if (old === undefined) {
      changes.push({ type: 'added', rule })
    } else if (!isEqual(old, rule)) {
      changes.push({ type: 'modified', rule, previous: old })
    }
  }

  for (const rule of before) {
    if (!next.has(rule.id)) {
      changes.push({ type: 'removed', rule })
    }
  }

  return changes
}

const commonOrder = (keys: (string | number)[], other: (string | number)[]) => keys.filter(key => other.includes(key))

// What hosts enforce in a document: its enforced policies, in order, the
// groups they name, and its other settings (limits...); not the format
// version, which follows monitor mode
function enforcement(document: VdfDocument) {
  const policies = document.policies.filter(policy => !isMonitored(policy))
  const used = new Set(
    policies.flatMap(policy => [policy.appliedTo, ...allRules(policy).map(rule => rule.to ?? rule.from)])
  )

  return {
    ...omit(document, ['version', 'policies', 'groups']),
    policies,
    groups: Object.fromEntries(Object.entries(document.groups).filter(([name]) => used.has(name))),
  }
}

// A change of policies in monitor mode only (and of groups only they use):
// nothing enforced changes, no connection is cut (vdf#13)
export function isMonitorOnlyChange(before: VdfDocument, after: VdfDocument) {
  return !isEqual(omit(before, 'version'), omit(after, 'version')) && isEqual(enforcement(before), enforcement(after))
}

export function changeDetails(before: VdfDocument, after: VdfDocument): VdfChangeDetails {
  const groups: VdfGroupChange[] = []

  for (const [name, group] of Object.entries(after.groups)) {
    const previous = before.groups[name]

    if (previous === undefined) {
      groups.push({ type: 'added', name, group })
    } else if (!isEqual(previous, group)) {
      groups.push({ type: 'modified', name, group, previous })
    }
  }

  for (const [name, group] of Object.entries(before.groups)) {
    if (after.groups[name] === undefined) {
      groups.push({ type: 'removed', name, group })
    }
  }

  const policies: VdfPolicyChange[] = []
  const beforePolicies = new Map(before.policies.map(policy => [policy.name, policy]))
  const afterNames = new Set(after.policies.map(policy => policy.name))

  for (const policy of after.policies) {
    const previous = beforePolicies.get(policy.name)

    if (previous === undefined) {
      policies.push({
        type: 'added',
        name: policy.name,
        policy,
        settingsChanged: false,
        rules: ruleChanges([], allRules(policy)),
        rulesReordered: false,
      })
      continue
    }

    if (isEqual(previous, policy)) {
      continue
    }

    // rules keep their order within their direction (vdf#53)
    const reordered = VDF_DIRECTIONS.some(direction => {
      const beforeIds = rulesOf(previous, direction).map(rule => rule.id)
      const afterIds = rulesOf(policy, direction).map(rule => rule.id)

      return !isEqual(commonOrder(beforeIds, afterIds), commonOrder(afterIds, beforeIds))
    })

    policies.push({
      type: 'modified',
      name: policy.name,
      policy,
      previous,
      settingsChanged: !isEqual(omit(previous, ['ingress', 'egress']), omit(policy, ['ingress', 'egress'])),
      rules: ruleChanges(allRules(previous), allRules(policy)),
      rulesReordered: reordered,
    })
  }

  for (const policy of before.policies) {
    if (!afterNames.has(policy.name)) {
      policies.push({
        type: 'removed',
        name: policy.name,
        policy,
        settingsChanged: false,
        rules: ruleChanges(allRules(policy), []),
        rulesReordered: false,
      })
    }
  }

  const beforeNames = before.policies.map(policy => policy.name)
  const afterOrder = after.policies.map(policy => policy.name)
  // the format version follows what the document holds (monitor mode,
  // networks): no change of its own
  const beforeSettings = omit(before, ['groups', 'policies', 'version']) as Record<string, unknown>
  const afterSettings = omit(after, ['groups', 'policies', 'version']) as Record<string, unknown>

  return {
    policies,
    groups,
    policiesReordered: !isEqual(commonOrder(beforeNames, afterOrder), commonOrder(afterOrder, beforeNames)),
    settings: [...new Set([...Object.keys(beforeSettings), ...Object.keys(afterSettings)])].filter(
      key => !isEqual(beforeSettings[key], afterSettings[key])
    ),
  }
}

export function isEmptyChange(details: VdfChangeDetails) {
  return (
    details.policies.length === 0 &&
    details.groups.length === 0 &&
    !details.policiesReordered &&
    details.settings.length === 0
  )
}

export type VdfPublishWarning =
  // a new or changed policy protects nothing yet
  | { type: 'empty-group'; policy: string; group: string }
  // a new or changed policy drops all inbound traffic to its VMs
  | { type: 'drop-without-rules'; policy: string; group: string }
  // or every connection they start (vdf#53)
  | { type: 'egress-drop-without-rules'; policy: string; group: string }
  // open connections that let in a removed rule
  | { type: 'open-connections'; policy: string; rule: number; count: number }

// Hosts of a pool a publish (or check) doesn't reach (vdf#38): no agent, or
// one stopped or stuck
export type VdfHostWarning =
  | { type: 'hosts-without-agent'; hosts: string[] }
  | { type: 'hosts-stale-agent'; hosts: string[] }

export function hostWarnings({ missing, stale }: VdfAgentGaps): VdfHostWarning[] {
  const warnings: VdfHostWarning[] = []

  if (missing.length > 0) {
    warnings.push({ type: 'hosts-without-agent', hosts: missing })
  }

  if (stale.length > 0) {
    warnings.push({ type: 'hosts-stale-agent', hosts: stale })
  }

  return warnings
}

export function publishWarnings(
  details: VdfChangeDetails,
  {
    memberCount,
    openConnections,
  }: {
    // VMs the group applies to; undefined: not known
    memberCount: (group: string) => number | undefined
    // open connections a rule let in; undefined: not known
    openConnections?: (ruleId: number) => number | undefined
  }
): VdfPublishWarning[] {
  const warnings: VdfPublishWarning[] = []

  for (const change of details.policies) {
    const { policy } = change

    if (change.type !== 'removed' && (change.type === 'added' || change.settingsChanged)) {
      if (memberCount(policy.appliedTo) === 0) {
        warnings.push({ type: 'empty-group', policy: policy.name, group: policy.appliedTo })
      }
    }

    // a policy in monitor mode drops nothing (Discover publishes exactly that)
    if (change.type !== 'removed' && policy.default === 'drop' && policy.ingress.length === 0 && !isMonitored(policy)) {
      warnings.push({ type: 'drop-without-rules', policy: policy.name, group: policy.appliedTo })
    }

    if (
      change.type !== 'removed' &&
      policy.egressDefault === 'drop' &&
      rulesOf(policy, 'egress').length === 0 &&
      !isMonitored(policy)
    ) {
      warnings.push({ type: 'egress-drop-without-rules', policy: policy.name, group: policy.appliedTo })
    }

    for (const ruleChange of change.rules) {
      const count = ruleChange.type === 'removed' ? openConnections?.(ruleChange.rule.id) : undefined

      if (count !== undefined && count > 0) {
        warnings.push({ type: 'open-connections', policy: policy.name, rule: ruleChange.rule.id, count })
      }
    }
  }

  return warnings
}

// A pool policy's default that a global policy's decides for (vdf#27).
// Agents merge the defaults of the policies of a tier that apply to an
// interface: drop if one says drop, else allow if one does, else pass. A
// global policy in the same tier with a stronger default therefore decides
// for the VMs both apply to, whatever the pool's own policy says, and
// nothing told the pool's owner.
export type VdfOverriddenDefault = {
  policy: string
  global: string
  tier: number
  egress: boolean
  own: VdfDefaultAction
  theirs: VdfDefaultAction
  // VMs of the pool both policies apply to
  vms: number
}

const DEFAULT_STRENGTH: Record<VdfDefaultAction, number> = { pass: 0, allow: 1, drop: 2 }

// a policy's default in a direction; undefined when it has nothing to say
// there (no outbound rules nor outbound default)
function defaultOf(policy: VdfPolicy, egress: boolean): VdfDefaultAction | undefined {
  if (!egress) {
    return policy.default
  }

  return policy.egressDefault ?? (rulesOf(policy, 'egress').length > 0 ? 'pass' : undefined)
}

// `document`: a pool's, with its global part; `sharedVms`: how many VMs of
// the pool have an interface both groups apply to (groups scoped to
// networks, vdf#36, only hold the interfaces on them)
export function overriddenDefaults(
  document: VdfDocument,
  sharedVms: (group: string, other: string) => number
): VdfOverriddenDefault[] {
  const enforced = document.policies.filter(policy => !isMonitored(policy))
  const globals = enforced.filter(policy => isGlobalName(policy.name))
  const result: VdfOverriddenDefault[] = []

  for (const own of enforced.filter(policy => !isGlobalName(policy.name))) {
    const tier = tierValue(own.tier)

    for (const global of globals.filter(policy => tierValue(policy.tier) === tier)) {
      const vms = sharedVms(own.appliedTo, global.appliedTo)

      if (vms === 0) {
        continue
      }

      for (const egress of [false, true]) {
        const ownDefault = defaultOf(own, egress)
        const theirs = defaultOf(global, egress)

        if (
          ownDefault !== undefined &&
          theirs !== undefined &&
          DEFAULT_STRENGTH[theirs] > DEFAULT_STRENGTH[ownDefault]
        ) {
          result.push({ policy: own.name, global: global.name, tier, egress, own: ownDefault, theirs, vms })
        }
      }
    }
  }

  return result
}
