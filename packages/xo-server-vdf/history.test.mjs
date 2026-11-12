import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  appendEntry,
  describeChanges,
  liftedQuarantines,
  listEntries,
  listEntry,
  nextEntryId,
  resolveLifts,
  summarize,
  tagChangeEntry,
} from './history.mjs'

const BEFORE = {
  groups: { web: { tags: ['vdf:role=web'] }, db: { tags: ['vdf:role=db'] } },
  policies: [
    {
      name: 'db',
      appliedTo: 'db',
      default: 'drop',
      ingress: [
        { id: 1, from: 'web', proto: 'tcp', ports: [5432] },
        { id: 2, from: 'any', proto: 'icmp' },
      ],
    },
  ],
}

describe('summarize', () => {
  test('counts groups, policy settings and rules added, removed and modified', () => {
    const after = structuredClone(BEFORE)
    after.groups.admins = { ips: ['192.0.2.1'] } // added
    delete after.groups.web // removed
    after.policies[0].default = 'pass' // policy modified
    after.policies[0].ingress[0].ports = [5433] // rule modified
    after.policies[0].ingress.pop() // rule removed

    assert.deepEqual(summarize(BEFORE, after), {
      added: 1,
      removed: 2,
      modified: 2,
      groups: 2,
      policies: 1,
      rules: 1,
    })
  })

  test('a first publish adds everything, the same document changes nothing', () => {
    assert.deepEqual(summarize(null, BEFORE), { added: 5, removed: 0, modified: 0, groups: 2, policies: 1, rules: 2 })
    assert.deepEqual(summarize(BEFORE, structuredClone(BEFORE)), {
      added: 0,
      removed: 0,
      modified: 0,
      groups: 2,
      policies: 1,
      rules: 2,
    })
  })

  test('limits and scope changes count as one modification', () => {
    const summary = summarize({ ...BEFORE, scope: { all: true } }, { ...BEFORE, scope: { pools: ['a'] } })
    assert.equal(summary.modified, 1)
  })

  test('the format version follows the document: a policy switched to enforce is one change, not two', () => {
    const monitored = { ...BEFORE, version: 4, policies: BEFORE.policies.map(p => ({ ...p, mode: 'monitor' })) }
    const summary = summarize(monitored, BEFORE)
    assert.equal(summary.modified, BEFORE.policies.length)
  })
})

describe('history list', () => {
  test('keeps the newest entries, ids keep increasing', () => {
    let entries = []
    for (let i = 0; i < 5; i++) {
      entries = appendEntry(entries, { id: nextEntryId(entries), document: {} }, 3)
    }
    assert.deepEqual(
      entries.map(entry => entry.id),
      [3, 4, 5]
    )
    assert.equal(nextEntryId(entries), 6)
  })

  test('the list goes without documents', () => {
    assert.deepEqual(listEntry({ id: 1, docId: 'abc', document: { groups: {} } }), { id: 1, docId: 'abc' })
  })
})

// UX P2-10: the history list says what changed, object by object
describe('describeChanges', () => {
  test('per policy its rules, per group, the settings; the rest counted', () => {
    const after = {
      groups: { web: { tags: ['vdf:role=web'] }, cache: { tags: ['vdf:role=cache'] } },
      policies: [
        {
          name: 'db',
          appliedTo: 'db',
          default: 'drop',
          ingress: [
            { id: 1, from: 'web', proto: 'tcp', ports: [5433] },
            { id: 3, from: 'cache', proto: 'tcp', ports: [5432] },
            { id: 4, from: 'cache', proto: 'udp', ports: [53] },
          ],
        },
        { name: 'web', appliedTo: 'web', default: 'drop', ingress: [] },
      ],
      limits: { maxConnections: 10 },
    }
    assert.deepEqual(describeChanges(BEFORE, after, 10), {
      items: [
        {
          kind: 'policy',
          name: 'db',
          change: 'modified',
          rules: { added: 2, removed: 1, modified: 1 },
          settings: false,
        },
        { kind: 'policy', name: 'web', change: 'added' },
        { kind: 'group', name: 'cache', change: 'added' },
        { kind: 'group', name: 'db', change: 'removed' },
        { kind: 'settings', change: 'modified' },
      ],
      more: 0,
    })
    assert.equal(describeChanges(BEFORE, after, 2).more, 3)
    assert.deepEqual(describeChanges(BEFORE, BEFORE), { items: [], more: 0 })
  })

  test('services (vdf#103) by name, not as a setting', () => {
    const dhcp = { name: 'dhcp', kind: 'dhcp4', group: 'db' }
    const ra = { name: 'ra', kind: 'router', group: 'web', mode: 'monitor' }
    const before = { ...BEFORE, services: [dhcp, ra] }
    const after = {
      ...BEFORE,
      services: [
        { ...dhcp, mode: 'monitor' },
        { name: 'dhcp6', kind: 'dhcp6', group: 'db' },
      ],
    }
    assert.deepEqual(describeChanges(before, after, 10), {
      items: [
        { kind: 'service', name: 'dhcp', change: 'modified' },
        { kind: 'service', name: 'dhcp6', change: 'added' },
        { kind: 'service', name: 'ra', change: 'removed' },
      ],
      more: 0,
    })
    assert.deepEqual(summarize(before, after), {
      added: 1,
      removed: 1,
      modified: 1,
      groups: 2,
      policies: 1,
      rules: 2,
    })
  })

  test('the list: each entry against the one before it, without documents', () => {
    const entries = listEntries([
      { id: 1, document: BEFORE },
      { id: 2, document: { ...BEFORE, groups: {} } },
    ])
    assert.equal(entries[0].document, undefined)
    assert.equal(entries[0].changes.items.length, 3)
    assert.deepEqual(entries[1].changes.items, [
      { kind: 'group', name: 'web', change: 'removed' },
      { kind: 'group', name: 'db', change: 'removed' },
    ])
  })
})

describe('quarantines lifted outside XO', () => {
  let id = 0
  const change = (objectId, tag, change, objectType = 'VM') => ({
    id: ++id,
    ...tagChangeEntry({ objectId, objectType, tag, change, timestamp: 0 }, objectId),
  })
  const REQUARANTINED = { resolution: 'requarantined', resolvedAt: '2026-11-12T12:00:00.000Z' }

  test('an alert per VM still there: its last quarantine change kept, a lift not resolved', () => {
    const changes = [
      change('a', 'vdf:quarantine', 'remove'),
      change('b', 'vdf:quarantine', 'remove'),
      change('b', 'vdf:quarantine', 'add'), // put back outside XO
      { ...change('c', 'vdf:quarantine', 'remove'), ...REQUARANTINED }, // put back through XO
      change('d', 'vdf:quarantine', 'remove'), // gone
      change('e', 'vdf:role=app', 'remove'),
      change('n', 'vdf:quarantine', 'remove', 'network'),
      { kind: 'notInherited', object: { id: 'f', type: 'VM' }, tags: ['vdf:role=app'] },
    ]
    assert.deepEqual(
      liftedQuarantines(changes, id => id !== 'd').map(entry => entry.object.id),
      ['a']
    )
  })

  test('an open alert survives the trim of the entries, once resolved it is trimmed as any', () => {
    const max = 5
    const fill = entries => {
      for (let i = 0; i < max + 1; i++) {
        entries = appendEntry(entries, { id: nextEntryId(entries), kind: 'notInherited' }, max)
      }
      return entries
    }
    let entries = appendEntry([], change('a', 'vdf:quarantine', 'remove'), max)
    entries = fill(entries)
    assert.equal(entries.length, max + 1)
    assert.deepEqual(
      liftedQuarantines(entries, () => true).map(entry => entry.object.id),
      ['a']
    )

    entries = resolveLifts(entries, entry => entry.object.id === 'a', REQUARANTINED)
    entries = fill(entries)
    assert.equal(entries.length, max)
    assert.deepEqual(
      liftedQuarantines(entries, () => true),
      []
    )
  })

  test('resolves the open alerts picked, and only them', () => {
    const changes = [
      change('a', 'vdf:quarantine', 'remove'),
      change('a', 'vdf:role=app', 'remove'),
      change('b', 'vdf:quarantine', 'remove'),
    ]
    const resolved = resolveLifts(changes, entry => entry.object.id === 'a', REQUARANTINED)
    assert.deepEqual(resolved, [{ ...changes[0], ...REQUARANTINED }, changes[1], changes[2]])

    // resolved once: never again, nor reopened
    const acknowledged = { resolution: 'acknowledged', resolvedAt: '2026-11-12T13:00:00.000Z', resolvedBy: 'bob' }
    assert.equal(
      resolveLifts(resolved, entry => entry.object.id === 'a', acknowledged),
      resolved
    )
    assert.deepEqual(
      liftedQuarantines(resolved, () => true),
      [changes[2]]
    )
  })
})
