<template>
  <UiPanelCard class="cluster-nodes-replicas-card">
    <UiCardTitle>
      {{ title }}
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('desired') }}</template>
        <template #value>{{ nodesStatus.desiredReplicas }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('ready') }}</template>
        <template #value>{{ nodesStatus.readyReplicas }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('available') }}</template>
        <template #value>{{ nodesStatus.availableReplicas }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('total') }}</template>
        <template #value>{{ nodesStatus.replicas }}</template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import type { XoKubernetesNodesStatus } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { useI18n } from 'vue-i18n'

const { title, nodesStatus } = defineProps<{
  title: string
  nodesStatus: XoKubernetesNodesStatus
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.cluster-nodes-replicas-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
