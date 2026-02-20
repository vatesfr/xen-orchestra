import type { InjectionKey, Ref } from 'vue'

export const TOPOLOGY_TOGGLE_EXPAND: InjectionKey<(nodeId: string) => void> = Symbol('topology-toggle-expand')
export const TOPOLOGY_EXPANDED_NODES: InjectionKey<Ref<Set<string>>> = Symbol('topology-expanded-nodes')
