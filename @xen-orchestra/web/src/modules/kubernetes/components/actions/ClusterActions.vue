<template>
  <ClusterEditButton :cluster />
  <ClusterReconciliationPauseButton :cluster />
  <ClusterReconciliationResumeButton :cluster />
  <ClusterKubeconfigDownloadButton :cluster />
  <ClusterDeleteButton :cluster />
</template>

<script lang="ts" setup>
import ClusterDeleteButton from '@/modules/kubernetes/components/actions/delete-cluster/ClusterDeleteButton.vue'
import ClusterKubeconfigDownloadButton from '@/modules/kubernetes/components/actions/download-kubeconfig/ClusterKubeconfigDownloadButton.vue'
import ClusterEditButton from '@/modules/kubernetes/components/actions/edit-cluster/ClusterEditButton.vue'
import ClusterReconciliationPauseButton from '@/modules/kubernetes/components/actions/reconciliation/ClusterReconciliationPauseButton.vue'
import ClusterReconciliationResumeButton from '@/modules/kubernetes/components/actions/reconciliation/ClusterReconciliationResumeButton.vue'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'

defineProps<{
  cluster: XoKubernetesCluster
}>()
</script>
