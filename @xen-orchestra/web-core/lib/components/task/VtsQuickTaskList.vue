<template>
  <ul :class="{ sublist }" class="vts-quick-task-list">
    <li v-if="loading">
      <div class="loading">
        <UiLoader />
        <div>{{ $t('loading-in-progress') }}</div>
      </div>
    </li>
    <template v-else>
      <li v-if="tasks.length === 0" class="typo-body-bold">{{ $t('tasks.no-tasks') }}</li>
      <UiQuickTaskItem v-for="task of tasks" :key="task.id" :task />
    </template>
  </ul>
</template>

<script lang="ts" setup>
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiQuickTaskItem, { type Task } from '@core/components/ui/quick-task-item/UiQuickTaskItem.vue'

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
  background-color: var(--color-neutral-background-primary);
  padding: 1rem 0;

  &:not(.sublist) {
    padding: 1.6rem 2rem;
    max-height: 40rem;
    overflow: auto;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }
}
</style>
