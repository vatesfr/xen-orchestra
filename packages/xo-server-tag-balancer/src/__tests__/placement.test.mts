import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeLoadBalancePlan } from '../placement.mjs'
import type { XoHost, XoVm } from '@vates/types'

type MockVm = Pick<XoVm, 'id' | 'memory' | 'tags' | 'power_state' | '$container'>
type MockHost = Pick<XoHost, 'id' | 'memory'>

function makeHost(id: string, memorySize: number, memoryUsage: number): MockHost {
  return {
    id: id as XoHost['id'],
    memory: { size: memorySize, usage: memoryUsage },
  }
}

function makeVm(
  id: string,
  hostId: string,
  memorySize: number,
  tags: string[] = [],
  powerState: 'Running' | 'Halted' = 'Running'
): MockVm {
  return {
    id: id as XoVm['id'],
    $container: hostId as XoHost['id'],
    memory: { dynamic: [memorySize, memorySize], size: memorySize, static: [memorySize, memorySize] },
    tags,
    power_state: powerState,
  }
}

describe('computeLoadBalancePlan', () => {
  describe('basic cases', () => {
    it('returns empty plan when no VMs', () => {
      const hosts = [makeHost('h1', 16e9, 4e9), makeHost('h2', 16e9, 4e9)]
      const result = computeLoadBalancePlan(hosts, [], { mode: 'simple' })
      assert.deepEqual(result, {})
    })

    it('returns empty plan when cluster is balanced', () => {
      const hosts = [makeHost('h1', 16e9, 8e9), makeHost('h2', 16e9, 8e9)]
      const vms = [makeVm('vm1', 'h1', 4e9), makeVm('vm2', 'h2', 4e9)]
      const result = computeLoadBalancePlan(hosts, vms, { mode: 'simple' })
      assert.deepEqual(result, {})
    })

    it('excludes halted VMs', () => {
      const hosts = [makeHost('h1', 16e9, 8e9), makeHost('h2', 16e9, 2e9)]
      const vms = [
        makeVm('vm1', 'h1', 4e9, ['xo:load:balancer:anti-affinity=db'], 'Halted'),
        makeVm('vm2', 'h1', 4e9, ['xo:load:balancer:anti-affinity=db']),
      ]
      const result = computeLoadBalancePlan(hosts, vms, { mode: 'simple' })
      // Only 1 running VM with anti-affinity, no violation
      assert.deepEqual(result, {})
    })

    it('excludes VMs with ignore tag', () => {
      const hosts = [makeHost('h1', 16e9, 8e9), makeHost('h2', 16e9, 2e9)]
      const vms = [
        makeVm('vm1', 'h1', 4e9, ['xo:load:balancer:anti-affinity=db', 'xo:load:balancer:ignore']),
        makeVm('vm2', 'h1', 4e9, ['xo:load:balancer:anti-affinity=db']),
      ]
      const result = computeLoadBalancePlan(hosts, vms, { mode: 'simple' })
      // vm1 is ignored, only vm2 has anti-affinity, no violation
      assert.deepEqual(result, {})
    })
  })

  describe('anti-affinity', () => {
    it('moves VM when two anti-affinity VMs are on the same host', () => {
      const hosts = [makeHost('h1', 16e9, 8e9), makeHost('h2', 16e9, 2e9)]
      const vms = [
        makeVm('vm1', 'h1', 4e9, ['xo:load:balancer:anti-affinity=db']),
        makeVm('vm2', 'h1', 2e9, ['xo:load:balancer:anti-affinity=db']),
      ]
      const result = computeLoadBalancePlan(hosts, vms, { mode: 'simple' })

      // The smaller VM (vm2, 2GB) should be moved to h2
      assert.equal(Object.keys(result).length, 1)
      assert.equal(result['vm2'], 'h2')
    })

    it('moves smaller VMs to satisfy anti-affinity', () => {
      const hosts = [makeHost('h1', 16e9, 10e9), makeHost('h2', 16e9, 2e9)]
      const vms = [
        makeVm('vm-big', 'h1', 8e9, ['xo:load:balancer:anti-affinity=group1']),
        makeVm('vm-small', 'h1', 1e9, ['xo:load:balancer:anti-affinity=group1']),
      ]
      const result = computeLoadBalancePlan(hosts, vms, { mode: 'simple' })
      // Smaller VM should move
      assert.equal(result['vm-small'], 'h2')
      assert.equal(result['vm-big'], undefined)
    })

    it('does nothing if no host available for anti-affinity', () => {
      // Only 1 host, can't resolve anti-affinity
      const hosts = [makeHost('h1', 16e9, 8e9)]
      const vms = [
        makeVm('vm1', 'h1', 4e9, ['xo:load:balancer:anti-affinity=db']),
        makeVm('vm2', 'h1', 2e9, ['xo:load:balancer:anti-affinity=db']),
      ]
      const result = computeLoadBalancePlan(hosts, vms, { mode: 'simple' })
      assert.deepEqual(result, {})
    })
  })

  describe('affinity', () => {
    it('moves VM to join affinity group on best host', () => {
      const hosts = [makeHost('h1', 16e9, 8e9), makeHost('h2', 16e9, 4e9)]
      const vms = [
        makeVm('vm1', 'h1', 2e9, ['xo:load:balancer:affinity=web']),
        makeVm('vm2', 'h1', 2e9, ['xo:load:balancer:affinity=web']),
        makeVm('vm3', 'h2', 2e9, ['xo:load:balancer:affinity=web']),
      ]
      const result = computeLoadBalancePlan(hosts, vms, { mode: 'simple' })

      // h1 has 2 VMs of the group, h2 has 1 -> vm3 should move to h1
      assert.equal(result['vm3'], 'h1')
    })

    it('does not violate anti-affinity when resolving affinity', () => {
      const hosts = [makeHost('h1', 16e9, 4e9), makeHost('h2', 16e9, 4e9)]
      const vms = [
        makeVm('vm1', 'h1', 2e9, ['xo:load:balancer:affinity=web', 'xo:load:balancer:anti-affinity=critical']),
        makeVm('vm2', 'h2', 2e9, ['xo:load:balancer:affinity=web', 'xo:load:balancer:anti-affinity=critical']),
      ]
      const result = computeLoadBalancePlan(hosts, vms, { mode: 'simple' })

      // Both VMs have affinity=web but also anti-affinity=critical
      // Moving either would violate anti-affinity -> no migration
      assert.deepEqual(result, {})
    })
  })

  describe('memory balance', () => {
    it('does not balance memory in simple mode', () => {
      const hosts = [makeHost('h1', 16e9, 15e9), makeHost('h2', 16e9, 1e9)]
      const vms = [makeVm('vm1', 'h1', 7e9), makeVm('vm2', 'h1', 7e9), makeVm('vm3', 'h2', 1e9)]
      const result = computeLoadBalancePlan(hosts, vms, { mode: 'simple' })
      assert.deepEqual(result, {})
    })

    it('balances memory in performance mode', () => {
      const hosts = [makeHost('h1', 16e9, 15e9), makeHost('h2', 16e9, 1e9)]
      const vms = [makeVm('vm1', 'h1', 7e9), makeVm('vm2', 'h1', 7e9), makeVm('vm3', 'h2', 1e9)]
      const result = computeLoadBalancePlan(hosts, vms, { mode: 'performance' })

      // h1 is overloaded (15GB used), h2 is underloaded (1GB used)
      // avg = 8GB, threshold = 1.2GB
      // Should move at least one VM from h1 to h2
      assert.ok(Object.keys(result).length > 0, 'should have at least one migration')
      const migratedVm = Object.keys(result)[0]
      assert.ok(migratedVm !== undefined)
      assert.equal(result[migratedVm!], 'h2')
    })

    it('does not move VMs with affinity constraints during balancing', () => {
      const hosts = [makeHost('h1', 16e9, 14e9), makeHost('h2', 16e9, 2e9)]
      const vms = [
        makeVm('vm-affinity', 'h1', 6e9, ['xo:load:balancer:affinity=web']),
        makeVm('vm-free', 'h1', 6e9),
        makeVm('vm-small', 'h2', 2e9),
      ]
      const result = computeLoadBalancePlan(hosts, vms, { mode: 'performance' })

      // vm-affinity should NOT be moved (has affinity constraint)
      assert.equal(result['vm-affinity'], undefined)
      // vm-free should be moved (h1 14GB vs h2 2GB, avg 8GB, well above 15% threshold)
      assert.equal(result['vm-free'], 'h2')
    })
  })
})
