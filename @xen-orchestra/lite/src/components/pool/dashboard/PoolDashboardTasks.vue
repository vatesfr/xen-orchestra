<template>
  <UiCard>
    <UiCardTitle :count="pendingTasks.length">{{ $t('tasks') }}</UiCardTitle>
    <TasksTable :pending-tasks="pendingTasks" />
  </UiCard>
</template>

<script lang="ts" setup>
import TasksTable from '@/components/tasks/TasksTable.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { useTaskCollection } from '@/stores/xen-api/task.store'

const { pendingTasks } = useTaskCollection()
</script>

<style lang="postcss" scoped></style>
