import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { updateMemoryFields } from './_incrementalVm.mjs'

const MOCK_REF = 'mockRef'

function mockXapiVm(initialMemoryValues) {
  const res = {
    ...initialMemoryValues,
    updates: [],
    barrier: () => {},
    setField: (type, ref, field, value) => {
      assert(type === 'VM')
      assert(ref === MOCK_REF)
      res.updates.push({ field, value })
      res[field] = value
      assert(res.memory_static_min <= res.memory_dynamic_min)
      assert(res.memory_dynamic_min <= res.memory_dynamic_max)
      assert(res.memory_dynamic_max <= res.memory_static_max)
    },
  }
  return res
}

const tests = [
  {
    label: 'handles a memory increase',
    targetVm: {
      memory_static_min: 2,
      memory_dynamic_min: 4,
      memory_dynamic_max: 4,
      memory_static_max: 8,
    },
    vmRecord: {
      memory_static_min: 16,
      memory_dynamic_min: 16,
      memory_dynamic_max: 16,
      memory_static_max: 16,
    },
    expectedUpdates: [
      { field: 'memory_static_max', value: 16 },
      { field: 'memory_dynamic_max', value: 16 },
      { field: 'memory_dynamic_min', value: 16 },
      { field: 'memory_static_min', value: 16 },
    ],
  },
  {
    label: 'handles a memory decrease',
    targetVm: {
      memory_static_min: 4,
      memory_dynamic_min: 8,
      memory_dynamic_max: 16,
      memory_static_max: 16,
    },
    vmRecord: {
      memory_static_min: 2,
      memory_dynamic_min: 2,
      memory_dynamic_max: 2,
      memory_static_max: 2,
    },
    expectedUpdates: [
      { field: 'memory_static_min', value: 2 },
      { field: 'memory_dynamic_min', value: 2 },
      { field: 'memory_dynamic_max', value: 2 },
      { field: 'memory_static_max', value: 2 },
    ],
  },
  {
    label: 'handles a more complex case',
    targetVm: {
      memory_static_min: 1,
      memory_dynamic_min: 2,
      memory_dynamic_max: 8,
      memory_static_max: 16,
    },
    vmRecord: {
      memory_static_min: 4,
      memory_dynamic_min: 4,
      memory_dynamic_max: 4,
      memory_static_max: 4,
    },
    expectedUpdates: [
      { field: 'memory_dynamic_min', value: 4 },
      { field: 'memory_static_min', value: 4 },
      { field: 'memory_dynamic_max', value: 4 },
      { field: 'memory_static_max', value: 4 },
    ],
  },
  {
    label: 'avoids updating identical value',
    targetVm: {
      memory_static_min: 1,
      memory_dynamic_min: 2,
      memory_dynamic_max: 4,
      memory_static_max: 8,
    },
    vmRecord: {
      memory_static_min: 1,
      memory_dynamic_min: 2,
      memory_dynamic_max: 4,
      memory_static_max: 8,
    },
    expectedUpdates: [],
  },
]

describe('updateMemoryFields() should update in the right order', () => {
  for (const test of tests) {
    it(test.label, async () => {
      const mock = mockXapiVm(test.targetVm)
      test.targetVm.$ref = MOCK_REF
      await updateMemoryFields(mock, test.targetVm, test.vmRecord)

      assert.equal(mock.updates.length, test.expectedUpdates.length)
      for (let i = 0; i < mock.updates.length; i++) {
        assert.equal(mock.updates[i].value, test.expectedUpdates[i].value)
        assert.equal(mock.updates[i].field, test.expectedUpdates[i].field)
      }
    })
  }
})
