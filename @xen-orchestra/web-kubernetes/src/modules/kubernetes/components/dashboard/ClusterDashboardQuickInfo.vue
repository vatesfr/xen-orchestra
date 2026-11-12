<template>
  <VtsQuickInfoCard class="cluster-dashboard-quick-info" :loading="!areClustersReady">
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('status')">
        <template #value>
          <KubernetesStatus :status />
        </template>
      </VtsKeyValueRow>
      <VtsKeyValueRow :label="t('version')" :value="version" />
      <VtsKeyValueRow :label="t('created-on')">
        <template #value>
          <span v-tooltip="createdAtTooltip">{{ createdAtFormatted }}</span>
        </template>
      </VtsKeyValueRow>
      <VtsKeyValueRow :label="t('created-by')" :value="creatorLabel" />
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('uuid')" :value="cluster.id" />
      <VtsKeyValueRow :label="t('description')" :value="cluster.description" />
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('control-plane-replicas')" :value="controlPlaneNodes" />
      <VtsKeyValueRow :label="t('worker-replicas')" :value="workerNodes" />
    </VtsKeyValueList>
  </VtsQuickInfoCard>
</template>

<script setup lang="ts">
import KubernetesStatus from '@/modules/kubernetes/components/KubernetesStatus.vue'
import { useKubernetesClusterCreator } from '@/modules/kubernetes/composables/use-kubernetes-cluster-creator.composable.ts'
import { useXoKubernetesClusterUtils } from '@/modules/kubernetes/composables/xo-kubernetes-cluster-utils.composable.ts'
import { useXoKubernetesClusterCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { clusterStatus, clusterVersion, formatNodesCount } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import VtsKeyValueList from '@core/components/key-value-list/VtsKeyValueList.vue'
import VtsKeyValueRow from '@core/components/key-value-row/VtsKeyValueRow.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { areClustersReady } = useXoKubernetesClusterCollection()

const { createdAtFormatted, createdAtTooltip } = useXoKubernetesClusterUtils(() => cluster)

const { creatorLabel } = useKubernetesClusterCreator(() => cluster)

const status = computed(() => clusterStatus(cluster))

const version = computed(() => clusterVersion(cluster))

const controlPlaneNodes = computed(() => formatNodesCount(cluster.control_plane_status))

const workerNodes = computed(() => formatNodesCount(cluster.worker_status))
</script>
