<template>
  <ClusterDeleteButton :cluster />
</template>

<script lang="ts" setup>
import ClusterDeleteButton from '@/modules/kubernetes/components/actions/delete-cluster/ClusterDeleteButton.vue'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'

defineProps<{
  cluster: XoKubernetesCluster
}>()
</script>
