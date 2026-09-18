<template>
  <UiPanelCard class="cluster-status-card">
    <UiCardTitle>
      {{ t('status') }}
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('phase') }}</template>
        <template #value>
          <UiInfo :accent="phaseStatusAccent">
            {{ cluster.phase }}
          </UiInfo>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('control-plane-initialized') }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('infrastructure-provisioned') }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('paused') }}</template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { kubernetesClusterPhaseToStatusAccent } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const phaseStatusAccent = computed(() => kubernetesClusterPhaseToStatusAccent(cluster.phase))
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
