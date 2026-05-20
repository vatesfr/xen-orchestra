<template>
  <UiCard>
    <UiCardTitle>
      {{ t('tasks') }}
      <UiCounter :value="pendingTasks.length" accent="info" size="medium" variant="primary" />
    </UiCardTitle>
    <TasksTable :finished-tasks="finishedTasks" :pending-tasks="pendingTasks" />
  </UiCard>
</template>

<script lang="ts" setup>
import TasksTable from '@/components/tasks/TasksTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useTaskStore } from '@/stores/xen-api/task.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useI18n } from 'vue-i18n'

const { pendingTasks, finishedTasks } = useTaskStore().subscribe()

const { t } = useI18n()

const titleStore = usePageTitleStore()
titleStore.setTitle(t('tasks'))
titleStore.setCount(() => pendingTasks.value.length)
</script>

<style lang="postcss" scoped>
.title-with-counter {
  margin-bottom: 1rem;
  gap: 1rem;
}

.ui-card {
  margin: 1rem;
}
</style>
