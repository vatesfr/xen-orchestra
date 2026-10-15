<template>
  <UiPanelCard class="node-info-card">
    <UiPanelCardTitle size="medium" :label="node.name" :to="nodeRoute" icon="object:node" />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('node-name') }}</template>
        <template #value>{{ node.node_name }}</template>
        <template #addons>
          <VtsCopyButton :value="node.node_name" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { getKubernetesNodeRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()

const nodeRoute = computed(() => getKubernetesNodeRoute(node.node_id))
</script>

<style scoped lang="postcss">
.node-info-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
