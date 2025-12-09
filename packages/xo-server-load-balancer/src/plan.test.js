import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import Plan from './plan.js'

function createPlan() {
  const plan = new Plan(undefined, undefined, undefined, {})
  return plan
}

const tests = [
  {
    description: 'Finds empty coalitions',
    affinityTags: ['A', 'B'],
    vms: [
      { tags: ['A'] },
      { tags: ['A'] },
      { tags: ['B'] },
      { tags: ['A', 'Z'] },
      { tags: ['B', 'X', 'Y'] },
      { tags: ['X', 'Y'] },
      { tags: ['Z'] },
    ],
    expectedResult: {
      A: ['A'],
      B: ['B'],
    },
  },
  {
    description: 'Finds direct coalitions',
    affinityTags: ['A', 'B', 'C'],
    vms: [{ tags: ['A'] }, { tags: ['A', 'B'] }, { tags: ['B'] }, { tags: ['B', 'A'] }, { tags: ['Y', 'Z'] }],
    expectedResult: {
      A: ['A', 'B'],
      B: ['B', 'A'],
      C: ['C'],
    },
  },
  {
    description: 'Finds indirect coalitions',
    affinityTags: ['A', 'B', 'C'],
    vms: [{ tags: ['A', 'B'] }, { tags: ['B', 'C'] }],
    expectedResult: {
      A: ['A', 'B', 'C'],
      B: ['B', 'A', 'C'],
      C: ['C', 'B', 'A'],
    },
  },
  {
    description: 'Finds complex indirect coalitions',
    affinityTags: ['A', 'B', 'C', 'D'],
    vms: [{ tags: ['A', 'B'] }, { tags: ['C', 'D'] }, { tags: ['B', 'D'] }],
    expectedResult: {
      A: ['A', 'B', 'D', 'C'],
      B: ['B', 'A', 'D', 'C'],
      C: ['C', 'D', 'B', 'A'],
      D: ['D', 'C', 'B', 'A'],
    },
  },
]

describe('Plan', function () {
  const plan = createPlan()

  describe('computeCoalitions', function () {
    for (const test of tests) {
      it(test.description, function () {
        assert.deepEqual(plan._computeCoalitions(test.vms, test.affinityTags), test.expectedResult)
      })
    }
  })
})
