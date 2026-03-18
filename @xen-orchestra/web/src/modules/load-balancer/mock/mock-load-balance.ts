import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import {
  getAffinityGroups,
  getAntiAffinityGroups,
  isLoadBalancerIgnored,
} from '@/modules/load-balancer/utils/load-balancer-tags.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VM_POWER_STATE, type XoHost, type XoVm } from '@vates/types'

const MAX_CPU_USAGE_PERCENT = 90
const MIN_FREE_MEMORY_BYTES = 1024 * 1024 * 1024 // 1 GB

/**
 * Mock implementation of pool.loadBalance(plan, { dryRun: true })
 *
 * Returns a Record<XoVm["id"], XoHost["id"]> mapping VMs to their target host.
 * Only includes VMs that would actually be migrated (target differs from current host).
 *
 * Strategy:
 * 1. Skip ignored VMs
 * 2. Enforce affinity: group VMs of same group on one host
 * 3. Enforce anti-affinity (priority over affinity): spread VMs across hosts
 * 4. Respect host constraints: max 90% CPU, at least 1GB free memory
 * 5. Minimize memory migrations by only moving what's necessary
 * 6. No storage migration
 */
export function mockLoadBalance(vms: FrontXoVm[], hosts: FrontXoHost[]): Record<XoVm['id'], XoHost['id']> {
  const result: Record<XoVm['id'], XoHost['id']> = {}
  const runningVms = vms.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING)
  const availableHosts = hosts.filter(host => host.power_state === 'Running')

  if (availableHosts.length === 0) {
    return result
  }

  const currentPlacement = new Map<XoVm['id'], XoHost['id']>()
  const targetPlacement = new Map<XoVm['id'], XoHost['id']>()

  for (const vm of runningVms) {
    if (vm.$container !== vm.$pool) {
      currentPlacement.set(vm.id, vm.$container as XoHost['id'])
      targetPlacement.set(vm.id, vm.$container as XoHost['id'])
    }
  }

  // Track simulated memory allocation per host
  const hostAllocatedMemory = new Map<XoHost['id'], number>()
  const hostAllocatedVcpus = new Map<XoHost['id'], number>()

  for (const host of availableHosts) {
    hostAllocatedMemory.set(host.id, 0)
    hostAllocatedVcpus.set(host.id, 0)
  }

  for (const vm of runningVms) {
    const hostId = currentPlacement.get(vm.id)

    if (hostId === undefined) {
      continue
    }

    hostAllocatedMemory.set(hostId, (hostAllocatedMemory.get(hostId) ?? 0) + vm.memory.size)
    hostAllocatedVcpus.set(hostId, (hostAllocatedVcpus.get(hostId) ?? 0) + vm.CPUs.number)
  }

  // Collect affinity and anti-affinity groups
  const antiAffinityGroups = new Map<string, FrontXoVm[]>()
  const affinityGroups = new Map<string, FrontXoVm[]>()

  for (const vm of runningVms) {
    if (isLoadBalancerIgnored(vm.tags)) {
      continue
    }

    for (const group of getAntiAffinityGroups(vm.tags)) {
      const groupVms = antiAffinityGroups.get(group) ?? []
      groupVms.push(vm)
      antiAffinityGroups.set(group, groupVms)
    }

    for (const group of getAffinityGroups(vm.tags)) {
      const groupVms = affinityGroups.get(group) ?? []
      groupVms.push(vm)
      affinityGroups.set(group, groupVms)
    }
  }

  // Apply affinity: move VMs in same group to the host that has the most of them already
  for (const [, groupVms] of affinityGroups) {
    if (groupVms.length <= 1) {
      continue
    }

    const hostCounts = new Map<XoHost['id'], number>()

    for (const vm of groupVms) {
      const hostId = targetPlacement.get(vm.id)

      if (hostId !== undefined) {
        hostCounts.set(hostId, (hostCounts.get(hostId) ?? 0) + 1)
      }
    }

    let bestHost: XoHost['id'] | undefined
    let bestCount = 0

    for (const [hostId, count] of hostCounts) {
      if (count > bestCount) {
        bestCount = count
        bestHost = hostId
      }
    }

    if (bestHost !== undefined) {
      for (const vm of groupVms) {
        // Skip VMs already on the target host
        if (targetPlacement.get(vm.id) === bestHost) {
          continue
        }

        if (canHostAcceptVm(bestHost, vm, availableHosts, hostAllocatedMemory, hostAllocatedVcpus)) {
          moveVm(vm, bestHost, targetPlacement, hostAllocatedMemory, hostAllocatedVcpus)
        }
      }
    }
  }

  // Apply anti-affinity (priority over affinity and capacity constraints)
  // Spread VMs of same anti-affinity group across different hosts
  for (const [, groupVms] of antiAffinityGroups) {
    if (groupVms.length <= 1) {
      continue
    }

    const hostIds = availableHosts.map(host => host.id)

    for (const [index, vm] of groupVms.entries()) {
      const targetHostId = hostIds[index % hostIds.length]

      if (targetHostId === undefined || targetPlacement.get(vm.id) === targetHostId) {
        continue
      }

      // Anti-affinity is a hard constraint: force the move even if host capacity is tight
      moveVm(vm, targetHostId, targetPlacement, hostAllocatedMemory, hostAllocatedVcpus)
    }
  }

  // Rebalance overloaded hosts (memory and CPU constraints)
  for (const host of availableHosts) {
    if (!isHostOverloaded(host, hostAllocatedMemory, hostAllocatedVcpus)) {
      continue
    }

    const hostVms = runningVms
      .filter(vm => targetPlacement.get(vm.id) === host.id && !isLoadBalancerIgnored(vm.tags))
      .sort((a, b) => a.memory.size - b.memory.size) // migrate smallest VMs first to minimize impact

    for (const vm of hostVms) {
      if (!isHostOverloaded(host, hostAllocatedMemory, hostAllocatedVcpus)) {
        break
      }

      const targetHost = findBestHost(vm, host.id, availableHosts, hostAllocatedMemory, hostAllocatedVcpus)

      if (targetHost !== undefined) {
        moveVm(vm, targetHost, targetPlacement, hostAllocatedMemory, hostAllocatedVcpus)
      }
    }
  }

  // Build result: only include VMs that actually need to move
  for (const [vmId, targetHostId] of targetPlacement) {
    const currentHostId = currentPlacement.get(vmId)

    if (currentHostId !== undefined && currentHostId !== targetHostId) {
      result[vmId] = targetHostId
    }
  }

  return result
}

function getHostCpuCores(host: FrontXoHost): number {
  if (host.cpus.cores !== undefined && host.cpus.sockets !== undefined) {
    return host.cpus.cores * host.cpus.sockets
  }

  // Fallback: use deprecated CPUs record which may contain cpu_count
  const cpuCount = Number(host.CPUs?.cpu_count)

  if (!isNaN(cpuCount) && cpuCount > 0) {
    return cpuCount
  }

  // Last resort: assume enough cores to not block migrations
  return 64
}

function isHostOverloaded(
  host: FrontXoHost,
  allocatedMemory: Map<XoHost['id'], number>,
  allocatedVcpus: Map<XoHost['id'], number>
): boolean {
  const freeMemory = host.memory.size - (allocatedMemory.get(host.id) ?? 0)
  const cpuCores = getHostCpuCores(host)
  const vcpus = allocatedVcpus.get(host.id) ?? 0
  const cpuUsagePercent = (vcpus / cpuCores) * 100

  return freeMemory < MIN_FREE_MEMORY_BYTES || cpuUsagePercent > MAX_CPU_USAGE_PERCENT
}

function canHostAcceptVm(
  hostId: XoHost['id'],
  vm: FrontXoVm,
  hosts: FrontXoHost[],
  allocatedMemory: Map<XoHost['id'], number>,
  allocatedVcpus: Map<XoHost['id'], number>
): boolean {
  const host = hosts.find(h => h.id === hostId)

  if (host === undefined) {
    return false
  }

  const currentAllocated = allocatedMemory.get(hostId) ?? 0
  const freeMemoryAfter = host.memory.size - currentAllocated - vm.memory.size

  if (freeMemoryAfter < MIN_FREE_MEMORY_BYTES) {
    return false
  }

  const cpuCores = getHostCpuCores(host)
  const currentVcpus = allocatedVcpus.get(hostId) ?? 0
  const cpuUsageAfter = ((currentVcpus + vm.CPUs.number) / cpuCores) * 100

  if (cpuUsageAfter > MAX_CPU_USAGE_PERCENT) {
    return false
  }

  return true
}

function findBestHost(
  vm: FrontXoVm,
  excludeHostId: XoHost['id'],
  hosts: FrontXoHost[],
  allocatedMemory: Map<XoHost['id'], number>,
  allocatedVcpus: Map<XoHost['id'], number>
): XoHost['id'] | undefined {
  let bestHost: XoHost['id'] | undefined
  let bestFreeMemory = 0

  for (const host of hosts) {
    if (host.id === excludeHostId) {
      continue
    }

    if (!canHostAcceptVm(host.id, vm, hosts, allocatedMemory, allocatedVcpus)) {
      continue
    }

    const freeMemory = host.memory.size - (allocatedMemory.get(host.id) ?? 0)

    if (freeMemory > bestFreeMemory) {
      bestFreeMemory = freeMemory
      bestHost = host.id
    }
  }

  return bestHost
}

function moveVm(
  vm: FrontXoVm,
  targetHostId: XoHost['id'],
  targetPlacement: Map<XoVm['id'], XoHost['id']>,
  allocatedMemory: Map<XoHost['id'], number>,
  allocatedVcpus: Map<XoHost['id'], number>
): void {
  const currentHostId = targetPlacement.get(vm.id)

  // Deallocate from current host
  if (currentHostId !== undefined) {
    allocatedMemory.set(currentHostId, (allocatedMemory.get(currentHostId) ?? 0) - vm.memory.size)
    allocatedVcpus.set(currentHostId, (allocatedVcpus.get(currentHostId) ?? 0) - vm.CPUs.number)
  }

  // Allocate to target host
  allocatedMemory.set(targetHostId, (allocatedMemory.get(targetHostId) ?? 0) + vm.memory.size)
  allocatedVcpus.set(targetHostId, (allocatedVcpus.get(targetHostId) ?? 0) + vm.CPUs.number)

  targetPlacement.set(vm.id, targetHostId)
}
