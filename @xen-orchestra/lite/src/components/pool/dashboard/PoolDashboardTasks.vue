<template>
  <UiCard>
    <UiCardTitle :count="pendingTasks.length">{{ t('tasks') }}</UiCardTitle>
    <TasksTable :pending-tasks="pendingTasks" />
  </UiCard>
</template>

<script lang="ts" setup>
import TasksTable from '@/components/tasks/TasksTable.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { useTaskStore } from '@/stores/xen-api/task.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { pendingTasks } = useTaskStore().subscribe()
</script>
