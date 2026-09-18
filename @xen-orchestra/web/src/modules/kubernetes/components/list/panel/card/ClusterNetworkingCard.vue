<template>
  <UiPanelCard class="cluster-networking-card">
    <UiCardTitle>
      {{ t('networking') }}
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('cp-endpoint') }}</template>
        <template v-if="cluster.controlPlaneEndpoint" #value>{{ cluster.controlPlaneEndpoint }}</template>
        <template v-if="cluster.controlPlaneEndpoint" #addons>
          <VtsCopyButton :value="cluster.controlPlaneEndpoint" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.cluster-networking-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
