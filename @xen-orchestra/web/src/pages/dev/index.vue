<template>
  <UiTaskList :tasks="[task, task3]" />
</template>

<script lang="ts" setup>
import type { Task } from '@core/components/ui/quick-task-item/UiQuickTaskItem.vue'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'

const task2: Task = {
  id: 'dfdfv',
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  type: 'cassé',
  label: "c'est cassé",
  progress: 42,
}
const task4: Task = {
  id: 'sdfghj',
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  type: 'cassé',
  label: "c'est cassé",
  progress: 42,
}

const task: Task = {
  id: 'efzefsd',
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  type: 'cassé',
  label: "c'est cassé",
  progress: 42,
  tasks: [task2, task4],
}

const task3: Task = {
  id: 'wxcwx',
  start: Date.now() - 31_536_000_000 / 2,
  end: Date.now(),
  type: 'cassé',
  label: "c'est cassé",
  progress: 42,
  tasks: [task4, task],
}

task2.tasks = [task]
</script>
