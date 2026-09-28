<template>
  <VtsSidePanel :has-selection="!!cluster" @close="emit('close')">
    <template v-if="cluster">
      <ClusterInfoCard :cluster />
      <ClusterStatusCard :cluster />
      <ClusterNetworkingCard :cluster />
      <ClusterNodesReplicasCard :title="t('control-plane-replicas')" :nodes-status="cluster.controlPlaneStatus" />
      <ClusterNodesReplicasCard :title="t('worker-replicas')" :nodes-status="cluster.workerStatus" />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import ClusterInfoCard from '@/modules/kubernetes/components/list/panel/card/ClusterInfoCard.vue'
import ClusterNetworkingCard from '@/modules/kubernetes/components/list/panel/card/ClusterNetworkingCard.vue'
import ClusterNodesReplicasCard from '@/modules/kubernetes/components/list/panel/card/ClusterNodesReplicasCard.vue'
import ClusterStatusCard from '@/modules/kubernetes/components/list/panel/card/ClusterStatusCard.vue'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  cluster?: XoKubernetesCluster
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
</script>
