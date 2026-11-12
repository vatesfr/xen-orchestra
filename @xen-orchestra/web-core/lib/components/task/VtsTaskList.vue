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
      :expand-all
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
import { hasSubtask } from '@core/utils/task.util.ts'
import { computed, watch } from 'vue'

const {
  tasks,
  selectedTaskId,
  showEyeIcon = true,
  autoCollapseCompleted,
  expandAll,
} = defineProps<{
  tasks: Task[]
  selectedTaskId?: string
  showEyeIcon?: boolean
  autoCollapseCompleted?: boolean
  expandAll?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const { items: tasksItems, toggleFlag } = useCollection(() => tasks, {
  flags: { expanded: true },
})

// Collapse tasks once, when they complete, so a task expanded manually stays expanded
watch(
  () =>
    autoCollapseCompleted ? tasksItems.value.filter(task => task.source.end !== undefined).map(task => task.id) : [],
  (completedTaskIds, previousCompletedTaskIds = []) => {
    tasksItems.value
      .filter(task => completedTaskIds.includes(task.id) && !previousCompletedTaskIds.includes(task.id))
      .forEach(task => task.toggleFlag('expanded', false))
  }
)

const selectedTaskParentId = computed(() =>
  selectedTaskId ? tasksItems.value.find(item => hasSubtask(item.source, selectedTaskId))?.id : undefined
)

// Only the tasks expanded by expandAll, so turning it off restores the previous state
const expandedByExpandAll = new Set<string>()

// Expand new tasks while expandAll is on, collapse them back when it turns off (except the selected task's parent)
watch(
  () => (expandAll ? tasksItems.value.map(task => task.id) : []),
  (_, previousTaskIds = []) => {
    if (!expandAll) {
      expandedByExpandAll.forEach(id => {
        if (id !== selectedTaskParentId.value) {
          toggleFlag(id, 'expanded', false)
        }
      })

      expandedByExpandAll.clear()

      return
    }

    tasksItems.value
      .filter(task => !previousTaskIds.includes(task.id) && !task.flags.expanded)
      .forEach(task => {
        expandedByExpandAll.add(task.id)
        task.toggleFlag('expanded', true)
      })
  },
  { immediate: true }
)

// Expand the selected task's parent. Watch the id, not the item: items are rebuilt on every update, which would unfold it again.
// selectedTaskId is also a source so selecting another subtask of a manually collapsed parent unfolds it again
watch(
  [() => selectedTaskId, selectedTaskParentId],
  ([, id]) => {
    if (id !== undefined) {
      toggleFlag(id, 'expanded', true)
    }
  },
  { immediate: true }
)
</script>
