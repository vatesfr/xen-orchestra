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
      @viewport-change="onViewportChange"
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
        <VmGroupNode :id="nodeProps.id" :data="nodeProps.data" />
      </template>
      <template #node-network="nodeProps">
        <NetworkNode :data="nodeProps.data" />
      </template>
      <template #node-sr="nodeProps">
        <SrNode :data="nodeProps.data" />
      </template>
      <template #node-empty-group="nodeProps">
        <EmptyGroupNode :id="nodeProps.id" :data="nodeProps.data" />
      </template>
      <template #edge-topology="edgeProps">
        <TopologyEdge v-bind="edgeProps" />
      </template>
      <Controls :show-interactive="false" />
      <MiniMap
        pannable
        zoomable
        :node-color="minimapNodeColor"
        :node-border-radius="4"
        mask-color="rgba(0, 0, 0, 0.15)"
      />
    </VueFlow>
  </div>
</template>

<script lang="ts" setup>
import EmptyGroupNode from '@/modules/topology/components/EmptyGroupNode.vue'
import HostNode from '@/modules/topology/components/HostNode.vue'
import NetworkNode from '@/modules/topology/components/NetworkNode.vue'
import PoolNode from '@/modules/topology/components/PoolNode.vue'
import SiteNode from '@/modules/topology/components/SiteNode.vue'
import SrNode from '@/modules/topology/components/SrNode.vue'
import TopologyEdge from '@/modules/topology/components/TopologyEdge.vue'
import VmGroupNode from '@/modules/topology/components/VmGroupNode.vue'
import { TOPOLOGY_ZOOM } from '@/modules/topology/composables/use-topology-interaction.ts'
import type { TopologyEdge as TopologyEdgeType, TopologyNode } from '@/modules/topology/types/topology.types.ts'
import { Controls } from '@vue-flow/controls'
import type { GraphNode } from '@vue-flow/core'
import { useVueFlow, VueFlow } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { markRaw, nextTick, provide, ref, watch } from 'vue'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const { nodes, edges } = defineProps<{
  nodes: TopologyNode[]
  edges: TopologyEdgeType[]
}>()

const nodeTypes: Record<string, any> = {
  site: markRaw(SiteNode),
  pool: markRaw(PoolNode),
  host: markRaw(HostNode),
  'vm-group': markRaw(VmGroupNode),
  network: markRaw(NetworkNode),
  sr: markRaw(SrNode),
  'empty-group': markRaw(EmptyGroupNode),
}

const edgeTypes = {
  topology: markRaw(TopologyEdge),
}

const minimapNodeColor = (node: GraphNode) => {
  switch (node.type) {
    case 'site':
      return '#8f84ff'
    case 'pool':
      return 'rgba(143, 132, 255, 0.4)'
    case 'host':
      return 'rgba(143, 132, 255, 0.25)'
    case 'vm-group':
      return 'rgba(143, 132, 255, 0.15)'
    case 'network':
      return '#3b82f6'
    case 'sr':
      return '#f59e0b'
    case 'empty-group':
      return 'rgba(100, 100, 100, 0.2)'
    default:
      return 'rgba(143, 132, 255, 0.2)'
  }
}

const { fitView } = useVueFlow()

const currentZoom = ref(0.85)

provide(TOPOLOGY_ZOOM, currentZoom)

function onViewportChange(viewport: { zoom: number }) {
  currentZoom.value = viewport.zoom
}

watch(
  () => nodes.length,
  () => {
    nextTick(() => {
      setTimeout(() => {
        fitView({ duration: 600 })
      }, 50)
    })
  }
)
</script>

<style scoped lang="postcss">
.topology-canvas {
  width: 100%;
  height: 100%;

  :deep(.vue-flow) {
    background: var(--color-neutral-background-secondary);
  }

  :deep(.vue-flow__node) {
    overflow: visible;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  :deep(.vue-flow__minimap) {
    background: var(--color-neutral-background-primary);
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.6rem;
    overflow: hidden;

    :root.dark & .vue-flow__minimap-mask {
      fill: rgba(255, 255, 255, 0.08);
    }
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

@keyframes edge-flow {
  to {
    stroke-dashoffset: -18;
  }
}
</style>
