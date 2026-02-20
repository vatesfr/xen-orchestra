<template>
  <div class="topology-page">
    <VtsStateHero v-if="!isReady" format="page" type="busy" size="large" />
    <TopologyCanvas v-else :nodes="nodes" :edges="edges" />
  </div>
</template>

<script lang="ts" setup>
import TopologyCanvas from '@/modules/topology/components/TopologyCanvas.vue'
import { useTopologyGraph } from '@/modules/topology/composables/use-topology-graph.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'

const { nodes, edges, isReady } = useTopologyGraph()
</script>

<style lang="postcss" scoped>
.topology-page {
  height: calc(100vh - 10rem);
  width: 100%;
}
</style>
