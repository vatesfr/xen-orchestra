import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { selectSynchronizedSnapshotVms } from './_selectSynchronizedSnapshotVms.mjs'

// Helper mirroring the minimal VM record shape the selector needs.
const vm = (uuid, tags = []) => ({ uuid, tags })

// `selectSynchronizedSnapshotVms(synchronizedSnapshot, vms)` must return a Set
// of the UUIDs that should be snapshotted together in the batch phase.
//   - false        -> feature off, no VM is batched
//   - true         -> every VM is batched, regardless of tags
//   - '<tagName>'  -> only VMs carrying that exact tag are batched
const tests = [
  {
    label: 'false disables batching',
    setting: false,
    vms: [vm('a', ['prod']), vm('b')],
    expected: [],
  },
  {
    label: 'true batches every VM regardless of tags',
    setting: true,
    vms: [vm('a', ['prod']), vm('b')],
    expected: ['a', 'b'],
  },
  {
    label: 'tag batches only the VMs carrying it',
    setting: 'prod',
    vms: [vm('a', ['prod']), vm('b', ['dev']), vm('c', ['prod', 'other'])],
    expected: ['a', 'c'],
  },
  {
    label: 'tag carried by no VM yields an empty batch',
    setting: 'prod',
    vms: [vm('a', ['dev']), vm('b')],
    expected: [],
  },
  {
    label: 'tag carried by every VM batches all of them',
    setting: 'prod',
    vms: [vm('a', ['prod']), vm('b', ['prod'])],
    expected: ['a', 'b'],
  },
  {
    label: 'empty VM list yields an empty batch',
    setting: true,
    vms: [],
    expected: [],
  },
  {
    label: 'empty-string tag matches no VM when none carries an empty tag',
    setting: '',
    vms: [vm('a', ['prod'])],
    expected: [],
  },
]

describe('selectSynchronizedSnapshotVms()', () => {
  for (const { label, setting, vms, expected } of tests) {
    it(label, () => {
      const result = selectSynchronizedSnapshotVms(setting, vms)
      assert.ok(result instanceof Set, 'result must be a Set')
      assert.deepEqual([...result].sort(), [...expected].sort())
    })
  }
})
