<template>
  <HostTreeItem v-for="branch in branches" :key="branch.id" :branch />
</template>

<script lang="ts" setup>
import HostTreeItem from '@/modules/treeview/components/HostTreeItem.vue'
import type { HostBranch } from '@/modules/treeview/types/tree.type.ts'

defineProps<{
  branches: HostBranch[]
}>()
</script>
