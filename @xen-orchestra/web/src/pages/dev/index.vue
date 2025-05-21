<template>
  <UiTaskList :tasks="[task, task3]" />
</template>

<script lang="ts" setup>
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'

const task2: Task = {
  errored: false,
  id: 'dfdfv',
  status: 'success',
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  tag: 'cassé',
  label: "c'est cassé",
  progress: 42,
}
const task4: Task = {
  errored: true,
  status: 'success',
  id: 'sdfghj',
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  tag: 'cassé',
  label: "c'est cassé",
  progress: 42,
}

const task: Task = {
  errored: false,
  status: 'success',
  id: 'efzefsd',
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  tag: 'cassé',
  label: "c'est cassé",
  progress: 42,
  warningsCount: 4,
  tasks: [task4, task2],
}

const task3: Task = {
  errored: true,
  status: 'success',
  id: 'wxcwx',
  start: Date.now() - 31_536_000_000 / 2,
  end: Date.now(),
  tag: 'cassé',
  label: "c'est cassé",
  progress: 42,
  infosCount: 8,
  tasks: [task, task4],
}

task2.tasks = [task]
</script>
