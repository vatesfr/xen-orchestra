import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { Node, Edge } from '@vue-flow/core'

export type SiteNodeData = {
  type: 'site'
  label: string
  poolCount: number
  hostCount: number
  vmCount: number
  isExpanded: boolean
  isExpandable: boolean
}

export type PoolNodeData = {
  type: 'pool'
  pool: FrontXoPool
  hostCount: number
  vmCount: number
  runningVmCount: number
  isExpanded: boolean
  isExpandable: boolean
}

export type HostNodeData = {
  type: 'host'
  host: FrontXoHost
  vmCount: number
  runningVmCount: number
  memorySize: number
  memoryUsage: number
  cpuPercent: number | undefined
  isExpanded: boolean
  isExpandable: boolean
}

export type VmGroupNodeData = {
  type: 'vm-group'
  vms: FrontXoVm[]
  runningCount: number
  stoppedCount: number
  isExpanded: boolean
  isExpandable: boolean
}

export type NetworkNodeData = {
  type: 'network'
  network: FrontXoNetwork
  vmCount: number
  runningVmCount: number
  pifHostCount: number
  hasPhysicalPifs: boolean
  mtu: number
  isExpanded: boolean
  isExpandable: boolean
}

export type SrNodeData = {
  type: 'sr'
  sr: FrontXoSr
  srType: string
  shared: boolean
  size: number
  usage: number
  vmCount: number
  runningVmCount: number
  pbdHostCount: number
  allAttached: boolean
  isExpanded: boolean
  isExpandable: boolean
}

export type EmptyGroupNodeData = {
  type: 'empty-group'
  kind: 'network' | 'sr'
  items: { name: string; id: string }[]
  isExpanded: boolean
  isExpandable: boolean
}

export type TopologyNodeData =
  | SiteNodeData
  | PoolNodeData
  | HostNodeData
  | VmGroupNodeData
  | NetworkNodeData
  | SrNodeData
  | EmptyGroupNodeData

export type TopologyNode = Node<TopologyNodeData>
export type TopologyEdge = Edge

export const NODE_DIMENSIONS = {
  site: { width: 280, height: 120 },
  pool: { width: 260, height: 130 },
  host: { width: 240, height: 165 },
  'vm-group': { width: 260, height: 100 },
  network: { width: 260, height: 120 },
  sr: { width: 260, height: 140 },
  'empty-group': { width: 240, height: 56 },
} as const

export const VM_GROUP_EXPANDED_ROW_HEIGHT = 24
export const EMPTY_GROUP_EXPANDED_ROW_HEIGHT = 22
