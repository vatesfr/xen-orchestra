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

export const nextEntryId = entries => (entries.length === 0 ? 1 : entries[entries.length - 1].id + 1)
