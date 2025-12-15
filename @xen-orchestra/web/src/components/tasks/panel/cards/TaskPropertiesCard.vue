<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('task.properties') }}
    </UiCardTitle>
    <div class="content">
      <div>
        <TaskPropertiesRecursive :fields="properties.other as Record<string, unknown>" />
      </div>
    </div>
    <UiLogEntryViewer
      v-if="properties.other && Object.keys(properties.other).length > 0"
      :content="properties.other"
      :label="t('other-properties')"
      size="small"
      accent="info"
    />
  </UiCard>
</template>

<script lang="ts" setup>
import TaskPropertiesRecursive from '@/components/tasks/panel/cards/TaskPropertiesRecursive.vue'
import { useTaskPropertiesUtils } from '@/composables/xo-task-properties-utils.composable.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: XoTask
}>()

const { t } = useI18n()

const { properties } = useTaskPropertiesUtils(() => task)
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
