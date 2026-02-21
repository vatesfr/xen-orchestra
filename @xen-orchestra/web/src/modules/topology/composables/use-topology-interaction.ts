import type { InjectionKey, Ref } from 'vue'

export type TopologyDirection = 'TB' | 'LR'

export const TOPOLOGY_TOGGLE_EXPAND: InjectionKey<(nodeId: string) => void> = Symbol('topology-toggle-expand')
export const TOPOLOGY_EXPANDED_NODES: InjectionKey<Ref<Set<string>>> = Symbol('topology-expanded-nodes')
export const TOPOLOGY_ZOOM: InjectionKey<Ref<number>> = Symbol('topology-zoom')
export const TOPOLOGY_DIRECTION: InjectionKey<TopologyDirection> = Symbol('topology-direction')
