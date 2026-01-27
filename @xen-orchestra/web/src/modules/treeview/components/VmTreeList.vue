<template>
  <VmTreeItem v-for="leaf in leaves" :key="leaf.id" :leaf />
</template>

<script lang="ts" setup>
import VmTreeItem from '@/modules/treeview/components/VmTreeItem.vue'
import type { VmLeaf } from '@/modules/treeview/types/tree.type.ts'

defineProps<{
  leaves: VmLeaf[]
}>()
</script>
