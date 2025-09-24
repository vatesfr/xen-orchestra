<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ cardMetadata.title }}
      <UiCounter :value="results.length" size="small" :accent="cardMetadata.accent" variant="primary" />
    </UiCardTitle>
    <div class="content">
      <template v-for="(result, index) in results" :key="index">
        <VtsCardRowKeyValue>
          <template #key>{{ t('message') }}</template>
          <template #value>{{ result.message }}</template>
          <template #addons>
            <VtsCopyButton :value="result.message" />
          </template>
        </VtsCardRowKeyValue>
        <UiLogEntryViewer
          :label="t('api-error-details')"
          size="small"
          :accent="cardMetadata.accent"
          :content="JSON.stringify(result.stack, null, 2)"
          class="stack"
        />
        <VtsDivider v-if="results.length > 1 && index < results.length - 1" class="divider" type="stretch" />
      </template>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { BackupLogResult } from '@/utils/xo-records/task.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { useMapper } from '@core/packages/mapper'
import { useI18n } from 'vue-i18n'

export type BackupLogResultType = 'info' | 'warning' | 'error'

const { type } = defineProps<{
  type: 'info' | 'warning' | 'error'
  results: BackupLogResult[]
}>()

const { t } = useI18n()

const cardMetadata = useMapper(
  () => type,
  {
    info: {
      title: t('info', 2),
      accent: 'info',
    },
    warning: {
      title: t('warning', 2),
      accent: 'warning',
    },
    error: {
      title: t('error', 2),
      accent: 'danger',
    },
  },
  'info'
)
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

    .stack {
      margin-block-start: 1.6rem;
    }

    .divider {
      margin-block: 1.6rem;
    }
  }
}
</style>
