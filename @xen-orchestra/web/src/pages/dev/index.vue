<template>
  <UiTaskList :tasks="[task, task]" />
</template>

<script lang="ts" setup>
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'

const task2 = {
  id: '1234',
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  type: 'cassé',
  label: "c''est cassé",
  progress: 42,
}

const task = {
  id: '1234',
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  type: 'cassé',
  label: "c''est cassé",
  progress: 42,
  tasks: [task2, task2],
}
</script>
