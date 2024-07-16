<template>
  <ul :class="{ sublist }" class="vts-quick-task-list">
    <li v-if="loading">
      <div class="loading">
        <UiSpinner />
        <div>{{ $t('loading-in-progress') }}</div>
      </div>
    </li>
    <template v-else>
      <li v-if="tasks.length === 0" class="typo p1-medium">{{ $t('tasks.no-tasks') }}</li>
      <QuickTaskItem v-for="task of tasks" :key="task.id" :task />
    </template>
  </ul>
</template>

<script lang="ts" setup>
import QuickTaskItem from '@core/components/task/QuickTaskItem.vue'
import UiSpinner from '@core/components/UiSpinner.vue'
import type { Task } from '@core/types/task.type'

defineProps<{
  tasks: Task[]
  sublist?: boolean
  loading?: boolean
}>()
</script>

<style lang="postcss" scoped>
.vts-quick-task-list {
  display: flex;
  flex-direction: column;
  background-color: var(--background-color-primary);
  padding: 1rem 0;

  &:not(.sublist) {
    padding: 1.6rem 2rem;
    max-height: 40rem;
    overflow: auto;
  }
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
</style>
