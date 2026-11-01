import {
  VDF_GLOBAL_RULE_BASE,
  type VdfDocument,
  type VdfGroup,
  type VdfPolicy,
  type VdfRule,
} from '@/modules/vdf/types.ts'
import { isGlobalName, withGlobalOf } from '@/modules/vdf/utils/vdf-global.util.ts'
import { cloneDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { allRules, rulesOf, setRules, VDF_DIRECTIONS } from '@/modules/vdf/utils/vdf-rules.util.ts'
import { isEqual, omit } from 'lodash-es'

// Rebasing a draft: the draft's changes (from the document it started
// from to the draft) applied onto what was published since. An object
// changed on one side only takes that side's version; an object changed
// differently on both sides is a conflict, for the user to settle.

export type VdfConflict = {
  // 'group:<name>', 'policy:<name>', 'rule:<policy>:<id>' or 'setting:<key>'
  id: string
  kind: 'group' | 'policy' | 'rule' | 'setting'
  label: string
  // the policy of a rule
  context?: string
  // undefined: removed on that side
  mine: unknown
  theirs: unknown
}

export type VdfResolution = 'mine' | 'theirs'

export type VdfMergeResult = {
  document: VdfDocument
  conflicts: VdfConflict[]
  // rules of the draft renumbered because the same id was added upstream
  renumbered: { policy: string; from: number; to: number }[]
}

// a draft saved before drafts kept their base: every difference is a conflict
const UNKNOWN = Symbol('unknown base')

type Base<T> = T | undefined | typeof UNKNOWN

type Merged<T> = { value: T | undefined } | { conflict: true }

function merge3<T>(base: Base<T>, mine: T | undefined, theirs: T | undefined): Merged<T> {
  if (isEqual(mine, theirs)) {
    return { value: mine }
  }

  if (base !== UNKNOWN) {
    if (isEqual(mine, base)) {
      return { value: theirs }
    }

    if (isEqual(theirs, base)) {
      return { value: mine }
    }
  }

  return { conflict: true }
}

const baseOf = <T>(base: Base<Record<string, T>> | typeof UNKNOWN, key: string): Base<T> =>
  base === UNKNOWN ? UNKNOWN : base?.[key]

// The order of the side that reordered (the draft's when both did), then
// the objects only the other side has, after their predecessor there.
function mergeOrder(base: string[] | typeof UNKNOWN, mine: string[], theirs: string[], kept: Set<string>) {
  const common = (keys: string[]) =>
    keys.filter(key => mine.includes(key) && theirs.includes(key) && (base === UNKNOWN || base.includes(key)))

  const mineReordered = base !== UNKNOWN && !isEqual(common(mine), common(base))
  const [primary, secondary] = mineReordered ? [mine, theirs] : [theirs, mine]
  const order = primary.filter(key => kept.has(key))

  secondary.forEach((key, index) => {
    if (!kept.has(key) || order.includes(key)) {
      return
    }

    const predecessor = secondary
      .slice(0, index)
      .reverse()
      .find(other => order.includes(other))

    order.splice(predecessor === undefined ? 0 : order.indexOf(predecessor) + 1, 0, key)
  })

  return order
}

// a pool's draft never carries the global part: XO rewrites it
function localPart(document: VdfDocument): VdfDocument {
  return {
    ...document,
    groups: Object.fromEntries(Object.entries(document.groups).filter(([name]) => !isGlobalName(name))),
    policies: document.policies.filter(policy => !isGlobalName(policy.name)),
  }
}

const ruleIds = (document: VdfDocument) => document.policies.flatMap(policy => allRules(policy).map(rule => rule.id))

// Rules the draft added with an id that was also added upstream (both
// sides took the next free id): the draft's get new ids.
function renumberAddedRules(base: VdfDocument | undefined, mine: VdfDocument, theirs: VdfDocument) {
  const renumbered: VdfMergeResult['renumbered'] = []

  if (base === undefined) {
    return { mine, renumbered }
  }

  const baseIds = new Set(ruleIds(base))
  const theirRules = new Map(
    theirs.policies.flatMap(policy => allRules(policy).map(rule => [rule.id, { policy: policy.name, rule }] as const))
  )
  let nextId = Math.max(0, ...[base, mine, theirs].flatMap(ruleIds).filter(id => id < VDF_GLOBAL_RULE_BASE)) + 1
  const next = cloneDocument(mine)

  for (const policy of next.policies) {
    for (const rule of allRules(policy)) {
      const their = theirRules.get(rule.id)

      if (baseIds.has(rule.id) || their === undefined || (their.policy === policy.name && isEqual(their.rule, rule))) {
        continue
      }

      renumbered.push({ policy: policy.name, from: rule.id, to: nextId })
      rule.id = nextId++
    }
  }

  return { mine: next, renumbered }
}

type Resolve = <T>(conflict: VdfConflict, mine: T | undefined, theirs: T | undefined) => T | undefined

function mergeRules(
  policyName: string,
  base: VdfRule[] | typeof UNKNOWN | undefined,
  mine: VdfRule[],
  theirs: VdfRule[],
  resolve: Resolve
) {
  const byId = (rules: VdfRule[]) => Object.fromEntries(rules.map(rule => [String(rule.id), rule]))
  const baseRules = base === UNKNOWN ? UNKNOWN : byId(base ?? [])
  const mineRules = byId(mine)
  const theirRules = byId(theirs)
  const merged = new Map<string, VdfRule>()

  for (const id of new Set([...Object.keys(mineRules), ...Object.keys(theirRules)])) {
    const result = merge3(baseOf(baseRules, id), mineRules[id], theirRules[id])
    const value =
      'conflict' in result
        ? resolve(
            {
              id: `rule:${policyName}:${id}`,
              kind: 'rule',
              label: id,
              context: policyName,
              mine: mineRules[id],
              theirs: theirRules[id],
            },
            mineRules[id],
            theirRules[id]
          )
        : result.value

    if (value !== undefined) {
      merged.set(id, value)
    }
  }

  const order = mergeOrder(
    baseRules === UNKNOWN ? UNKNOWN : ((base as VdfRule[] | undefined)?.map(rule => String(rule.id)) ?? []),
    mine.map(rule => String(rule.id)),
    theirs.map(rule => String(rule.id)),
    new Set(merged.keys())
  )

  return order.map(id => merged.get(id)!)
}

// Applies the changes from `base` to `mine` onto `theirs`. Without a base
// (a draft saved by an older version), every difference is a conflict.
// Conflicts take `theirs` unless resolved otherwise. With lockGlobal (a
// pool's draft), the global part is always the one of `theirs`.
export function mergeDocuments(
  base: VdfDocument | undefined,
  rawMine: VdfDocument,
  theirs: VdfDocument,
  { resolutions = {}, lockGlobal = false }: { resolutions?: Record<string, VdfResolution>; lockGlobal?: boolean } = {}
): VdfMergeResult {
  const local = (document: VdfDocument) => (lockGlobal ? localPart(document) : document)
  const theirLocal = local(theirs)
  const baseLocal = base === undefined ? undefined : local(base)
  const { mine, renumbered } = renumberAddedRules(baseLocal, local(rawMine), theirLocal)
  const known = baseLocal ?? UNKNOWN
  const conflicts: VdfConflict[] = []

  const resolve: Resolve = (conflict, mineValue, theirValue) => {
    conflicts.push(conflict)

    return resolutions[conflict.id] === 'mine' ? mineValue : theirValue
  }

  // GROUPS

  const groups: Record<string, VdfGroup> = {}
  const groupNames = new Set([...Object.keys(mine.groups), ...Object.keys(theirLocal.groups)])

  for (const name of groupNames) {
    const result = merge3(
      baseOf(known === UNKNOWN ? UNKNOWN : known.groups, name),
      mine.groups[name],
      theirLocal.groups[name]
    )
    const value =
      'conflict' in result
        ? resolve(
            {
              id: `group:${name}`,
              kind: 'group',
              label: name,
              mine: mine.groups[name],
              theirs: theirLocal.groups[name],
            },
            mine.groups[name],
            theirLocal.groups[name]
          )
        : result.value

    if (value !== undefined) {
      groups[name] = value
    }
  }

  // POLICIES: settings and rules merged separately when both sides keep
  // the policy

  const byName = (policies: VdfPolicy[]) => Object.fromEntries(policies.map(policy => [policy.name, policy]))
  const basePolicies = known === UNKNOWN ? UNKNOWN : byName(known.policies)
  const minePolicies = byName(mine.policies)
  const theirPolicies = byName(theirLocal.policies)
  const policies = new Map<string, VdfPolicy>()

  for (const name of new Set([...Object.keys(minePolicies), ...Object.keys(theirPolicies)])) {
    const basePolicy = baseOf(basePolicies, name)
    const minePolicy = minePolicies[name]
    const theirPolicy = theirPolicies[name]
    const policyConflict: VdfConflict = {
      id: `policy:${name}`,
      kind: 'policy',
      label: name,
      mine: minePolicy,
      theirs: theirPolicy,
    }

    if (minePolicy !== undefined && theirPolicy !== undefined) {
      const settings = (policy: VdfPolicy | undefined) =>
        policy === undefined ? undefined : omit(policy, ['ingress', 'egress'])
      const result = merge3(
        basePolicy === UNKNOWN ? UNKNOWN : settings(basePolicy),
        settings(minePolicy),
        settings(theirPolicy)
      )
      const merged =
        'conflict' in result
          ? resolve(
              { ...policyConflict, mine: settings(minePolicy), theirs: settings(theirPolicy) },
              minePolicy,
              theirPolicy
            )
          : result.value

      const mergedPolicy: VdfPolicy = { ...(merged as VdfPolicy) }

      // each direction's rules merged on their own (vdf#53)
      for (const direction of VDF_DIRECTIONS) {
        setRules(
          mergedPolicy,
          direction,
          mergeRules(
            name,
            basePolicy === UNKNOWN ? UNKNOWN : basePolicy && rulesOf(basePolicy, direction),
            rulesOf(minePolicy, direction),
            rulesOf(theirPolicy, direction),
            resolve
          )
        )
      }
      policies.set(name, mergedPolicy)
      continue
    }

    // added or removed on one side
    const result = merge3(basePolicy, minePolicy, theirPolicy)
    const value = 'conflict' in result ? resolve(policyConflict, minePolicy, theirPolicy) : result.value

    if (value !== undefined) {
      policies.set(name, value)
    }
  }

  const policyOrder = mergeOrder(
    known === UNKNOWN ? UNKNOWN : known.policies.map(policy => policy.name),
    mine.policies.map(policy => policy.name),
    theirLocal.policies.map(policy => policy.name),
    new Set(policies.keys())
  )

  // SETTINGS: limits, the global scope, whatever else the document holds

  const settings: Record<string, unknown> = {}
  const settingsOf = (document: VdfDocument) => omit(document, ['groups', 'policies']) as Record<string, unknown>
  const baseSettings = known === UNKNOWN ? UNKNOWN : settingsOf(known)
  const mineSettings = settingsOf(mine)
  const theirSettings = settingsOf(theirLocal)

  for (const key of new Set([...Object.keys(mineSettings), ...Object.keys(theirSettings)])) {
    const result = merge3(baseOf(baseSettings, key), mineSettings[key], theirSettings[key])
    const value =
      'conflict' in result
        ? resolve(
            { id: `setting:${key}`, kind: 'setting', label: key, mine: mineSettings[key], theirs: theirSettings[key] },
            mineSettings[key],
            theirSettings[key]
          )
        : result.value

    if (value !== undefined) {
      settings[key] = value
    }
  }

  const document = cloneDocument({ ...settings, groups, policies: policyOrder.map(name => policies.get(name)!) })

  return { document: lockGlobal ? withGlobalOf(document, theirs) : document, conflicts, renumbered }
}
