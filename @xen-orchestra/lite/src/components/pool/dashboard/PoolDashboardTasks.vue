<template>
  <UiCard>
    <UiCardTitle>
      {{ t('tasks') }}
      <UiCounter
        v-if="pendingTasks.length > 0"
        accent="info"
        size="small"
        variant="primary"
        :value="pendingTasks.length"
      />
    </UiCardTitle>
    <TasksTable :pending-tasks="pendingTasks" />
  </UiCard>
</template>

<script lang="ts" setup>
import TasksTable from '@/components/tasks/TasksTable.vue'
import { useTaskStore } from '@/stores/xen-api/task.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { pendingTasks } = useTaskStore().subscribe()
</script>
