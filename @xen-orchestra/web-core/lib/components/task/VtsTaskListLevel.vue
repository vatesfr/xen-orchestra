<template>
  <VtsTreeList>
    <VtsTaskItem
      v-for="task of tasksItems"
      :key="task.id"
      :task="task.source"
      :expanded="expandAll ? !task.flags.searchCollapsed : task.flags.expanded"
      @toggle="task.toggleFlag(expandAll ? 'searchCollapsed' : 'expanded')"
    />
  </VtsTreeList>
</template>

<script lang="ts" setup>
import VtsTaskItem from '@core/components/task/VtsTaskItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { useTaskListContext } from '@core/composables/task-list-context.composable.ts'
import { useCollection } from '@core/packages/collection'
import { hasSubtask } from '@core/utils/task.util.ts'
import { computed, watch } from 'vue'

const { tasks } = defineProps<{
  tasks: Task[]
}>()

const { selectedTaskId, autoCollapseCompleted, expandAll } = useTaskListContext()

// While expandAll is on, the tasks follow `searchCollapsed` instead of `expanded`, which keeps the state to restore
const {
  items: tasksItems,
  toggleFlag,
  clearFlag,
} = useCollection(() => tasks, {
  flags: { expanded: true, searchCollapsed: true },
})

// Collapse tasks once, when they complete, so a task expanded manually stays expanded
watch(
  () =>
    autoCollapseCompleted.value
      ? tasksItems.value.filter(task => task.source.end !== undefined).map(task => task.id)
      : [],
  (completedTaskIds, previousCompletedTaskIds = []) => {
    tasksItems.value
      .filter(task => completedTaskIds.includes(task.id) && !previousCompletedTaskIds.includes(task.id))
      .forEach(task => task.toggleFlag('expanded', false))
  }
)

const selectedTaskParentId = computed(() => {
  const taskId = selectedTaskId.value

  return taskId ? tasksItems.value.find(item => hasSubtask(item.source, taskId))?.id : undefined
})

// Each expandAll starts with every task expanded
watch(expandAll, () => clearFlag('searchCollapsed'))

// Expand the selected task's parent, in both states so it stays expanded once expandAll turns off.
// Watch the id, not the item: items are rebuilt on every update, which would unfold it again.
// selectedTaskId is also a source so selecting another subtask of a manually collapsed parent unfolds it again
watch(
  [selectedTaskId, selectedTaskParentId],
  ([, id]) => {
    if (id !== undefined) {
      toggleFlag(id, 'expanded', true)
      toggleFlag(id, 'searchCollapsed', false)
    }
  },
  { immediate: true }
)
</script>
