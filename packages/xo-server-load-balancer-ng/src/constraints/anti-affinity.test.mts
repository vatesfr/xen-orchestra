import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import type { XoHost, XoVm } from '@vates/types'

import { AntiAffinityConstraint } from './anti-affinity.mjs'
import type { Placement } from '../constraint.mjs'

// ─── Test helpers ─────────────────────────────────────────────────────────────

// Cast plain strings to branded types — safe for tests only.
const h = (id: string) => id as XoHost['id']
const v = (id: string) => id as XoVm['id']

const host = (id: string) => ({ id: h(id) }) as XoHost

function mkPlacement(pairs: [string, string][]): Placement {
  return new Map(pairs.map(([vmId, hostId]) => [v(vmId), h(hostId)]))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AntiAffinityConstraint', () => {
  describe('no-op cases', () => {
    it('returns no moves for an empty VM list', () => {
      const c = new AntiAffinityConstraint('g', [])
      assert.equal(c.apply(mkPlacement([]), [host('h1'), host('h2')]).size, 0)
    })

    it('returns no moves when there is only one host', () => {
      const c = new AntiAffinityConstraint('g', [v('vm-1'), v('vm-2')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
      ])
      assert.equal(c.apply(p, [host('h1')]).size, 0)
    })

    it('returns no moves when already perfectly balanced (max − min = 0)', () => {
      const c = new AntiAffinityConstraint('g', [v('vm-1'), v('vm-2')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h2'],
      ])
      assert.equal(c.apply(p, [host('h1'), host('h2')]).size, 0)
    })

    it('returns no moves when balanced within tolerance (max − min = 1)', () => {
      // 3 VMs, 2 hosts: 2 on h1, 1 on h2 — acceptable spread
      const c = new AntiAffinityConstraint('g', [v('vm-1'), v('vm-2'), v('vm-3')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
        ['vm-3', 'h2'],
      ])
      assert.equal(c.apply(p, [host('h1'), host('h2')]).size, 0)
    })
  })

  describe('spreading', () => {
    it('spreads 3 VMs evenly across 3 hosts when all start on one host', () => {
      // Initial: h1=[vm-1,vm-2,vm-3], h2=[], h3=[]
      // Expected: vm-1→h2, vm-2→h3  (vm-1 is lex-smallest, moved first to h2;
      //           then vm-2 is lex-smallest on h1, moved to h3 which now has 0)
      const c = new AntiAffinityConstraint('g', [v('vm-1'), v('vm-2'), v('vm-3')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
        ['vm-3', 'h1'],
      ])
      const result = c.apply(p, [host('h1'), host('h2'), host('h3')])

      assert.equal(result.size, 2)
      assert.equal(result.get(v('vm-1')), h('h2'))
      assert.equal(result.get(v('vm-2')), h('h3'))
    })

    it('spreads 4 VMs evenly across 2 hosts when all start on one host', () => {
      // Initial: h1=[vm-1..vm-4], h2=[]  → 2 VMs must move to h2
      const c = new AntiAffinityConstraint('g', [v('vm-1'), v('vm-2'), v('vm-3'), v('vm-4')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
        ['vm-3', 'h1'],
        ['vm-4', 'h1'],
      ])
      const result = c.apply(p, [host('h1'), host('h2')])

      assert.equal(result.size, 2)
      assert.equal(result.get(v('vm-1')), h('h2'))
      assert.equal(result.get(v('vm-2')), h('h2'))
    })

    it('balances a 3 vs 1 distribution on 2 hosts with a single move', () => {
      // Initial: h1=[vm-1,vm-2,vm-3], h2=[vm-4]
      // vm-1 (lex-smallest on h1) → h2
      const c = new AntiAffinityConstraint('g', [v('vm-1'), v('vm-2'), v('vm-3'), v('vm-4')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
        ['vm-3', 'h1'],
        ['vm-4', 'h2'],
      ])
      const result = c.apply(p, [host('h1'), host('h2')])

      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-1')), h('h2'))
    })

    it('prefers the host with the fewest VMs as destination', () => {
      // h1=[vm-1,vm-2,vm-3], h2=[vm-4,vm-5], h3=[vm-6]
      // source=h1(3), dest must satisfy count+1 < 3 → count < 2 → only h3(1) qualifies
      const c = new AntiAffinityConstraint('g', [v('vm-1'), v('vm-2'), v('vm-3'), v('vm-4'), v('vm-5'), v('vm-6')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
        ['vm-3', 'h1'],
        ['vm-4', 'h2'],
        ['vm-5', 'h2'],
        ['vm-6', 'h3'],
      ])
      const result = c.apply(p, [host('h1'), host('h2'), host('h3')])

      // Only h3 qualifies (count=1, 1+1=2 < 3). vm-1 moves there.
      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-1')), h('h3'))
    })
  })

  describe('VM selection — lexicographic order', () => {
    it('always picks the lexicographically smallest VM id on the source host', () => {
      // h1=[vm-z, vm-a], h2=[] — vm-a must be picked, not vm-z
      const c = new AntiAffinityConstraint('g', [v('vm-a'), v('vm-z')])
      const p = mkPlacement([
        ['vm-a', 'h1'],
        ['vm-z', 'h1'],
      ])
      const result = c.apply(p, [host('h1'), host('h2')])

      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-a')), h('h2'))
    })
  })

  describe('edge cases', () => {
    it('silently skips VMs absent from placement (e.g. assert_can_migrate filtered them out late)', () => {
      // Only vm-1 is in placement; vm-ghost is not — only 1 VM total, nothing to spread
      const c = new AntiAffinityConstraint('g', [v('vm-1'), v('vm-ghost')])
      const p = mkPlacement([['vm-1', 'h1']])
      assert.equal(c.apply(p, [host('h1'), host('h2')]).size, 0)
    })

    it('silently skips VMs on hosts not in the hosts array', () => {
      // vm-2 is on 'excluded' which is not in the hosts list → only vm-1 counts
      // h1=1, h2=0 → max−min=1 ≤ 1 → no moves
      const c = new AntiAffinityConstraint('g', [v('vm-1'), v('vm-2')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'excluded'],
      ])
      assert.equal(c.apply(p, [host('h1'), host('h2')]).size, 0)
    })

    it('uses the placement passed in, not the original vm.$container', () => {
      // Simulates the solver having already moved vm-1 to h2 via a higher-priority constraint.
      // The placement reflects that move; the constraint must see the updated state.
      // vm-1 on h2, vm-2 on h2 → h1=0, h2=2 → vm-1 or vm-2 must move back to h1
      const c = new AntiAffinityConstraint('g', [v('vm-1'), v('vm-2')])
      const p = mkPlacement([
        ['vm-1', 'h2'],
        ['vm-2', 'h2'],
      ])
      const result = c.apply(p, [host('h1'), host('h2')])

      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-1')), h('h1')) // vm-1 is lex-smallest
    })
  })
})
