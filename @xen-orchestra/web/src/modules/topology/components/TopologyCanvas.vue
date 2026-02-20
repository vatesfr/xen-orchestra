<template>
  <div class="topology-canvas">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :default-viewport="{ x: 0, y: 0, zoom: 0.85 }"
      :min-zoom="0.2"
      :max-zoom="2"
      fit-view-on-init
      :nodes-draggable="false"
      :nodes-connectable="false"
    >
      <template #node-site="nodeProps">
        <SiteNode :data="nodeProps.data" />
      </template>
      <template #node-pool="nodeProps">
        <PoolNode :data="nodeProps.data" />
      </template>
      <template #node-host="nodeProps">
        <HostNode :data="nodeProps.data" />
      </template>
      <template #node-vm-group="nodeProps">
        <VmGroupNode :data="nodeProps.data" />
      </template>
      <template #edge-topology="edgeProps">
        <TopologyEdge v-bind="edgeProps" />
      </template>
      <Controls :show-interactive="false" />
    </VueFlow>
  </div>
</template>

<script lang="ts" setup>
import HostNode from '@/modules/topology/components/HostNode.vue'
import PoolNode from '@/modules/topology/components/PoolNode.vue'
import SiteNode from '@/modules/topology/components/SiteNode.vue'
import TopologyEdge from '@/modules/topology/components/TopologyEdge.vue'
import VmGroupNode from '@/modules/topology/components/VmGroupNode.vue'
import type { TopologyEdge as TopologyEdgeType, TopologyNode } from '@/modules/topology/types/topology.types.ts'
import { Controls } from '@vue-flow/controls'
import { VueFlow } from '@vue-flow/core'
import { markRaw } from 'vue'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

defineProps<{
  nodes: TopologyNode[]
  edges: TopologyEdgeType[]
}>()

const nodeTypes = {
  site: markRaw(SiteNode),
  pool: markRaw(PoolNode),
  host: markRaw(HostNode),
  'vm-group': markRaw(VmGroupNode),
}

const edgeTypes = {
  topology: markRaw(TopologyEdge),
}
</script>

<style lang="postcss" scoped>
.topology-canvas {
  width: 100%;
  height: 100%;

  :deep(.vue-flow) {
    background: var(--color-neutral-background-secondary);
  }

  :deep(.vue-flow__controls) {
    background: var(--color-neutral-background-primary);
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.4rem;

    button {
      background: var(--color-neutral-background-primary);
      color: var(--color-neutral-txt-primary);
      border-bottom: 0.1rem solid var(--color-neutral-border);

      &:hover {
        background: var(--color-brand-background-hover);
      }

      svg {
        fill: currentColor;
      }
    }
  }
}
</style>
