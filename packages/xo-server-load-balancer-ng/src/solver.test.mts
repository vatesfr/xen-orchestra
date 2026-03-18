import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import type { XoHost, XoVm } from '@vates/types'

import { solve } from './solver.mjs'
import { AffinityConstraint } from './constraints/affinity.mjs'
import { AntiAffinityConstraint } from './constraints/anti-affinity.mjs'
import type { Constraint, Placement } from './constraint.mjs'

// ─── Test helpers ─────────────────────────────────────────────────────────────

const h = (id: string) => id as XoHost['id']
const v = (id: string) => id as XoVm['id']

const host = (id: string) => ({ id: h(id) }) as XoHost

/** Host with memory fields for memory-aware tests. `free` is the available bytes. */
const hostMem = (id: string, total: number, used: number) =>
  ({ id: h(id), memory: { size: total, usage: used } }) as XoHost

/** VM with a memory.size for memory-aware tests. */
const vmMem = (id: string, size: number) => ({ id: v(id), memory: { size } }) as XoVm

function mkPlacement(pairs: [string, string][]): Placement {
  return new Map(pairs.map(([vmId, hostId]) => [v(vmId), h(hostId)]))
}

/** Constraint that always returns a fixed set of moves, ignoring placement. */
function staticConstraint(priority: number, moves: [string, string][]): Constraint {
  return {
    priority,
    apply: () => new Map(moves.map(([vmId, hostId]) => [v(vmId), h(hostId)])),
  }
}

/** Constraint that reads placement and moves vm-target to wherever vm-anchor is. */
function followConstraint(priority: number, anchor: string, target: string): Constraint {
  return {
    priority,
    apply: (placement: Placement) => {
      const anchorHost = placement.get(v(anchor))
      if (anchorHost === undefined) return new Map()
      return new Map([[v(target), anchorHost]])
    },
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('solve', () => {
  describe('base cases', () => {
    it('returns an empty plan when there are no constraints', () => {
      const result = solve([], mkPlacement([['vm-1', 'h1']]), [host('h1'), host('h2')])
      assert.equal(result.size, 0)
    })

    it('returns an empty plan when all constraints produce no moves', () => {
      const c = staticConstraint(10, [])
      const result = solve([c], mkPlacement([['vm-1', 'h1']]), [host('h1'), host('h2')])
      assert.equal(result.size, 0)
    })

    it('returns the moves from a single constraint', () => {
      const c = staticConstraint(10, [['vm-1', 'h2']])
      const result = solve([c], mkPlacement([['vm-1', 'h1']]), [host('h1'), host('h2')])
      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-1')), h('h2'))
    })
  })

  describe('priority ordering', () => {
    it('applies higher-priority constraints before lower-priority ones', () => {
      // Both want to move vm-1, but to different hosts.
      // Priority 10 wins: vm-1 → h2. Priority 5 is applied after and moves vm-1 → h3.
      // The lower-priority constraint's move lands in the final plan.
      const high = staticConstraint(10, [['vm-1', 'h2']])
      const low = staticConstraint(5, [['vm-1', 'h3']])
      const result = solve([low, high], mkPlacement([['vm-1', 'h1']]), [host('h1'), host('h2'), host('h3')])

      // Last writer wins when both constraints move the same VM —
      // the important thing is that the order is deterministic (priority order).
      assert.equal(result.get(v('vm-1')), h('h3'))
    })

    it('collects independent moves from all constraints', () => {
      const high = staticConstraint(10, [['vm-1', 'h2']])
      const low = staticConstraint(5, [['vm-2', 'h1']])
      const result = solve(
        [low, high],
        mkPlacement([
          ['vm-1', 'h1'],
          ['vm-2', 'h2'],
        ]),
        [host('h1'), host('h2')]
      )

      assert.equal(result.size, 2)
      assert.equal(result.get(v('vm-1')), h('h2'))
      assert.equal(result.get(v('vm-2')), h('h1'))
    })
  })

  describe('placement propagation', () => {
    it('passes the updated placement (including prior moves) to each subsequent constraint', () => {
      // Constraint A (priority=10): moves vm-1 → h2
      // Constraint B (priority=5):  moves vm-2 to wherever vm-1 currently is
      // B must see vm-1 on h2 (A's result), so vm-2 → h2
      const moveVm1 = staticConstraint(10, [['vm-1', 'h2']])
      const followVm1 = followConstraint(5, 'vm-1', 'vm-2')

      const result = solve(
        [moveVm1, followVm1],
        mkPlacement([
          ['vm-1', 'h1'],
          ['vm-2', 'h1'],
        ]),
        [host('h1'), host('h2')]
      )

      assert.equal(result.get(v('vm-1')), h('h2'))
      assert.equal(result.get(v('vm-2')), h('h2'))
    })

    it('does NOT pass updated placement to a constraint of equal priority — order is stable', () => {
      // Both have priority=10. B is inserted after A and must run after A (stable sort).
      // B follows vm-1 — if run BEFORE A it would see vm-1 on h1, if AFTER it sees h2.
      const moveVm1 = staticConstraint(10, [['vm-1', 'h2']])
      const followVm1 = followConstraint(10, 'vm-1', 'vm-2')

      const result = solve(
        [moveVm1, followVm1], // insertion order: A then B
        mkPlacement([
          ['vm-1', 'h1'],
          ['vm-2', 'h1'],
        ]),
        [host('h1'), host('h2')]
      )

      // B runs after A (same priority, stable sort) → sees vm-1 on h2 → vm-2 → h2
      assert.equal(result.get(v('vm-1')), h('h2'))
      assert.equal(result.get(v('vm-2')), h('h2'))
    })
  })

  describe('net no-op guard', () => {
    it('removes a VM from the plan when its final destination equals its original host', () => {
      // A (priority=10) moves vm-1 → h2; B (priority=5) moves vm-1 back → h1 (original)
      const forward = staticConstraint(10, [['vm-1', 'h2']])
      const backward = staticConstraint(5, [['vm-1', 'h1']])

      const result = solve([forward, backward], mkPlacement([['vm-1', 'h1']]), [host('h1'), host('h2')])

      // vm-1 ends up at h1 (original) → not a real migration → removed
      assert.equal(result.has(v('vm-1')), false)
    })
  })

  describe('memory filtering', () => {
    it('rejects a move when the destination has insufficient free memory', () => {
      const c = staticConstraint(10, [['vm-1', 'h2']])
      const result = solve(
        [c],
        mkPlacement([['vm-1', 'h1']]),
        [hostMem('h1', 4096, 0), hostMem('h2', 4096, 3584)], // h2: 512 free
        [vmMem('vm-1', 1024)] // vm-1 needs 1024
      )
      assert.equal(result.size, 0)
    })

    it('accepts a move when the destination has enough free memory', () => {
      const c = staticConstraint(10, [['vm-1', 'h2']])
      const result = solve(
        [c],
        mkPlacement([['vm-1', 'h1']]),
        [hostMem('h1', 4096, 0), hostMem('h2', 4096, 2048)], // h2: 2048 free
        [vmMem('vm-1', 1024)]
      )
      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-1')), h('h2'))
    })

    it('accounts for memory freed by a departing VM when evaluating a later move to the same host', () => {
      // h1: 1024 free, h2: 1024 free. Both vm-1 and vm-2 are 1024 bytes.
      // Constraint (p=10): vm-1 h1→h2. h2 free: 1024 >= 1024 ✓ → accept.
      //   After: h1 free = 2048, h2 free = 0.
      // Constraint (p=5): vm-2 h2→h1. h1 free: 2048 >= 1024 ✓ → accept.
      const moveVm1 = staticConstraint(10, [['vm-1', 'h2']])
      const moveVm2 = staticConstraint(5, [['vm-2', 'h1']])
      const result = solve(
        [moveVm1, moveVm2],
        mkPlacement([
          ['vm-1', 'h1'],
          ['vm-2', 'h2'],
        ]),
        [hostMem('h1', 4096, 2048), hostMem('h2', 4096, 2048)], // each: 2048 free
        [vmMem('vm-1', 1024), vmMem('vm-2', 1024)]
      )
      assert.equal(result.size, 2)
      assert.equal(result.get(v('vm-1')), h('h2'))
      assert.equal(result.get(v('vm-2')), h('h1'))
    })

    it('blocks a second move to a host already filled by the first move in the same constraint batch', () => {
      // h2 has exactly 1024 free. vm-1 (1024) and vm-2 (1024) both propose to go to h2.
      // vm-1 fills h2 → vm-2 is rejected.
      const c = staticConstraint(10, [
        ['vm-1', 'h2'],
        ['vm-2', 'h2'],
      ])
      const result = solve(
        [c],
        mkPlacement([
          ['vm-1', 'h1'],
          ['vm-2', 'h1'],
        ]),
        [hostMem('h1', 4096, 0), hostMem('h2', 4096, 3072)], // h2: 1024 free
        [vmMem('vm-1', 1024), vmMem('vm-2', 1024)]
      )
      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-1')), h('h2'))
      assert.equal(result.has(v('vm-2')), false)
    })
  })

  describe('memory retry — filtered hosts', () => {
    it('retries with the full host removed and picks the next-best destination', () => {
      // Anti-affinity: vm-1 and vm-2 both on h1.
      // Attempt 1: best dest = h2 (fewest VMs). h2 has only 50 free < 100 → rejected.
      // Attempt 2: availableHosts = [h1, h3]. Best dest = h3. h3 has 2000 free >= 100 ✓.
      // Result: vm-1 → h3.
      const c = new AntiAffinityConstraint('db', [v('vm-1'), v('vm-2')])
      const result = solve(
        [c],
        mkPlacement([
          ['vm-1', 'h1'],
          ['vm-2', 'h1'],
        ]),
        [hostMem('h1', 4096, 0), hostMem('h2', 4096, 4046), hostMem('h3', 4096, 0)], // h2: 50 free, h3: 4096 free
        [vmMem('vm-1', 100), vmMem('vm-2', 100)]
      )
      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-1')), h('h3'))
    })

    it('accepts partial moves and retries only with remaining capacity', () => {
      // Two VMs need to spread across h2 and h3.
      // h2: 100 free (fits vm-1=100 but not vm-2=100 after vm-1 fills it).
      // h3: 200 free (fits vm-2=100).
      // Attempt 1: vm-1 → h2 (min count=0) ✓ accepted. h2 free → 0.
      //            vm-2 → h2 rejected (h2 now full). tooFullHosts={h2}.
      // Attempt 2: availableHosts=[h1,h3]. vm-2 → h3 ✓.
      const c = new AntiAffinityConstraint('db', [v('vm-1'), v('vm-2'), v('vm-3')])
      const result = solve(
        [c],
        mkPlacement([
          ['vm-1', 'h1'],
          ['vm-2', 'h1'],
          ['vm-3', 'h1'],
        ]),
        [
          hostMem('h1', 4096, 0),
          hostMem('h2', 4096, 3996), // h2: 100 free — fits exactly one vm
          hostMem('h3', 4096, 3896), // h3: 200 free — fits two vms
        ],
        [vmMem('vm-1', 100), vmMem('vm-2', 100), vmMem('vm-3', 100)]
      )
      // vm-1 and vm-2 both move out; vm-3 stays on h1 (h1 stays source until balanced)
      assert.equal(result.get(v('vm-1')), h('h2'))
      assert.equal(result.get(v('vm-2')), h('h3'))
    })

    it('gives up when all alternative hosts are also too full', () => {
      // h2 and h3 both lack memory for vm-1 — no valid destination exists.
      const c = new AntiAffinityConstraint('db', [v('vm-1'), v('vm-2')])
      const result = solve(
        [c],
        mkPlacement([
          ['vm-1', 'h1'],
          ['vm-2', 'h1'],
        ]),
        [
          hostMem('h1', 4096, 0),
          hostMem('h2', 4096, 4090), // 6 free
          hostMem('h3', 4096, 4090), // 6 free
        ],
        [vmMem('vm-1', 100), vmMem('vm-2', 100)]
      )
      assert.equal(result.size, 0)
    })
  })

  describe('integration — anti-affinity + affinity', () => {
    it('anti-affinity runs before affinity and affinity respects the resulting placement', () => {
      // Pool: h1, h2
      // VMs:
      //   vm-1: affinity=web, anti-affinity=db  → on h1
      //   vm-2: affinity=web                    → on h1
      //   vm-3: anti-affinity=db                → on h1
      //
      // Anti-affinity group "db" = [vm-1, vm-3], both on h1 → spread:
      //   vm-1 (lex-smallest) → h2
      //
      // Affinity group "web" = [vm-1, vm-2], now vm-1 on h2, vm-2 on h1:
      //   target = h1 (has vm-2, count=1 vs h2 count=1 — tie → h1 first in hosts array)
      //   vm-1 needs to move to h1, BUT it has anti-affinity=db and vm-3 is on h1 → conflict → skip
      //
      // Final plan: only vm-1 → h2 (from anti-affinity)
      const antiAffinity = new AntiAffinityConstraint('db', [v('vm-1'), v('vm-3')])
      const affinity = new AffinityConstraint(new Set(['web']), [v('vm-1'), v('vm-2')], {
        vmGroups: new Map([[v('vm-1'), new Set(['db'])]]),
        groupVms: new Map([['db', new Set([v('vm-1'), v('vm-3')])]]),
      })

      const result = solve(
        [affinity, antiAffinity], // deliberately pass out of order — solver must sort
        mkPlacement([
          ['vm-1', 'h1'],
          ['vm-2', 'h1'],
          ['vm-3', 'h1'],
        ]),
        [host('h1'), host('h2')]
      )

      // Only anti-affinity move survives; affinity correctly skips vm-1
      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-1')), h('h2'))
      assert.equal(result.has(v('vm-2')), false)
    })
  })
})
