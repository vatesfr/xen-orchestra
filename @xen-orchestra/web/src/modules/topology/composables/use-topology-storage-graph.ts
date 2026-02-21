import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type {
  EmptyGroupNodeData,
  PoolNodeData,
  SiteNodeData,
  SrNodeData,
  TopologyEdge,
  TopologyNode,
  VmGroupNodeData,
} from '@/modules/topology/types/topology.types.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { XOA_NAME } from '@/shared/constants.ts'
import { VM_POWER_STATE } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { computed, ref, watch } from 'vue'

import { useTopologyLayout } from './use-topology-layout.ts'

const SITE_NODE_ID = 'site-root'

export function useTopologyStorageGraph() {
  const { pools, arePoolsReady } = useXoPoolCollection()
  const { areSrsReady, srsByPool } = useXoSrCollection()
  const { pbdsBySr, arePbdsReady } = useXoPbdCollection()
  const { vbds, areVbdsReady } = useXoVbdCollection()
  const { vdis, areVdisReady } = useXoVdiCollection()
  const { vms, areVmsReady, getVmById } = useXoVmCollection()
  const { hosts, areHostsReady } = useXoHostCollection()

  const isReady = logicAnd(
    arePoolsReady,
    areSrsReady,
    arePbdsReady,
    areVbdsReady,
    areVdisReady,
    areVmsReady,
    areHostsReady
  )

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

  // Group VDIs by SR
  const vdisBySr = computed(() => {
    const map = new Map<string, string[]>()
    for (const vdi of vdis.value) {
      const srId = vdi.$SR
      if (!map.has(srId)) {
        map.set(srId, [])
      }
      map.get(srId)!.push(vdi.id)
    }
    return map
  })

  // Group VBDs by VDI (excluding CD drives)
  const vbdsByVdi = computed(() => {
    const map = new Map<string, typeof vbds.value>()
    for (const vbd of vbds.value) {
      if (vbd.is_cd_drive) {
        continue
      }
      const vdiId = vbd.VDI
      if (!map.has(vdiId)) {
        map.set(vdiId, [])
      }
      map.get(vdiId)!.push(vbd)
    }
    return map
  })

  // Resolve unique VMs per SR: SR → VDIs → VBDs → unique VMs
  const vmsBySr = computed(() => {
    const map = new Map<string, FrontXoVm[]>()
    for (const [srId, vdiIds] of vdisBySr.value) {
      const seen = new Set<string>()
      const resolvedVms: FrontXoVm[] = []
      for (const vdiId of vdiIds) {
        const vdiVbds = vbdsByVdi.value.get(vdiId) ?? []
        for (const vbd of vdiVbds) {
          if (seen.has(vbd.VM)) {
            continue
          }
          seen.add(vbd.VM)
          const vm = getVmById(vbd.VM)
          if (vm) {
            resolvedVms.push(vm)
          }
        }
      }
      map.set(srId, resolvedVms)
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
      const poolSrs = srsByPool.value.get(pool.id) ?? []

      // Partition into SRs with VMs vs empty
      const activeSrs = poolSrs.filter(sr => (vmsBySr.value.get(sr.id) ?? []).length > 0)
      const emptySrs = poolSrs.filter(sr => (vmsBySr.value.get(sr.id) ?? []).length === 0)

      nodes.push({
        id: poolId,
        type: 'pool',
        position: { x: 0, y: 0 },
        data: {
          type: 'pool',
          pool,
          hostCount: poolSrs.length,
          vmCount: 0,
          runningVmCount: 0,
          isExpanded: expanded.has(poolId),
          isExpandable: activeSrs.length > 0 || emptySrs.length > 0,
        } satisfies PoolNodeData,
      })

      if (!expanded.has(poolId)) {
        continue
      }

      for (const sr of activeSrs) {
        const srId = `sr-${sr.id}`
        const srPbds = pbdsBySr.value.get(sr.id) ?? []
        const allAttached = srPbds.length > 0 && srPbds.every(pbd => pbd.attached)
        const srVms = vmsBySr.value.get(sr.id) ?? []
        const runningVmCount = srVms.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING).length

        nodes.push({
          id: srId,
          type: 'sr',
          position: { x: 0, y: 0 },
          data: {
            type: 'sr',
            sr,
            srType: sr.SR_type,
            shared: sr.shared,
            size: sr.size,
            usage: sr.usage,
            vmCount: srVms.length,
            runningVmCount,
            pbdHostCount: srPbds.length,
            allAttached,
            isExpanded: expanded.has(srId),
            isExpandable: srVms.length > 0,
          } satisfies SrNodeData,
        })

        if (!expanded.has(srId)) {
          continue
        }

        const vmGroupId = `vmgroup-sr-${sr.id}`
        const stoppedCount = srVms.length - runningVmCount

        nodes.push({
          id: vmGroupId,
          type: 'vm-group',
          position: { x: 0, y: 0 },
          data: {
            type: 'vm-group',
            vms: srVms,
            runningCount: runningVmCount,
            stoppedCount,
            isExpanded: expanded.has(vmGroupId),
            isExpandable: srVms.length > 0,
          } satisfies VmGroupNodeData,
        })
      }

      // Group empty SRs into a single summary node
      if (emptySrs.length > 0) {
        const emptyGroupId = `empty-srs-pool-${pool.id}`

        nodes.push({
          id: emptyGroupId,
          type: 'empty-group',
          position: { x: 0, y: 0 },
          data: {
            type: 'empty-group',
            kind: 'sr',
            items: emptySrs.map(sr => ({ name: sr.name_label, id: sr.id })),
            isExpanded: expanded.has(emptyGroupId),
            isExpandable: emptySrs.length > 0,
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

      const poolSrs = srsByPool.value.get(pool.id) ?? []
      const activeSrs = poolSrs.filter(sr => (vmsBySr.value.get(sr.id) ?? []).length > 0)
      const emptySrs = poolSrs.filter(sr => (vmsBySr.value.get(sr.id) ?? []).length === 0)

      for (const sr of activeSrs) {
        const srId = `sr-${sr.id}`

        edges.push({
          id: `e-pool-sr-${sr.id}`,
          source: poolId,
          target: srId,
          type: 'topology',
        })

        if (!expanded.has(srId)) {
          continue
        }

        edges.push({
          id: `e-sr-vmgroup-${sr.id}`,
          source: srId,
          target: `vmgroup-sr-${sr.id}`,
          type: 'topology',
        })
      }

      if (emptySrs.length > 0) {
        edges.push({
          id: `e-pool-empty-srs-${pool.id}`,
          source: poolId,
          target: `empty-srs-pool-${pool.id}`,
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
