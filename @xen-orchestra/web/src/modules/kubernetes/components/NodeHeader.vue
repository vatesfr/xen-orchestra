<template>
  <UiHeadBar icon="object:node">
    {{ node.name }}
  </UiHeadBar>
</template>

<script setup lang="ts">
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'

defineProps<{
  node: XoKubernetesNode
}>()
</script>
