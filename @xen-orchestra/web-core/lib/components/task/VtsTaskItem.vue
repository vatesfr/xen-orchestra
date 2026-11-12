<template>
  <VtsTreeItem :expanded :node-id="task.id" :has-children="hasSubTasks">
    <VtsTaskItemLabel :selected="isSelected" @toggle="emit('expand')">
      <UiTaskItem :task :show-eye-icon @select="id => emit('select', id)" />
    </VtsTaskItemLabel>
    <template v-if="hasSubTasks" #sublist>
      <VtsTaskList
        :tasks="subTasks"
        :selected-task-id
        :show-eye-icon
        :auto-collapse-completed
        :expand-all
        @select="id => emit('select', id)"
      />
    </template>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import VtsTaskItemLabel from '@core/components/task/VtsTaskItemLabel.vue'
import VtsTaskList from '@core/components/task/VtsTaskList.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTaskItem, { type Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { computed } from 'vue'

const { task, selectedTaskId } = defineProps<{
  task: Task
  expanded?: boolean
  selectedTaskId?: string
  showEyeIcon?: boolean
  autoCollapseCompleted?: boolean
  expandAll?: boolean
}>()

const emit = defineEmits<{
  expand: []
  select: [id: string]
}>()

const subTasks = computed(() => task.subtasks ?? [])

const hasSubTasks = computed(() => subTasks.value.length > 0)

const isSelected = computed(() => selectedTaskId === task.id)
</script>
