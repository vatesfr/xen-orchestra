import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import type { XoHost, XoVm } from '@vates/types'

import { computeSimplePlan, extractConstraints } from './simple.mjs'

// ─── Test helpers ─────────────────────────────────────────────────────────────

const h = (id: string) => id as XoHost['id']
const v = (id: string) => id as XoVm['id']

// Hosts have ample memory so no move is ever blocked by memory in these tests.
const host = (id: string) => ({ id: h(id), memory: { size: 1024 * 1024, usage: 0 } }) as XoHost

function vm(id: string, hostId: string, tags: string[] = []): XoVm {
  return { id: v(id), $container: h(hostId), tags, power_state: 'Running', memory: { size: 512 } } as unknown as XoVm
}

// ─── extractConstraints ───────────────────────────────────────────────────────

describe('extractConstraints', () => {
  describe('ignored VMs', () => {
    it('marks VMs with ignore tag as ignored', () => {
      const vms = [vm('vm-1', 'h1', ['xo:load:balancer:ignore'])]
      const { ignoredVmIds, constraints } = extractConstraints(vms)
      assert.equal(ignoredVmIds.length, 1)
      assert.equal(ignoredVmIds[0], v('vm-1'))
      assert.equal(constraints.length, 0)
    })

    it('does not include ignored VMs in any constraint', () => {
      // vm-1 is ignored but has anti-affinity=db — it must NOT appear in the constraint
      const vms = [
        vm('vm-1', 'h1', ['xo:load:balancer:ignore', 'xo:load:balancer:anti-affinity=db']),
        vm('vm-2', 'h1', ['xo:load:balancer:anti-affinity=db']),
        vm('vm-3', 'h2', ['xo:load:balancer:anti-affinity=db']),
      ]
      const { constraints } = extractConstraints(vms)
      // Only vm-2 and vm-3 are in the group — still ≥2, one constraint
      assert.equal(constraints.length, 1)
    })
  })

  describe('anti-affinity constraints', () => {
    it('creates one constraint per group', () => {
      const vms = [
        vm('vm-1', 'h1', ['xo:load:balancer:anti-affinity=web']),
        vm('vm-2', 'h1', ['xo:load:balancer:anti-affinity=web', 'xo:load:balancer:anti-affinity=db']),
        vm('vm-3', 'h1', ['xo:load:balancer:anti-affinity=db']),
      ]
      const { constraints } = extractConstraints(vms)
      // Two anti-affinity groups: web=[vm-1,vm-2], db=[vm-2,vm-3]
      assert.equal(constraints.length, 2)
    })

    it('skips groups with fewer than 2 VMs', () => {
      const vms = [vm('vm-1', 'h1', ['xo:load:balancer:anti-affinity=db'])]
      const { constraints } = extractConstraints(vms)
      assert.equal(constraints.length, 0)
    })
  })

  describe('affinity constraints', () => {
    it('creates one constraint for a single affinity group', () => {
      const vms = [
        vm('vm-1', 'h1', ['xo:load:balancer:affinity=web']),
        vm('vm-2', 'h2', ['xo:load:balancer:affinity=web']),
      ]
      const { constraints } = extractConstraints(vms)
      assert.equal(constraints.length, 1)
    })

    it('merges groups that share a VM into one coalition constraint', () => {
      // vm-1: web+db → web and db are in the same coalition
      // vm-2: web
      // vm-3: db
      const vms = [
        vm('vm-1', 'h1', ['xo:load:balancer:affinity=web', 'xo:load:balancer:affinity=db']),
        vm('vm-2', 'h2', ['xo:load:balancer:affinity=web']),
        vm('vm-3', 'h3', ['xo:load:balancer:affinity=db']),
      ]
      const { constraints } = extractConstraints(vms)
      // web and db are linked by vm-1 → one coalition → one constraint
      assert.equal(constraints.length, 1)
    })

    it('keeps disjoint affinity groups as separate constraints', () => {
      const vms = [
        vm('vm-1', 'h1', ['xo:load:balancer:affinity=web']),
        vm('vm-2', 'h2', ['xo:load:balancer:affinity=web']),
        vm('vm-3', 'h1', ['xo:load:balancer:affinity=db']),
        vm('vm-4', 'h2', ['xo:load:balancer:affinity=db']),
      ]
      const { constraints } = extractConstraints(vms)
      // web and db have no shared VMs → two separate constraints
      assert.equal(constraints.length, 2)
    })

    it('skips coalitions with fewer than 2 VMs', () => {
      const vms = [vm('vm-1', 'h1', ['xo:load:balancer:affinity=web'])]
      const { constraints } = extractConstraints(vms)
      assert.equal(constraints.length, 0)
    })
  })

  describe('mixed affinity + anti-affinity', () => {
    it('creates both constraint types when a VM has both tags', () => {
      const vms = [
        vm('vm-1', 'h1', ['xo:load:balancer:affinity=web', 'xo:load:balancer:anti-affinity=db']),
        vm('vm-2', 'h2', ['xo:load:balancer:affinity=web']),
        vm('vm-3', 'h1', ['xo:load:balancer:anti-affinity=db']),
      ]
      const { constraints } = extractConstraints(vms)
      // 1 anti-affinity (db: vm-1+vm-3) + 1 affinity (web: vm-1+vm-2)
      assert.equal(constraints.length, 2)
    })
  })
})

// ─── computeSimplePlan ────────────────────────────────────────────────────────

describe('computeSimplePlan', () => {
  it('returns empty plan when there is only one host', () => {
    const vms = [
      vm('vm-1', 'h1', ['xo:load:balancer:anti-affinity=db']),
      vm('vm-2', 'h1', ['xo:load:balancer:anti-affinity=db']),
    ]
    const result = computeSimplePlan([host('h1')], vms)
    assert.equal(result.size, 0)
  })

  it('returns empty plan when there are no constraints', () => {
    const vms = [vm('vm-1', 'h1'), vm('vm-2', 'h2')]
    const result = computeSimplePlan([host('h1'), host('h2')], vms)
    assert.equal(result.size, 0)
  })

  it('spreads anti-affinity VMs across hosts', () => {
    // vm-1 and vm-2 both on h1 with anti-affinity=db → vm-1 should move to h2
    const vms = [
      vm('vm-1', 'h1', ['xo:load:balancer:anti-affinity=db']),
      vm('vm-2', 'h1', ['xo:load:balancer:anti-affinity=db']),
    ]
    const result = computeSimplePlan([host('h1'), host('h2')], vms)
    assert.equal(result.size, 1)
    assert.equal(result.get(v('vm-1')), h('h2'))
  })

  it('colocates affinity VMs on the host with the most of them', () => {
    // vm-1 and vm-2 on h1, vm-3 on h2, all in affinity=web → vm-3 → h1
    const vms = [
      vm('vm-1', 'h1', ['xo:load:balancer:affinity=web']),
      vm('vm-2', 'h1', ['xo:load:balancer:affinity=web']),
      vm('vm-3', 'h2', ['xo:load:balancer:affinity=web']),
    ]
    const result = computeSimplePlan([host('h1'), host('h2')], vms)
    assert.equal(result.size, 1)
    assert.equal(result.get(v('vm-3')), h('h1'))
  })

  it('ignores VMs with the ignore tag', () => {
    // vm-1 and vm-2 both on h1 with anti-affinity=db
    // vm-ignored also on h1 with ignore tag — must not be moved
    const vms = [
      vm('vm-1', 'h1', ['xo:load:balancer:anti-affinity=db']),
      vm('vm-2', 'h1', ['xo:load:balancer:anti-affinity=db']),
      vm('vm-ignored', 'h1', ['xo:load:balancer:ignore']),
    ]
    const result = computeSimplePlan([host('h1'), host('h2')], vms)
    assert.equal(result.has(v('vm-ignored')), false)
    // vm-1 and vm-2 should still be spread
    assert.equal(result.size, 1)
  })
})
