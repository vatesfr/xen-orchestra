<template>
  <ul>
    <UiTaskItem :task="task as any" />
    <UiTaskItem :task="task as any" />
  </ul>
</template>

<script lang="ts" setup>
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'

const task2 = {
  id: '12345',
  name: "c'est cassé",
  status: 'failure',
  tag: 'cassé',
  end: Date.now(),
  start: Date.now() - 31_536_000_000,
}

const task = {
  id: '12345',
  name: "c'est cassé",
  status: 'failure',
  tag: 'cassé',
  end: Date.now(),
  start: Date.now() - 31_536_000_000,
  subtasks: [task2, task2],
}
</script>
