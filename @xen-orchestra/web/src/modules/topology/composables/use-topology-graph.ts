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
import { computed } from 'vue'

import { useTopologyLayout } from './use-topology-layout.ts'

const SITE_NODE_ID = 'site-root'

export function useTopologyGraph() {
  const { pools, arePoolsReady } = useXoPoolCollection()
  const { hostsByPool, hosts, areHostsReady } = useXoHostCollection()
  const { vmsByHost, hostLessVmsByPool, vms, areVmsReady } = useXoVmCollection()

  const isReady = logicAnd(arePoolsReady, areHostsReady, areVmsReady)

  const rawNodes = computed<TopologyNode[]>(() => {
    const nodes: TopologyNode[] = []
    const poolList = pools.value

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
      } satisfies SiteNodeData,
    })

    for (const pool of poolList) {
      const poolHosts = hostsByPool.value.get(pool.id) ?? []
      const poolVms = poolHosts.flatMap(h => vmsByHost.value.get(h.id) ?? [])
      const hostLessVms = hostLessVmsByPool.value.get(pool.id) ?? []
      const allPoolVms = [...poolVms, ...hostLessVms]

      nodes.push({
        id: `pool-${pool.id}`,
        type: 'pool',
        position: { x: 0, y: 0 },
        data: {
          type: 'pool',
          pool,
          hostCount: poolHosts.length,
          vmCount: allPoolVms.length,
          runningVmCount: allPoolVms.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING).length,
        } satisfies PoolNodeData,
      })

      for (const host of poolHosts) {
        const hostVms = vmsByHost.value.get(host.id) ?? []
        const runningCount = hostVms.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING).length

        nodes.push({
          id: `host-${host.id}`,
          type: 'host',
          position: { x: 0, y: 0 },
          data: {
            type: 'host',
            host,
            vmCount: hostVms.length,
            runningVmCount: runningCount,
            memorySize: host.memory.size,
            memoryUsage: host.memory.usage,
          } satisfies HostNodeData,
        })

        if (hostVms.length > 0) {
          nodes.push({
            id: `vmgroup-host-${host.id}`,
            type: 'vm-group',
            position: { x: 0, y: 0 },
            data: {
              type: 'vm-group',
              vms: hostVms,
              runningCount,
              stoppedCount: hostVms.length - runningCount,
            } satisfies VmGroupNodeData,
          })
        }
      }

      if (hostLessVms.length > 0) {
        const runningCount = hostLessVms.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING).length

        nodes.push({
          id: `vmgroup-pool-${pool.id}`,
          type: 'vm-group',
          position: { x: 0, y: 0 },
          data: {
            type: 'vm-group',
            vms: hostLessVms,
            runningCount,
            stoppedCount: hostLessVms.length - runningCount,
          } satisfies VmGroupNodeData,
        })
      }
    }

    return nodes
  })

  const rawEdges = computed<TopologyEdge[]>(() => {
    const edges: TopologyEdge[] = []
    const poolList = pools.value

    for (const pool of poolList) {
      edges.push({
        id: `e-site-pool-${pool.id}`,
        source: SITE_NODE_ID,
        target: `pool-${pool.id}`,
        type: 'topology',
      })

      const poolHosts = hostsByPool.value.get(pool.id) ?? []

      for (const host of poolHosts) {
        edges.push({
          id: `e-pool-host-${host.id}`,
          source: `pool-${pool.id}`,
          target: `host-${host.id}`,
          type: 'topology',
        })

        const hostVms = vmsByHost.value.get(host.id) ?? []

        if (hostVms.length > 0) {
          edges.push({
            id: `e-host-vmgroup-${host.id}`,
            source: `host-${host.id}`,
            target: `vmgroup-host-${host.id}`,
            type: 'topology',
          })
        }
      }

      const hostLessVms = hostLessVmsByPool.value.get(pool.id) ?? []

      if (hostLessVms.length > 0) {
        edges.push({
          id: `e-pool-vmgroup-${pool.id}`,
          source: `pool-${pool.id}`,
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
  }
}
