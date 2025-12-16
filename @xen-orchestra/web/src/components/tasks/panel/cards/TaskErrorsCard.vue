<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('errors') }}
      <UiCounter :value="Array(task.result).length" accent="danger" size="small" variant="primary" />
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('message') }}</template>
        <template #value>{{ task.result.message }}</template>
        <template #addons>
          <VtsCopyButton :value="String(task.result.message)" />
        </template>
      </VtsCardRowKeyValue>
    </div>
    <UiLogEntryViewer
      v-if="task.result.stack"
      :content="task.result.stack"
      :label="t('api-error-details')"
      size="small"
      accent="danger"
    />
  </UiCard>
</template>

<script lang="ts" setup>
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: XoTask
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
