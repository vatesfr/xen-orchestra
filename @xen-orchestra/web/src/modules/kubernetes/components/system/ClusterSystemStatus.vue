<template>
  <UiCard class="cluster-system-status">
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
          <!-- TODO: use KubernetesStatus UiInfo with the "paused" accent once it is available in web-core -->
          <div v-if="isPaused === 'paused'" class="paused">
            <VtsIcon class="icon" name="status:paused-circle" size="medium" />
            <p class="typo-body-regular">{{ t('yes') }}</p>
          </div>
          <KubernetesStatus v-else :status="isPaused" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import KubernetesStatus from '@/modules/kubernetes/components/KubernetesStatus.vue'
import { useXoKubernetesClusterUtils } from '@/modules/kubernetes/composables/xo-kubernetes-cluster-utils.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { isControlPlaneInitialized, isInfrastructureProvisioned, isPaused } = useXoKubernetesClusterUtils(() => cluster)
</script>

<style lang="postcss" scoped>
.cluster-system-status {
  .paused {
    display: flex;
    align-items: baseline;
    gap: 0.8rem;

    .icon {
      transform: translateY(0.2ex);
    }
  }
}
</style>
