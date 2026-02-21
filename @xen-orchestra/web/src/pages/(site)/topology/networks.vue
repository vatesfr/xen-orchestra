<template>
  <div class="topology-page">
    <VtsStateHero v-if="!isReady" format="page" type="busy" size="large" />
    <TopologyCanvas v-else :nodes="nodes" :edges="edges" />
  </div>
</template>

<script lang="ts" setup>
import TopologyCanvas from '@/modules/topology/components/TopologyCanvas.vue'
import {
  TOPOLOGY_DIRECTION,
  TOPOLOGY_EXPANDED_NODES,
  TOPOLOGY_TOGGLE_EXPAND,
} from '@/modules/topology/composables/use-topology-interaction.ts'
import { useTopologyNetworkGraph } from '@/modules/topology/composables/use-topology-network-graph.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { provide } from 'vue'

const { nodes, edges, isReady, toggleExpand, expandedNodes, direction } = useTopologyNetworkGraph()

provide(TOPOLOGY_TOGGLE_EXPAND, toggleExpand)
provide(TOPOLOGY_EXPANDED_NODES, expandedNodes)
provide(TOPOLOGY_DIRECTION, direction)
</script>

<style scoped lang="postcss">
.topology-page {
  height: calc(100vh - 10rem);
  width: 100%;
}
</style>
