import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import type { XoHost, XoVm } from '@vates/types'

import { AffinityConstraint, type AntiAffinityData } from './affinity.mjs'
import type { Placement } from '../constraint.mjs'

// ─── Test helpers ─────────────────────────────────────────────────────────────

const h = (id: string) => id as XoHost['id']
const v = (id: string) => id as XoVm['id']

const host = (id: string) => ({ id: h(id) }) as XoHost

function mkPlacement(pairs: [string, string][]): Placement {
  return new Map(pairs.map(([vmId, hostId]) => [v(vmId), h(hostId)]))
}

// Build AntiAffinityData for a single group.
function mkAntiAffinityData(group: string, vmIdsInGroup: string[], vmIdsWithTag: string[]): AntiAffinityData {
  return {
    vmGroups: new Map(vmIdsWithTag.map(id => [v(id), new Set([group])])),
    groupVms: new Map([[group, new Set(vmIdsInGroup.map(v))]]),
  }
}

const groups = (name: string) => new Set([name])

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AffinityConstraint', () => {
  describe('no-op cases', () => {
    it('returns no moves for an empty VM list', () => {
      const c = new AffinityConstraint(groups('web'), [])
      assert.equal(c.apply(mkPlacement([]), [host('h1'), host('h2')]).size, 0)
    })

    it('returns no moves when there is only one host', () => {
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
      ])
      assert.equal(c.apply(p, [host('h1')]).size, 0)
    })

    it('returns no moves when all VMs are already colocated', () => {
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2'), v('vm-3')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
        ['vm-3', 'h1'],
      ])
      assert.equal(c.apply(p, [host('h1'), host('h2')]).size, 0)
    })

    it('returns no moves when no coalition VMs are in the placement', () => {
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2')])
      // placement has unrelated VMs only
      const p = mkPlacement([['vm-other', 'h1']])
      assert.equal(c.apply(p, [host('h1'), host('h2')]).size, 0)
    })
  })

  describe('colocating', () => {
    it('moves the minority VM to the host that already has the most coalition VMs', () => {
      // h1=[vm-1, vm-2], h2=[vm-3] → target=h1, move vm-3→h1
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2'), v('vm-3')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
        ['vm-3', 'h2'],
      ])
      const result = c.apply(p, [host('h1'), host('h2')])

      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-3')), h('h1'))
    })

    it('moves all spread VMs to the host with the majority', () => {
      // h1=[vm-1, vm-2, vm-3], h2=[vm-4], h3=[vm-5] → target=h1
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2'), v('vm-3'), v('vm-4'), v('vm-5')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
        ['vm-3', 'h1'],
        ['vm-4', 'h2'],
        ['vm-5', 'h3'],
      ])
      const result = c.apply(p, [host('h1'), host('h2'), host('h3')])

      assert.equal(result.size, 2)
      assert.equal(result.get(v('vm-4')), h('h1'))
      assert.equal(result.get(v('vm-5')), h('h1'))
    })

    it('breaks ties in target selection by Map insertion order (first host wins)', () => {
      // h1=[vm-1], h2=[vm-2] — equal counts, h1 is first in hosts array → target=h1
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h2'],
      ])
      const result = c.apply(p, [host('h1'), host('h2')])

      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-2')), h('h1'))
    })

    it('silently skips VMs absent from placement', () => {
      // vm-ghost is in vmIds but not in placement — only vm-1 and vm-2 count
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2'), v('vm-ghost')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h2'],
      ])
      const result = c.apply(p, [host('h1'), host('h2')])

      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-2')), h('h1'))
    })

    it('silently skips VMs on hosts not in the hosts array', () => {
      // vm-3 is on 'excluded' which is not offered as a destination
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2'), v('vm-3')])
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
        ['vm-3', 'excluded'],
      ])
      // vm-3 is excluded from hostCount → doesn't influence target → can't be moved
      const result = c.apply(p, [host('h1'), host('h2')])

      assert.equal(result.size, 0) // vm-3 can't migrate (excluded host), others already colocated
    })
  })

  describe('anti-affinity conflict detection', () => {
    it('skips a VM whose move to the target would violate its anti-affinity group', () => {
      // Coalition: vm-1 (h1), vm-2 (h2)
      // vm-2 is in anti-affinity group "db", and vm-3 (also "db") is already on h1
      // Moving vm-2 → h1 would put two "db" VMs on h1 → conflict → skip vm-2
      const aaData = mkAntiAffinityData('db', ['vm-2', 'vm-3'], ['vm-2'])
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2')], aaData)
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h2'],
        ['vm-3', 'h1'], // another "db" VM already on h1
      ])

      assert.equal(c.apply(p, [host('h1'), host('h2')]).size, 0)
    })

    it('does NOT skip a VM when the target host has no other VMs from its anti-affinity group', () => {
      // Same setup but vm-3 is on h2, not h1 → no conflict → vm-2 can move
      const aaData = mkAntiAffinityData('db', ['vm-2', 'vm-3'], ['vm-2'])
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2')], aaData)
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h2'],
        ['vm-3', 'h2'], // vm-3 is on h2, not on target h1
      ])
      const result = c.apply(p, [host('h1'), host('h2')])

      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-2')), h('h1'))
    })

    it('moves coalition members that have no anti-affinity conflict even when one is skipped', () => {
      // h1=[vm-1, vm-2, vm-3] (majority), h2=[vm-4, vm-5] → target=h1 (count=3)
      // vm-4 has anti-affinity=db; vm-extra (also db) is on h1 → moving vm-4→h1 conflicts → skip
      // vm-5 has no anti-affinity → moves freely to h1
      const aaData = mkAntiAffinityData('db', ['vm-4', 'vm-extra'], ['vm-4'])
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2'), v('vm-3'), v('vm-4'), v('vm-5')], aaData)
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h1'],
        ['vm-3', 'h1'],
        ['vm-4', 'h2'],
        ['vm-5', 'h2'],
        ['vm-extra', 'h1'], // non-coalition VM in "db" group, already on h1 — blocks vm-4
      ])
      const result = c.apply(p, [host('h1'), host('h2')])

      assert.equal(result.size, 1)
      assert.equal(result.get(v('vm-5')), h('h1'))
      assert.equal(result.has(v('vm-4')), false)
    })

    it('checks conflict against the placement passed in (reflects earlier anti-affinity moves)', () => {
      // The solver passes the post-anti-affinity placement to affinity.
      // Simulate: anti-affinity already moved vm-4 to h1 (it appears on h1 in placement).
      // vm-2 (affinity=web, anti-affinity=db) cannot go to h1 because vm-4 (db) is there.
      const aaData = mkAntiAffinityData('db', ['vm-2', 'vm-4'], ['vm-2'])
      const c = new AffinityConstraint(groups('web'), [v('vm-1'), v('vm-2')], aaData)
      const p = mkPlacement([
        ['vm-1', 'h1'],
        ['vm-2', 'h2'],
        ['vm-4', 'h1'], // placed here by anti-affinity constraint before affinity ran
      ])

      assert.equal(c.apply(p, [host('h1'), host('h2')]).size, 0)
    })
  })
})
