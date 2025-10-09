<template>
  <UiCard>
    <UiCardTitle>
      {{ t('task.properties') }}
      <UiCounter
        :value="properties.other && Object.keys(properties.other).length"
        accent="neutral"
        size="small"
        variant="primary"
      />
    </UiCardTitle>
    <div class="content">
      <UiLogEntryViewer
        v-if="properties.other && Object.keys(properties.other).length > 0"
        :content="properties.other"
        :label="t('other-properties')"
        size="small"
        accent="info"
      />
    </div>
    <div>
      <div>{{ t('other-properties') }}</div>
      <TaskPropertiesRecursive :data="properties.other as Record<string, unknown>" />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import TaskPropertiesRecursive from '@/components/tasks/panel/cards/TaskPropertiesRecursive.vue'
import type { XoTask } from '@/types/xo/task.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { reactiveComputed } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: XoTask
}>()

const { t } = useI18n()

const properties = reactiveComputed(() => {
  if (!task.properties) {
    return {}
  }

  const { method, name, type, objectId, params, progress, userId, ...other } = task.properties

  return {
    method,
    name,
    type,
    objectId,
    params,
    progress,
    userId,
    other,
  }
})
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .divider {
    margin-block: 1.6rem;
  }
}
</style>
