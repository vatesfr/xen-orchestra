<template>
  <ul>
    <UiTaskItem
      v-for="task of tasksItems"
      :key="task.id"
      :task="task.source"
      :expanded="task.flags.expanded"
      :depth="depth + 1"
      @expand="task.toggleFlag('expanded')"
    />
  </ul>
</template>

<script lang="ts" setup>
import UiTaskItem, { type Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { useCollection } from '@core/packages/collection'

const { tasks, depth = 0 } = defineProps<{
  tasks: Task[]
  depth: number
}>()

const { items: tasksItems } = useCollection(() => tasks, {
  flags: ['expanded'],
})
</script>
