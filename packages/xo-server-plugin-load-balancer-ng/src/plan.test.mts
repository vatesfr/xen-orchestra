import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import Plan from './plan.mjs'
import type { GlobalOptions, PlanOptions } from './types.mjs'
import type { XoApp } from '@vates/types'
import { Semaphore } from './plan.mjs'

// ===================================================================
// Minimal concrete Plan for testing abstract methods
// ===================================================================

class TestPlan extends Plan {
  async execute(): Promise<void> {
    // no-op
  }
}

function createPlan(): TestPlan {
  const globalOptions: GlobalOptions = {
    ignoredVmTags: new Set(),
    migrationCooldown: 0,
    migrationHistory: new Map(),
  }
  const options: PlanOptions = {}
  return new TestPlan(undefined as unknown as XoApp, 'test', [], options, globalOptions, new Semaphore(2))
}

// ===================================================================
// Coalition tests (ported from original plan.test.js)
// ===================================================================

interface TestCase {
  description: string
  affinityTags: string[]
  vms: Array<{ tags: string[] }>
  expectedResult: Record<string, string[]>
}

const tests: TestCase[] = [
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

describe('Plan', () => {
  const plan = createPlan()

  describe('_computeCoalitions', () => {
    for (const test of tests) {
      it(test.description, () => {
        assert.deepEqual(plan._computeCoalitions(test.vms as never, test.affinityTags), test.expectedResult)
      })
    }
  })
})
