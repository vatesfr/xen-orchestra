// Publish history: the last documents XO published, per scope (each pool,
// and the global configuration), kept in XO's store so a previous version
// can be reviewed and restored as a draft.

import { isDeepStrictEqual } from 'node:util'

export const HISTORY_LENGTH = 50

// ingress and egress rules (vdf#53): ids are unique in a document
const rulesOf = document =>
  new Map(
    (document?.policies ?? []).flatMap(policy =>
      [...(policy.ingress ?? []), ...(policy.egress ?? [])].map(rule => [rule.id, rule])
    )
  )

const policiesOf = document =>
  new Map((document?.policies ?? []).map(({ ingress, egress, ...settings }) => [settings.name, settings]))

// what a document holds besides its groups and policies; its format
// version follows what it holds (monitor mode, networks): no change of its own
const settingsOf = ({ groups, policies, version, ...settings } = {}) => settings

const groupsOf = document => new Map(Object.entries(document?.groups ?? {}))

function countChanges(previous, next) {
  let added = 0
  let removed = 0
  let modified = 0
  for (const [key, value] of next) {
    if (!previous.has(key)) {
      added++
    } else if (!isDeepStrictEqual(previous.get(key), value)) {
      modified++
    }
  }
  for (const key of previous.keys()) {
    if (!next.has(key)) {
      removed++
    }
  }
  return { added, removed, modified }
}

// What a publish changed, in groups, policies and rules (a policy's
// settings without its rules: a rule edit counts as a rule change), plus
// the size of the published document. `previous` is null for a first
// publish.
export function summarize(previous, next) {
  const total = (...counts) =>
    counts.reduce(
      (sum, count) => ({
        added: sum.added + count.added,
        removed: sum.removed + count.removed,
        modified: sum.modified + count.modified,
      }),
      { added: 0, removed: 0, modified: 0 }
    )
  const changes = total(
    countChanges(groupsOf(previous), groupsOf(next)),
    countChanges(policiesOf(previous), policiesOf(next)),
    countChanges(rulesOf(previous), rulesOf(next))
  )
  if (previous != null && !isDeepStrictEqual(settingsOf(previous), settingsOf(next ?? undefined))) {
    // limits, the global scope...
    changes.modified++
  }
  return {
    ...changes,
    groups: groupsOf(next).size,
    policies: policiesOf(next).size,
    rules: rulesOf(next).size,
  }
}

// newest last, at most `max` entries
export function appendEntry(entries, entry, max = HISTORY_LENGTH) {
  return [...entries, entry].slice(-max)
}

// the history list goes without the documents
export const listEntry = ({ document, ...entry }) => entry

const rulesByPolicy = document => new Map((document?.policies ?? []).map(policy => [policy.name, policy]))

// What a publish changed, object by object, for the history list (UX
// P2-10): each policy added, removed, or modified (its rules added,
// removed, modified, and whether its settings changed), each group added,
// removed or modified, policies first; at most `max`, the rest counted.
export function describeChanges(previous, next, max = 4) {
  const items = []
  const before = rulesByPolicy(previous)
  const after = rulesByPolicy(next)
  for (const [name, policy] of after) {
    const old = before.get(name)
    if (old === undefined) {
      items.push({ kind: 'policy', name, change: 'added' })
      continue
    }
    const rules = countChanges(rulesOf({ policies: [old] }), rulesOf({ policies: [policy] }))
    const { ingress: _a, egress: _b, ...settings } = policy
    const { ingress: _c, egress: _d, ...oldSettings } = old
    const settingsChanged = !isDeepStrictEqual(settings, oldSettings)
    if (rules.added + rules.removed + rules.modified > 0 || settingsChanged) {
      items.push({ kind: 'policy', name, change: 'modified', rules, settings: settingsChanged })
    }
  }
  for (const name of before.keys()) {
    if (!after.has(name)) {
      items.push({ kind: 'policy', name, change: 'removed' })
    }
  }
  const groupsBefore = groupsOf(previous)
  for (const [name, group] of groupsOf(next)) {
    if (!groupsBefore.has(name)) {
      items.push({ kind: 'group', name, change: 'added' })
    } else if (!isDeepStrictEqual(groupsBefore.get(name), group)) {
      items.push({ kind: 'group', name, change: 'modified' })
    }
  }
  for (const name of groupsBefore.keys()) {
    if (!groupsOf(next).has(name)) {
      items.push({ kind: 'group', name, change: 'removed' })
    }
  }
  if (previous != null && !isDeepStrictEqual(settingsOf(previous), settingsOf(next ?? undefined))) {
    // limits, the global scope...
    items.push({ kind: 'settings', change: 'modified' })
  }
  return { items: items.slice(0, max), more: Math.max(0, items.length - max) }
}

// The history list, each entry with what it changed object by object
// (against the entry before it, when kept): `comparable` turns an entry
// into the document compared (a pool's own part, the global
// configuration with its scope)
export function listEntries(entries, comparable = entry => entry.document) {
  return entries.map((entry, index) => ({
    ...listEntry(entry),
    changes: describeChanges(
      index === 0 || entries[index - 1].document == null ? null : comparable(entries[index - 1]),
      entry.document == null ? null : comparable(entry)
    ),
  }))
}

export const nextEntryId = entries => (entries.length === 0 ? 1 : entries[entries.length - 1].id + 1)
