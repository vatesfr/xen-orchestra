<template>
  <VtsTreeList>
    <PoolTreeItem v-for="branch in branches" :key="branch.id" :branch />
  </VtsTreeList>
</template>

<script lang="ts" setup>
import PoolTreeItem from '@/components/tree/PoolTreeItem.vue'
import type { PoolBranch } from '@/types/tree.type'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'

defineProps<{
  branches: PoolBranch[]
}>()
</script>
