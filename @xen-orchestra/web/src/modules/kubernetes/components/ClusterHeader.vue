<template>
  <UiHeadBar icon="object:cluster">
    {{ cluster.name }}
  </UiHeadBar>
</template>

<script setup lang="ts">
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'

defineProps<{
  cluster: XoKubernetesCluster
}>()
</script>
