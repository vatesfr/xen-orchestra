<template>
  <VmTreeItem v-for="leaf in leaves" :key="leaf.id" :leaf />
</template>

<script lang="ts" setup>
import VmTreeItem from '@/components/tree/VmTreeItem.vue'
import type { VmLeaf } from '@/types/tree.type'

defineProps<{
  leaves: VmLeaf[]
}>()
</script>
