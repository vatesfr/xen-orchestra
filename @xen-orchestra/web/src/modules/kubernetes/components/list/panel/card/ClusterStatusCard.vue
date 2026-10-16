<template>
  <UiPanelCard class="cluster-status-card">
    <UiCardTitle>
      {{ t('status') }}
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('phase') }}</template>
        <template #value>
          <KubernetesStatus :status="cluster.phase" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('control-plane-initialized') }}</template>
        <template #value>
          <KubernetesStatus :status="isControlPlaneInitialized" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('infrastructure-provisioned') }}</template>
        <template #value>
          <KubernetesStatus :status="isInfrastructureProvisioned" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('paused') }}</template>
        <template #value>
          <KubernetesStatus :status="isPaused" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import KubernetesStatus from '@/modules/kubernetes/components/KubernetesStatus.vue'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const isControlPlaneInitialized = computed(() => (cluster.is_control_plane_initialized ? 'yes' : 'no'))
const isInfrastructureProvisioned = computed(() => (cluster.is_infrastructure_provisioned ? 'yes' : 'no'))
const isPaused = computed(() => (cluster.is_reconciliation_paused ? 'paused' : 'no'))
</script>

<style scoped lang="postcss">
.cluster-status-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
