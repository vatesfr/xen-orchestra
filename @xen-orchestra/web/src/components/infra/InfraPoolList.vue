<template>
  <TreeList v-if="isReady" class="infra-pool-list">
    <InfraPoolItem v-for="pool in pools" :key="pool.id" :pool />
  </TreeList>
</template>

<script lang="ts" setup>
import InfraPoolItem from '@/components/infra/InfraPoolItem.vue'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import TreeList from '@core/components/tree/TreeList.vue'

const { records: pools, isReady } = usePoolStore().subscribe()
</script>

<style lang="postcss" scoped>
.infra-pool-list {
  background-color: var(--background-color-primary);
  padding: 0.8rem;
}
</style>
