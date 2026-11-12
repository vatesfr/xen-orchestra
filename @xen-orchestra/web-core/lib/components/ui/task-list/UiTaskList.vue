<template>
  <ul class="ui-task-list">
    <UiTaskItem
      v-for="task of tasksItems"
      :key="task.id"
      :task="task.source"
      show-eye-icon
      :expanded="task.flags.expanded"
      :depth="depth + 1"
      :selected="selectedTaskId === task.id"
      :selected-task-id="selectedTaskId"
      :auto-collapse-completed
      @select="emit('select', $event)"
      @expand="task.toggleFlag('expanded')"
    />
  </ul>
</template>

<script lang="ts" setup>
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { useCollection } from '@core/packages/collection'
import { watch } from 'vue'

const {
  tasks,
  depth = 0,
  autoCollapseCompleted,
} = defineProps<{
  tasks: Task[]
  depth?: number
  selectedTaskId?: string
  autoCollapseCompleted?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const { items: tasksItems } = useCollection(() => tasks, {
  flags: { expanded: true },
})

watch(
  () =>
    autoCollapseCompleted ? tasksItems.value.filter(task => task.source.end !== undefined).map(task => task.id) : [],
  (completedTaskIds, previousCompletedTaskIds = []) => {
    tasksItems.value
      .filter(task => completedTaskIds.includes(task.id) && !previousCompletedTaskIds.includes(task.id))
      .forEach(task => task.toggleFlag('expanded', false))
  }
)
</script>

<style scoped lang="postcss">
.ui-task-list {
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
