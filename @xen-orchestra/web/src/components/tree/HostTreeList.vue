<template>
  <HostTreeItem v-for="branch in branches" :key="branch.id" :branch />
</template>

<script lang="ts" setup>
import HostTreeItem from '@/components/tree/HostTreeItem.vue'
import type { HostBranch } from '@/types/host.type'

defineProps<{
  branches: HostBranch[]
}>()
</script>
