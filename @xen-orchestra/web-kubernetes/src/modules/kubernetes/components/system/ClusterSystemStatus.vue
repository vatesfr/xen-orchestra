<template>
  <UiCard>
    <UiTitle>
      {{ t('status') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('phase')">
        <template #value>
          <KubernetesStatus :status="cluster.phase" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('control-plane-initialized')">
        <template #value>
          <KubernetesStatus :status="isControlPlaneInitialized" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('infrastructure-provisioned')">
        <template #value>
          <KubernetesStatus :status="isInfrastructureProvisioned" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('paused')">
        <template #value>
          <KubernetesPausedStatus :paused="cluster.is_reconciliation_paused" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import KubernetesPausedStatus from '@/modules/kubernetes/components/KubernetesPausedStatus.vue'
import KubernetesStatus from '@/modules/kubernetes/components/KubernetesStatus.vue'
import { useXoKubernetesClusterUtils } from '@/modules/kubernetes/composables/xo-kubernetes-cluster-utils.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { isControlPlaneInitialized, isInfrastructureProvisioned } = useXoKubernetesClusterUtils(() => cluster)
</script>
