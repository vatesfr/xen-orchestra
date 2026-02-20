import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { Node, Edge } from '@vue-flow/core'

export type SiteNodeData = {
  type: 'site'
  label: string
  poolCount: number
  hostCount: number
  vmCount: number
}

export type PoolNodeData = {
  type: 'pool'
  pool: FrontXoPool
  hostCount: number
  vmCount: number
  runningVmCount: number
}

export type HostNodeData = {
  type: 'host'
  host: FrontXoHost
  vmCount: number
  runningVmCount: number
  memorySize: number
  memoryUsage: number
}

export type VmGroupNodeData = {
  type: 'vm-group'
  vms: FrontXoVm[]
  runningCount: number
  stoppedCount: number
}

export type TopologyNodeData = SiteNodeData | PoolNodeData | HostNodeData | VmGroupNodeData

export type TopologyNode = Node<TopologyNodeData>
export type TopologyEdge = Edge

export const NODE_DIMENSIONS = {
  site: { width: 280, height: 100 },
  pool: { width: 260, height: 110 },
  host: { width: 240, height: 140 },
  'vm-group': { width: 180, height: 80 },
} as const
