<template>
  <VtsTreeList class="site-tree-list">
    <SiteTreeItem v-for="branch in branches" :key="branch.id" :branch />
  </VtsTreeList>
</template>

<script lang="ts" setup>
import SiteTreeItem from '@/components/tree/SiteTreeItem.vue'
import type { SiteBranch } from '@/types/tree.type'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'

defineProps<{
  branches: SiteBranch[]
}>()
</script>

<style lang="postcss" scoped>
.site-tree-list {
  background-color: var(--color-neutral-background-primary);
  padding: 0.8rem;
  min-height: 100%;
}
</style>
