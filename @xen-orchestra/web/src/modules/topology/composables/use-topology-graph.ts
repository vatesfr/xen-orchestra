import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  HostNodeData,
  PoolNodeData,
  SiteNodeData,
  TopologyEdge,
  TopologyNode,
  VmGroupNodeData,
} from '@/modules/topology/types/topology.types.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { XOA_NAME } from '@/shared/constants.ts'
import { VM_POWER_STATE } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { computed, ref, watch } from 'vue'

import { useTopologyLayout } from './use-topology-layout.ts'

const SITE_NODE_ID = 'site-root'

export function useTopologyGraph() {
  const { pools, arePoolsReady } = useXoPoolCollection()
  const { hostsByPool, hosts, areHostsReady } = useXoHostCollection()
  const { vmsByHost, hostLessVmsByPool, vms, areVmsReady } = useXoVmCollection()

  const isReady = logicAnd(arePoolsReady, areHostsReady, areVmsReady)

  const expandedNodes = ref<Set<string>>(new Set([SITE_NODE_ID]))

  // Auto-expand all pool and host nodes once data loads
  watch(
    () => ({ poolList: pools.value, hostList: hosts.value }),
    ({ poolList, hostList }) => {
      for (const pool of poolList) {
        expandedNodes.value.add(`pool-${pool.id}`)
      }
      for (const host of hostList) {
        expandedNodes.value.add(`host-${host.id}`)
      }
    },
    { immediate: true }
  )

  function toggleExpand(nodeId: string) {
    const next = new Set(expandedNodes.value)
    if (next.has(nodeId)) {
      next.delete(nodeId)
    } else {
      next.add(nodeId)
    }
    expandedNodes.value = next
  }

  const rawNodes = computed<TopologyNode[]>(() => {
    const nodes: TopologyNode[] = []
    const poolList = pools.value
    const expanded = expandedNodes.value

    nodes.push({
      id: SITE_NODE_ID,
      type: 'site',
      position: { x: 0, y: 0 },
      data: {
        type: 'site',
        label: XOA_NAME,
        poolCount: poolList.length,
        hostCount: hosts.value.length,
        vmCount: vms.value.length,
        isExpanded: expanded.has(SITE_NODE_ID),
        isExpandable: poolList.length > 0,
      } satisfies SiteNodeData,
    })

    if (!expanded.has(SITE_NODE_ID)) {
      return nodes
    }

    for (const pool of poolList) {
      const poolId = `pool-${pool.id}`
      const poolHosts = hostsByPool.value.get(pool.id) ?? []
      const poolVms = poolHosts.flatMap(h => vmsByHost.value.get(h.id) ?? [])
      const hostLessVms = hostLessVmsByPool.value.get(pool.id) ?? []
      const allPoolVms = [...poolVms, ...hostLessVms]

      nodes.push({
        id: poolId,
        type: 'pool',
        position: { x: 0, y: 0 },
        data: {
          type: 'pool',
          pool,
          hostCount: poolHosts.length,
          vmCount: allPoolVms.length,
          runningVmCount: allPoolVms.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING).length,
          isExpanded: expanded.has(poolId),
          isExpandable: poolHosts.length > 0 || hostLessVms.length > 0,
        } satisfies PoolNodeData,
      })

      if (!expanded.has(poolId)) {
        continue
      }

      for (const host of poolHosts) {
        const hostId = `host-${host.id}`
        const hostVms = vmsByHost.value.get(host.id) ?? []
        const runningCount = hostVms.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING).length

        nodes.push({
          id: hostId,
          type: 'host',
          position: { x: 0, y: 0 },
          data: {
            type: 'host',
            host,
            vmCount: hostVms.length,
            runningVmCount: runningCount,
            memorySize: host.memory.size,
            memoryUsage: host.memory.usage,
            isExpanded: expanded.has(hostId),
            isExpandable: hostVms.length > 0,
          } satisfies HostNodeData,
        })

        if (expanded.has(hostId) && hostVms.length > 0) {
          const vmGroupId = `vmgroup-host-${host.id}`

          nodes.push({
            id: vmGroupId,
            type: 'vm-group',
            position: { x: 0, y: 0 },
            data: {
              type: 'vm-group',
              vms: hostVms,
              runningCount,
              stoppedCount: hostVms.length - runningCount,
              isExpanded: expanded.has(vmGroupId),
              isExpandable: hostVms.length > 0,
            } satisfies VmGroupNodeData,
          })
        }
      }

      if (hostLessVms.length > 0) {
        const runningCount = hostLessVms.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING).length
        const vmGroupId = `vmgroup-pool-${pool.id}`

        nodes.push({
          id: vmGroupId,
          type: 'vm-group',
          position: { x: 0, y: 0 },
          data: {
            type: 'vm-group',
            vms: hostLessVms,
            runningCount,
            stoppedCount: hostLessVms.length - runningCount,
            isExpanded: expanded.has(vmGroupId),
            isExpandable: hostLessVms.length > 0,
          } satisfies VmGroupNodeData,
        })
      }
    }

    return nodes
  })

  const rawEdges = computed<TopologyEdge[]>(() => {
    const edges: TopologyEdge[] = []
    const poolList = pools.value
    const expanded = expandedNodes.value

    if (!expanded.has(SITE_NODE_ID)) {
      return edges
    }

    for (const pool of poolList) {
      const poolId = `pool-${pool.id}`

      edges.push({
        id: `e-site-pool-${pool.id}`,
        source: SITE_NODE_ID,
        target: poolId,
        type: 'topology',
      })

      if (!expanded.has(poolId)) {
        continue
      }

      const poolHosts = hostsByPool.value.get(pool.id) ?? []

      for (const host of poolHosts) {
        const hostId = `host-${host.id}`

        edges.push({
          id: `e-pool-host-${host.id}`,
          source: poolId,
          target: hostId,
          type: 'topology',
        })

        const hostVms = vmsByHost.value.get(host.id) ?? []

        if (expanded.has(hostId) && hostVms.length > 0) {
          edges.push({
            id: `e-host-vmgroup-${host.id}`,
            source: hostId,
            target: `vmgroup-host-${host.id}`,
            type: 'topology',
          })
        }
      }

      const hostLessVms = hostLessVmsByPool.value.get(pool.id) ?? []

      if (hostLessVms.length > 0) {
        edges.push({
          id: `e-pool-vmgroup-${pool.id}`,
          source: poolId,
          target: `vmgroup-pool-${pool.id}`,
          type: 'topology',
        })
      }
    }

    return edges
  })

  const layouted = useTopologyLayout(rawNodes, rawEdges)

  return {
    nodes: computed(() => layouted.value.nodes),
    edges: computed(() => layouted.value.edges),
    isReady,
    expandedNodes,
    toggleExpand,
  }
}
