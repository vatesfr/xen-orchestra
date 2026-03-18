import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { MigrationEntry } from '@/modules/pool/types/load-balancer.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getLoadBalancerConfig } from '@/modules/vm/utils/load-balancer-tags.util.ts'
import type { XoHost, XoVm } from '@vates/types'

/**
 * Transforms the API response `Record<XoVm["id"], XoHost["id"]>` into display entries.
 */
export function resolveLoadBalanceApiResponse(
  apiResponse: Record<string, string>,
  vms: FrontXoVm[],
  hosts: FrontXoHost[]
): MigrationEntry[] {
  const vmMap = new Map(vms.map(vm => [vm.id, vm]))
  const hostMap = new Map(hosts.map(host => [host.id, host]))

  return Object.entries(apiResponse).flatMap(([vmId, targetHostId]) => {
    const vm = vmMap.get(vmId as XoVm['id'])

    if (vm === undefined) {
      return []
    }

    const currentHostId = vm.$container as XoHost['id']
    const currentHost = hostMap.get(currentHostId)
    const targetHost = hostMap.get(targetHostId as XoHost['id'])

    if (currentHost === undefined || targetHost === undefined) {
      return []
    }

    const config = getLoadBalancerConfig(vm.tags)
    const reason = inferMigrationReason(config)

    return [
      {
        vmId: vm.id,
        vmName: vm.name_label,
        currentHostId,
        currentHostName: currentHost.name_label,
        targetHostId: targetHostId as XoHost['id'],
        targetHostName: targetHost.name_label,
        reason: reason.type,
        group: reason.group,
      },
    ]
  })
}

function inferMigrationReason(config: ReturnType<typeof getLoadBalancerConfig>): {
  type: 'affinity' | 'anti-affinity'
  group: string
} {
  if (config.antiAffinityGroups.length > 0) {
    return { type: 'anti-affinity', group: config.antiAffinityGroups[0] }
  }

  if (config.affinityGroups.length > 0) {
    return { type: 'affinity', group: config.affinityGroups[0] }
  }

  return { type: 'affinity', group: '' }
}

// ---------------------------------------------------------------------------
// Mock implementation (client-side computation from VM tags)
// TODO: remove when backend is ready
// ---------------------------------------------------------------------------

export function computeMockMigrationPlan(vms: FrontXoVm[], hosts: FrontXoHost[]): MigrationEntry[] {
  if (hosts.length < 2) {
    return []
  }

  const hostMap = new Map(hosts.map(host => [host.id, host]))
  const result: MigrationEntry[] = []
  const alreadyMoved = new Set<XoVm['id']>()

  processAntiAffinity(vms, hosts, hostMap, alreadyMoved, result)
  processAffinity(vms, hosts, hostMap, alreadyMoved, result)

  return result
}

function processAntiAffinity(
  vms: FrontXoVm[],
  hosts: FrontXoHost[],
  hostMap: Map<XoHost['id'], FrontXoHost>,
  alreadyMoved: Set<XoVm['id']>,
  result: MigrationEntry[]
): void {
  const groups = new Map<string, FrontXoVm[]>()

  for (const vm of vms) {
    const config = getLoadBalancerConfig(vm.tags)

    if (config.isIgnored) {
      continue
    }

    for (const group of config.antiAffinityGroups) {
      if (!groups.has(group)) {
        groups.set(group, [])
      }

      const groupVms = groups.get(group)

      if (groupVms !== undefined) {
        groupVms.push(vm)
      }
    }
  }

  for (const [group, groupVms] of groups) {
    const distribution = new Map<XoHost['id'], FrontXoVm[]>()

    for (const host of hosts) {
      distribution.set(host.id, [])
    }

    for (const vm of groupVms) {
      const hostId = vm.$container as XoHost['id']
      const hostVms = distribution.get(hostId)

      if (hostVms !== undefined) {
        hostVms.push(vm)
      }
    }

    const targetPerHost = Math.ceil(groupVms.length / hosts.length)

    for (const [hostId, hostVms] of distribution) {
      while (hostVms.length > targetPerHost) {
        const vm = hostVms.pop()

        if (vm === undefined || alreadyMoved.has(vm.id)) {
          continue
        }

        const targetHostId = findLeastLoadedHost(distribution, hostId)

        if (targetHostId === undefined) {
          break
        }

        const currentHost = hostMap.get(hostId)
        const targetHost = hostMap.get(targetHostId)

        if (currentHost === undefined || targetHost === undefined) {
          break
        }

        result.push({
          vmId: vm.id,
          vmName: vm.name_label,
          currentHostId: hostId,
          currentHostName: currentHost.name_label,
          targetHostId,
          targetHostName: targetHost.name_label,
          reason: 'anti-affinity',
          group,
        })

        const targetHostVms = distribution.get(targetHostId)

        if (targetHostVms !== undefined) {
          targetHostVms.push(vm)
        }

        alreadyMoved.add(vm.id)
      }
    }
  }
}

function processAffinity(
  vms: FrontXoVm[],
  hosts: FrontXoHost[],
  hostMap: Map<XoHost['id'], FrontXoHost>,
  alreadyMoved: Set<XoVm['id']>,
  result: MigrationEntry[]
): void {
  const groups = new Map<string, FrontXoVm[]>()

  for (const vm of vms) {
    const config = getLoadBalancerConfig(vm.tags)

    if (config.isIgnored) {
      continue
    }

    for (const group of config.affinityGroups) {
      if (!groups.has(group)) {
        groups.set(group, [])
      }

      const groupVms = groups.get(group)

      if (groupVms !== undefined) {
        groupVms.push(vm)
      }
    }
  }

  for (const [group, groupVms] of groups) {
    const hostCounts = new Map<XoHost['id'], number>()

    for (const vm of groupVms) {
      const hostId = vm.$container as XoHost['id']
      hostCounts.set(hostId, (hostCounts.get(hostId) ?? 0) + 1)
    }

    let bestHostId: XoHost['id'] | undefined
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

    const targetHost = hostMap.get(bestHostId)

    if (targetHost === undefined) {
      continue
    }

    for (const vm of groupVms) {
      const currentHostId = vm.$container as XoHost['id']

      if (currentHostId === bestHostId || alreadyMoved.has(vm.id)) {
        continue
      }

      const currentHost = hostMap.get(currentHostId)

      if (currentHost === undefined) {
        continue
      }

      result.push({
        vmId: vm.id,
        vmName: vm.name_label,
        currentHostId,
        currentHostName: currentHost.name_label,
        targetHostId: bestHostId,
        targetHostName: targetHost.name_label,
        reason: 'affinity',
        group,
      })

      alreadyMoved.add(vm.id)
    }
  }
}

function findLeastLoadedHost(
  distribution: Map<XoHost['id'], FrontXoVm[]>,
  excludeHostId: XoHost['id']
): XoHost['id'] | undefined {
  let minCount = Infinity
  let minHostId: XoHost['id'] | undefined

  for (const [hostId, hostVms] of distribution) {
    if (hostId === excludeHostId) {
      continue
    }

    if (hostVms.length < minCount) {
      minCount = hostVms.length
      minHostId = hostId
    }
  }

  return minHostId
}
