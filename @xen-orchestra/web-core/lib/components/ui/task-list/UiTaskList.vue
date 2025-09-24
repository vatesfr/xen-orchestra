<template>
  <ul class="ui-task-list">
    <UiTaskItem
      v-for="task of tasksItems"
      :key="task.id"
      :task="task.source"
      :expanded="task.flags.expanded"
      :depth="depth + 1"
      @select="emit('select', task.id)"
      @expand="task.toggleFlag('expanded')"
    />
  </ul>
</template>

<script lang="ts" setup>
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'
import { useCollection } from '@core/packages/collection'
import type { Task } from '@core/types/task.type.ts'

const { tasks, depth = 0 } = defineProps<{
  tasks: Task[]
  depth?: number
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const { items: tasksItems } = useCollection(() => tasks, {
  flags: ['expanded'],
})
</script>

<style scoped lang="postcss">
.ui-task-list {
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
