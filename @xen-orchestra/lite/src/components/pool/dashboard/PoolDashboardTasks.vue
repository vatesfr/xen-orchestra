<template>
  <UiCard>
    <UiCardTitle>
      {{ t('tasks') }}
      <UiCounter :value="pendingTasks.length" accent="danger" size="medium" variant="primary" />
    </UiCardTitle>
    <TasksTable :pending-tasks="pendingTasks" />
  </UiCard>
</template>

<script lang="ts" setup>
import TasksTable from '@/components/tasks/TasksTable.vue'
import UiCard from '@/components/ui/UiCard.vue'
import { useTaskStore } from '@/stores/xen-api/task.store'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { pendingTasks } = useTaskStore().subscribe()
</script>
