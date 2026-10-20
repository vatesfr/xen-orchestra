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
          <!-- TODO: use KubernetesStatus UiInfo with the "paused" accent once it is available in web-core -->
          <div v-if="isPaused === 'paused'" class="value">
            <VtsIcon class="icon" name="status:paused-circle" size="medium" />
            <p class="typo-body-regular">{{ t('yes') }}</p>
          </div>
          <KubernetesStatus v-else :status="isPaused" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import KubernetesStatus from '@/modules/kubernetes/components/KubernetesStatus.vue'
import { useXoKubernetesClusterUtils } from '@/modules/kubernetes/composables/xo-kubernetes-cluster-utils.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { isControlPlaneInitialized, isInfrastructureProvisioned, isPaused } = useXoKubernetesClusterUtils(() => cluster)
</script>

<style scoped lang="postcss">
.cluster-status-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .value {
      display: flex;
      align-items: baseline;
      gap: 0.8rem;

      .icon {
        transform: translateY(0.2ex);
      }
    }
  }
}
</style>
