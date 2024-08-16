<template>
  <HostTreeItem v-for="branch in branches" :key="branch.id" :branch />
</template>

<script lang="ts" setup>
import HostTreeItem from '@/components/tree/HostTreeItem.vue'
import type { HostBranch } from '@/types/tree.type'

defineProps<{
  branches: HostBranch[]
}>()
</script>
