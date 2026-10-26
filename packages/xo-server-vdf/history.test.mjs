import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'

import { appendEntry, listEntry, nextEntryId, summarize } from './history.mjs'

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
