<template>
  <VtsTreeList>
    <PoolTreeItem v-for="branch in branches" :key="branch.id" :branch />
  </VtsTreeList>
</template>

<script lang="ts" setup>
import PoolTreeItem from '@/modules/treeview/components/PoolTreeItem.vue'
import type { PoolBranch } from '@/modules/treeview/types/tree.type.ts'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'

defineProps<{
  branches: PoolBranch[]
}>()
</script>
