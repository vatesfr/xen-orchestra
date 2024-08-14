<template>
  <TreeList class="pool-tree-list">
    <PoolTreeItem v-for="branch in branches" :key="branch.id" :branch />
  </TreeList>
</template>

<script lang="ts" setup>
import PoolTreeItem from '@/components/tree/PoolTreeItem.vue'
import type { PoolBranch } from '@/types/tree.type'
import TreeList from '@core/components/tree/TreeList.vue'

defineProps<{
  branches: PoolBranch[]
}>()
</script>

<style lang="postcss" scoped>
.pool-tree-list {
  background-color: var(--background-color-primary);
  padding: 0.8rem;
  min-height: 100%;
}
</style>
