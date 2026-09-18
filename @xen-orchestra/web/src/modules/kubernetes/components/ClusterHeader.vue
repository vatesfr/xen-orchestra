<template>
  <UiHeadBar icon="object:cluster">
    {{ cluster.name }}
  </UiHeadBar>
</template>

<script setup lang="ts">
import type { FrontXoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'

defineProps<{
  cluster: FrontXoKubernetesCluster
}>()
</script>
