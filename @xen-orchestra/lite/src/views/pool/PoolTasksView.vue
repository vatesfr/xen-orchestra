<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiTitle class="title-with-counter" type="h4">
      {{ $t('tasks') }}
      <UiCounter :value="pendingTasks.length" color="info" />
    </UiTitle>
    <TasksTable :finished-tasks="finishedTasks" :pending-tasks="pendingTasks" />
    <UiCardSpinner v-if="!isReady" />
  </UiCard>
</template>

<script lang="ts" setup>
import TasksTable from '@/components/tasks/TasksTable.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import UiCounter from '@/components/ui/UiCounter.vue'
import UiTitle from '@/components/ui/UiTitle.vue'
import { useTaskCollection } from '@/stores/xen-api/task.store'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useI18n } from 'vue-i18n'

const { pendingTasks, finishedTasks, isReady, hasError } = useTaskCollection()

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
  gap: 0.5rem;

  .ui-counter {
    font-size: 1.4rem;
  }
}

.ui-card {
  margin: 1rem;
}
</style>
