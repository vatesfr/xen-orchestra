<template>
  <UiPanelCard class="node-networking-card">
    <UiCardTitle>
      {{ t('networking') }}
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('endpoint-url') }}</template>
        <template v-if="node.endpoint" #value>{{ node.endpoint }}</template>
        <template v-if="node.endpoint" #addons>
          <VtsCopyButton :value="node.endpoint" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.node-networking-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
