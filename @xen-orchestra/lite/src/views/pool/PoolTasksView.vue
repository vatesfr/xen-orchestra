<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiTitle class="title-with-counter" type="h4">
      {{ $t('tasks') }}
      <UiCounter :value="pendingTasks.length" color="primary" size="medium" />
    </UiTitle>
    <TasksTable :finished-tasks="finishedTasks" :pending-tasks="pendingTasks" />
    <UiCardSpinner v-if="!isReady" />
  </UiCard>
</template>

<script lang="ts" setup>
import TasksTable from '@/components/tasks/TasksTable.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import UiTitle from '@/components/ui/UiTitle.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useTaskStore } from '@/stores/xen-api/task.store'
import UiCounter from '@core/components/UiCounter.vue'
import { useI18n } from 'vue-i18n'

const { pendingTasks, finishedTasks, isReady, hasError } = useTaskStore().subscribe()

const { t } = useI18n()

const titleStore = usePageTitleStore()
titleStore.setTitle(t('tasks'))
titleStore.setCount(() => pendingTasks.value.length)
</script>

<style lang="postcss" scoped>
.title-with-counter {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.ui-card {
  margin: 1rem;
}
</style>
