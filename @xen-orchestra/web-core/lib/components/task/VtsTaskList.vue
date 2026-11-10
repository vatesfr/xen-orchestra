<template>
  <VtsTreeList>
    <VtsTaskItem
      v-for="task of tasksItems"
      :key="task.id"
      :task="task.source"
      :show-eye-icon
      :expanded="task.flags.expanded"
      :selected-task-id
      :auto-collapse-completed
      @select="id => emit('select', id)"
      @expand="task.toggleFlag('expanded')"
    />
  </VtsTreeList>
</template>

<script lang="ts" setup>
import VtsTaskItem from '@core/components/task/VtsTaskItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { useCollection } from '@core/packages/collection'
import { watch } from 'vue'

const {
  tasks,
  showEyeIcon = true,
  autoCollapseCompleted,
} = defineProps<{
  tasks: Task[]
  selectedTaskId?: string
  showEyeIcon?: boolean
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
