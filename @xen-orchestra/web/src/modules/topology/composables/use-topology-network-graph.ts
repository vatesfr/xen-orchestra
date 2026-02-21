import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  EmptyGroupNodeData,
  NetworkNodeData,
  PoolNodeData,
  SiteNodeData,
  TopologyEdge,
  TopologyNode,
  VmGroupNodeData,
} from '@/modules/topology/types/topology.types.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { XOA_NAME } from '@/shared/constants.ts'
import { VM_POWER_STATE } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { computed, ref, watch } from 'vue'

import { useTopologyLayout } from './use-topology-layout.ts'

const SITE_NODE_ID = 'site-root'

export function useTopologyNetworkGraph() {
  const { pools, arePoolsReady } = useXoPoolCollection()
  const { networks, areNetworksReady } = useXoNetworkCollection()
  const { pifs, arePifsReady } = useXoPifCollection()
  const { vifs, areVifsReady } = useXoVifCollection()
  const { vms, areVmsReady, getVmById } = useXoVmCollection()
  const { hosts, areHostsReady } = useXoHostCollection()

  const isReady = logicAnd(arePoolsReady, areNetworksReady, arePifsReady, areVifsReady, areVmsReady, areHostsReady)

  const expandedNodes = ref<Set<string>>(new Set([SITE_NODE_ID]))

  // Auto-expand all pool nodes once data loads
  watch(
    () => pools.value,
    poolList => {
      for (const pool of poolList) {
        expandedNodes.value.add(`pool-${pool.id}`)
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

  // Group networks by pool
  const networksByPool = computed(() => {
    const map = new Map<string, typeof networks.value>()
    for (const network of networks.value) {
      const poolId = network.$pool
      if (!map.has(poolId)) {
        map.set(poolId, [])
      }
      map.get(poolId)!.push(network)
    }
    return map
  })

  // Group VIFs by network
  const vifsByNetwork = computed(() => {
    const map = new Map<string, typeof vifs.value>()
    for (const vif of vifs.value) {
      const netId = vif.$network
      if (!map.has(netId)) {
        map.set(netId, [])
      }
      map.get(netId)!.push(vif)
    }
    return map
  })

  // Resolve unique VMs per network from VIFs
  const vmsByNetwork = computed(() => {
    const map = new Map<string, FrontXoVm[]>()
    for (const [netId, netVifs] of vifsByNetwork.value) {
      const seen = new Set<string>()
      const resolvedVms: FrontXoVm[] = []
      for (const vif of netVifs) {
        if (seen.has(vif.$VM)) {
          continue
        }
        seen.add(vif.$VM)
        const vm = getVmById(vif.$VM)
        if (vm) {
          resolvedVms.push(vm)
        }
      }
      map.set(netId, resolvedVms)
    }
    return map
  })

  // Count PIFs per network (for host badge)
  const pifCountByNetwork = computed(() => {
    const map = new Map<string, number>()
    for (const pif of pifs.value) {
      map.set(pif.$network, (map.get(pif.$network) ?? 0) + 1)
    }
    return map
  })

  // Check for physical PIFs per network
  const hasPhysicalPifsByNetwork = computed(() => {
    const map = new Map<string, boolean>()
    for (const pif of pifs.value) {
      if (!map.get(pif.$network) && pif.vlan === -1 && !pif.isBondMaster) {
        map.set(pif.$network, true)
      }
    }
    return map
  })

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
      const poolNetworks = networksByPool.value.get(pool.id) ?? []

      // Partition into networks with VMs vs empty
      const activeNetworks = poolNetworks.filter(n => (vmsByNetwork.value.get(n.id) ?? []).length > 0)
      const emptyNetworks = poolNetworks.filter(n => (vmsByNetwork.value.get(n.id) ?? []).length === 0)

      nodes.push({
        id: poolId,
        type: 'pool',
        position: { x: 0, y: 0 },
        data: {
          type: 'pool',
          pool,
          hostCount: poolNetworks.length,
          vmCount: 0,
          runningVmCount: 0,
          isExpanded: expanded.has(poolId),
          isExpandable: activeNetworks.length > 0 || emptyNetworks.length > 0,
        } satisfies PoolNodeData,
      })

      if (!expanded.has(poolId)) {
        continue
      }

      for (const network of activeNetworks) {
        const netId = `net-${network.id}`
        const netVms = vmsByNetwork.value.get(network.id) ?? []
        const runningVmCount = netVms.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING).length

        nodes.push({
          id: netId,
          type: 'network',
          position: { x: 0, y: 0 },
          data: {
            type: 'network',
            network,
            vmCount: netVms.length,
            runningVmCount,
            pifHostCount: pifCountByNetwork.value.get(network.id) ?? 0,
            hasPhysicalPifs: hasPhysicalPifsByNetwork.value.get(network.id) ?? false,
            mtu: network.MTU,
            isExpanded: expanded.has(netId),
            isExpandable: netVms.length > 0,
          } satisfies NetworkNodeData,
        })

        if (!expanded.has(netId)) {
          continue
        }

        const vmGroupId = `vmgroup-net-${network.id}`
        const stoppedCount = netVms.length - runningVmCount

        nodes.push({
          id: vmGroupId,
          type: 'vm-group',
          position: { x: 0, y: 0 },
          data: {
            type: 'vm-group',
            vms: netVms,
            runningCount: runningVmCount,
            stoppedCount,
            isExpanded: expanded.has(vmGroupId),
            isExpandable: netVms.length > 0,
          } satisfies VmGroupNodeData,
        })
      }

      // Group empty networks into a single summary node
      if (emptyNetworks.length > 0) {
        const emptyGroupId = `empty-nets-pool-${pool.id}`

        nodes.push({
          id: emptyGroupId,
          type: 'empty-group',
          position: { x: 0, y: 0 },
          data: {
            type: 'empty-group',
            kind: 'network',
            items: emptyNetworks.map(n => ({ name: n.name_label, id: n.id })),
            isExpanded: expanded.has(emptyGroupId),
            isExpandable: emptyNetworks.length > 0,
          } satisfies EmptyGroupNodeData,
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

      const poolNetworks = networksByPool.value.get(pool.id) ?? []
      const activeNetworks = poolNetworks.filter(n => (vmsByNetwork.value.get(n.id) ?? []).length > 0)
      const emptyNetworks = poolNetworks.filter(n => (vmsByNetwork.value.get(n.id) ?? []).length === 0)

      for (const network of activeNetworks) {
        const netId = `net-${network.id}`

        edges.push({
          id: `e-pool-net-${network.id}`,
          source: poolId,
          target: netId,
          type: 'topology',
        })

        if (!expanded.has(netId)) {
          continue
        }

        edges.push({
          id: `e-net-vmgroup-${network.id}`,
          source: netId,
          target: `vmgroup-net-${network.id}`,
          type: 'topology',
        })
      }

      if (emptyNetworks.length > 0) {
        edges.push({
          id: `e-pool-empty-nets-${pool.id}`,
          source: poolId,
          target: `empty-nets-pool-${pool.id}`,
          type: 'topology',
        })
      }
    }

    return edges
  })

  const direction = 'LR' as const

  const layouted = useTopologyLayout(rawNodes, rawEdges, direction)

  return {
    nodes: computed(() => layouted.value.nodes),
    edges: computed(() => layouted.value.edges),
    isReady,
    expandedNodes,
    toggleExpand,
    direction,
  }
}
