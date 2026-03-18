import type { XoHost, XoVm } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { parseAllVmTags } from './tag-parser.mjs'
import type { LoadBalancePlan, MigrationPlan, VmLoadBalancerTags } from './types.mjs'

const { warn } = createLogger('xo:tag-balancer')

type HostId = XoHost['id']
type VmId = XoVm['id']

interface PlacementState {
  placement: Map<VmId, HostId>
  hostMemoryUsed: Map<HostId, number>
  hostMemoryTotal: Map<HostId, number>
}

function wouldViolateAntiAffinity(
  vmTags: VmLoadBalancerTags,
  targetHostId: HostId,
  placement: Map<VmId, HostId>,
  allTags: Map<VmId, VmLoadBalancerTags>
): boolean {
  for (const group of vmTags.antiAffinityGroups) {
    for (const [otherVmId, otherHostId] of placement) {
      if (otherHostId !== targetHostId) {
        continue
      }
      const otherTags = allTags.get(otherVmId)
      if (otherTags !== undefined && otherTags.antiAffinityGroups.has(group)) {
        return true
      }
    }
  }
  return false
}

function hostHasEnoughMemory(hostId: HostId, vmMemorySize: number, state: PlacementState): boolean {
  const used = state.hostMemoryUsed.get(hostId) ?? 0
  const total = state.hostMemoryTotal.get(hostId) ?? 0
  return used + vmMemorySize <= total
}

function updatePlacement(
  state: PlacementState,
  vmId: VmId,
  vmMemorySize: number,
  fromHostId: HostId,
  toHostId: HostId
): void {
  state.placement.set(vmId, toHostId)

  const fromUsed = state.hostMemoryUsed.get(fromHostId) ?? 0
  state.hostMemoryUsed.set(fromHostId, fromUsed - vmMemorySize)

  const toUsed = state.hostMemoryUsed.get(toHostId) ?? 0
  state.hostMemoryUsed.set(toHostId, toUsed + vmMemorySize)
}

// Phase 1: Resolve anti-affinity violations
// VMs with the same anti-affinity tag must be on different hosts
function resolveAntiAffinity(
  eligibleVms: Pick<XoVm, 'id' | 'memory'>[],
  allTags: Map<VmId, VmLoadBalancerTags>,
  state: PlacementState,
  hostIds: HostId[],
  vmMemoryMap: Map<VmId, number>,
  migrations: MigrationPlan
): void {
  // Group VMs by anti-affinity tag
  const antiAffinityGroups = new Map<string, VmId[]>()

  for (const vm of eligibleVms) {
    const tags = allTags.get(vm.id)
    if (tags === undefined) {
      continue
    }
    for (const group of tags.antiAffinityGroups) {
      let vms = antiAffinityGroups.get(group)
      if (vms === undefined) {
        vms = []
        antiAffinityGroups.set(group, vms)
      }
      vms.push(vm.id)
    }
  }

  for (const [group, vmIds] of antiAffinityGroups) {
    // Find hosts with more than 1 VM from this group
    const hostToVms = new Map<HostId, VmId[]>()
    for (const vmId of vmIds) {
      const hostId = state.placement.get(vmId)
      if (hostId === undefined) {
        continue
      }
      let vms = hostToVms.get(hostId)
      if (vms === undefined) {
        vms = []
        hostToVms.set(hostId, vms)
      }
      vms.push(vmId)
    }

    for (const [_hostId, vmsOnHost] of hostToVms) {
      if (vmsOnHost.length <= 1) {
        continue
      }

      // Keep the heaviest VM, move the rest (cheaper to move small VMs)
      const sorted = [...vmsOnHost].sort((a, b) => (vmMemoryMap.get(a) ?? 0) - (vmMemoryMap.get(b) ?? 0))
      // Remove last (heaviest), move the rest
      sorted.pop()

      for (const vmId of sorted) {
        const vmMem = vmMemoryMap.get(vmId) ?? 0
        const currentHostId = state.placement.get(vmId)
        if (currentHostId === undefined) {
          continue
        }

        // Find a host that doesn't have a VM with the same anti-affinity group
        const targetHostId = hostIds.find(hId => {
          if (hId === currentHostId) {
            return false
          }
          if (!hostHasEnoughMemory(hId, vmMem, state)) {
            return false
          }
          // Check no VM with same group on target
          for (const [otherVmId, otherHostId] of state.placement) {
            if (otherHostId !== hId) {
              continue
            }
            const otherTags = allTags.get(otherVmId)
            if (otherTags !== undefined && otherTags.antiAffinityGroups.has(group)) {
              return false
            }
          }
          return true
        })

        if (targetHostId !== undefined) {
          migrations[vmId as string] = targetHostId as string
          updatePlacement(state, vmId, vmMem, currentHostId, targetHostId)
        } else {
          warn('no host available for anti-affinity resolution', { vmId, group })
        }
      }
    }
  }
}

// Phase 2: Resolve affinity violations
// VMs with the same affinity tag should be on the same host
function resolveAffinity(
  eligibleVms: Pick<XoVm, 'id' | 'memory'>[],
  allTags: Map<VmId, VmLoadBalancerTags>,
  state: PlacementState,
  vmMemoryMap: Map<VmId, number>,
  migrations: MigrationPlan
): void {
  // Group VMs by affinity tag
  const affinityGroups = new Map<string, VmId[]>()

  for (const vm of eligibleVms) {
    const tags = allTags.get(vm.id)
    if (tags === undefined) {
      continue
    }
    for (const group of tags.affinityGroups) {
      let vms = affinityGroups.get(group)
      if (vms === undefined) {
        vms = []
        affinityGroups.set(group, vms)
      }
      vms.push(vm.id)
    }
  }

  for (const [_group, vmIds] of affinityGroups) {
    // Find the best host: the one with the most VMs from this group
    const hostCounts = new Map<HostId, number>()
    for (const vmId of vmIds) {
      const hostId = state.placement.get(vmId)
      if (hostId === undefined) {
        continue
      }
      hostCounts.set(hostId, (hostCounts.get(hostId) ?? 0) + 1)
    }

    let bestHostId: HostId | undefined
    let bestCount = 0
    for (const [hostId, count] of hostCounts) {
      if (count > bestCount) {
        bestCount = count
        bestHostId = hostId
      }
    }

    if (bestHostId === undefined) {
      continue
    }

    // Move VMs not on the best host to the best host
    for (const vmId of vmIds) {
      const currentHostId = state.placement.get(vmId)
      if (currentHostId === undefined || currentHostId === bestHostId) {
        continue
      }

      const vmMem = vmMemoryMap.get(vmId) ?? 0
      const vmTags = allTags.get(vmId)

      // Don't create anti-affinity violations
      if (vmTags !== undefined && wouldViolateAntiAffinity(vmTags, bestHostId, state.placement, allTags)) {
        continue
      }

      if (!hostHasEnoughMemory(bestHostId, vmMem, state)) {
        continue
      }

      migrations[vmId as string] = bestHostId as string
      updatePlacement(state, vmId, vmMem, currentHostId, bestHostId)
    }
  }
}

// Phase 3: Balance memory across hosts
function balanceMemory(
  eligibleVms: Pick<XoVm, 'id' | 'memory'>[],
  allTags: Map<VmId, VmLoadBalancerTags>,
  state: PlacementState,
  hostIds: HostId[],
  migrations: MigrationPlan
): void {
  const totalUsed = [...state.hostMemoryUsed.values()].reduce((sum, v) => sum + v, 0)
  const avgMemoryUsage = totalUsed / hostIds.length
  const threshold = avgMemoryUsage * 0.15

  const overloadedHosts = hostIds
    .filter(hId => (state.hostMemoryUsed.get(hId) ?? 0) > avgMemoryUsage + threshold)
    .sort((a, b) => (state.hostMemoryUsed.get(b) ?? 0) - (state.hostMemoryUsed.get(a) ?? 0))

  for (const srcHostId of overloadedHosts) {
    let excess = (state.hostMemoryUsed.get(srcHostId) ?? 0) - avgMemoryUsage

    // Get VMs on this host that can be moved (no affinity constraints)
    const candidateVms = eligibleVms
      .filter(vm => {
        if (state.placement.get(vm.id) !== srcHostId) {
          return false
        }
        const tags = allTags.get(vm.id)
        return tags === undefined || tags.affinityGroups.size === 0
      })
      .sort((a, b) => Math.abs(a.memory.size - excess) - Math.abs(b.memory.size - excess))

    for (const vm of candidateVms) {
      if (excess <= 0) {
        break
      }

      const vmMem = vm.memory.size
      const vmTags = allTags.get(vm.id)

      // Find least loaded underloaded host
      const underloadedHosts = hostIds
        .filter(hId => (state.hostMemoryUsed.get(hId) ?? 0) < avgMemoryUsage - threshold)
        .filter(hId => hostHasEnoughMemory(hId, vmMem, state))
        .filter(hId => {
          if (vmTags === undefined) {
            return true
          }
          return !wouldViolateAntiAffinity(vmTags, hId, state.placement, allTags)
        })
        .sort((a, b) => (state.hostMemoryUsed.get(a) ?? 0) - (state.hostMemoryUsed.get(b) ?? 0))

      const targetHostId = underloadedHosts[0]
      if (targetHostId !== undefined) {
        migrations[vm.id as string] = targetHostId as string
        updatePlacement(state, vm.id, vmMem, srcHostId, targetHostId)
        excess -= vmMem
      }
    }
  }
}

export function computeLoadBalancePlan(
  hosts: Pick<XoHost, 'id' | 'memory'>[],
  vms: Pick<XoVm, 'id' | 'memory' | 'tags' | 'power_state' | '$container'>[],
  plan: LoadBalancePlan
): MigrationPlan {
  const allTags = parseAllVmTags(vms)
  const hostIds = hosts.map(h => h.id)

  // Filter eligible VMs: running, not ignored
  const eligibleVms = vms.filter(vm => {
    if (vm.power_state !== 'Running') {
      return false
    }
    const tags = allTags.get(vm.id)
    return tags === undefined || !tags.ignore
  })

  const migrations: MigrationPlan = {}

  // Build VM memory lookup once for all phases
  const vmMemoryMap = new Map<VmId, number>()
  for (const vm of eligibleVms) {
    vmMemoryMap.set(vm.id, vm.memory.size)
  }

  // Build placement state
  const placement = new Map<VmId, HostId>()
  const hostMemoryUsed = new Map<HostId, number>()
  const hostMemoryTotal = new Map<HostId, number>()

  for (const host of hosts) {
    hostMemoryUsed.set(host.id, host.memory.usage)
    hostMemoryTotal.set(host.id, host.memory.size)
  }

  for (const vm of eligibleVms) {
    // $container is the host ID for running VMs
    placement.set(vm.id, vm.$container as HostId)
  }

  const state: PlacementState = { placement, hostMemoryUsed, hostMemoryTotal }

  // Phase 1: Anti-affinity (highest priority)
  resolveAntiAffinity(eligibleVms, allTags, state, hostIds, vmMemoryMap, migrations)

  // Phase 2: Affinity (respects anti-affinity)
  resolveAffinity(eligibleVms, allTags, state, vmMemoryMap, migrations)

  // Phase 3: Memory balance (only for non-simple modes)
  if (plan.mode !== 'simple') {
    balanceMemory(eligibleVms, allTags, state, hostIds, migrations)
  }

  return migrations
}
