<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('properties') }}
    </UiCardTitle>
    <div class="content">
      <VtsRecursiveFields :fields="properties.other" />
    </div>
    <UiLogEntryViewer :content="properties.other" :label="t('other-properties')" size="small" accent="info" />
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoTaskPropertiesUtils } from '@/modules/task/composables/xo-task-properties-utils.composable.ts'
import VtsRecursiveFields from '@core/components/recursive-fields/VtsRecursiveFields.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: XoTask
}>()

const { t } = useI18n()

const { properties } = useXoTaskPropertiesUtils(() => task)
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
