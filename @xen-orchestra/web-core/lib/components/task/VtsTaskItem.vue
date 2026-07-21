<template>
  <VtsTreeItem :expanded :node-id="task.id" :has-children="hasSubTasks">
    <VtsTaskItemLabel :selected @toggle="emit('expand')">
      <UiTaskItem :task :selected @select="id => emit('select', id)" />
    </VtsTaskItemLabel>
    <template v-if="hasSubTasks" #sublist>
      <VtsTreeList class="vts-subtask-list">
        <VtsTaskList sublist :tasks="subTasks" :selected-task-id @select="id => emit('select', id)" />
      </VtsTreeList>
    </template>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import VtsTaskItemLabel from '@core/components/task/VtsTaskItemLabel.vue'
import VtsTaskList from '@core/components/task/VtsTaskList.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'
import type { Task } from '@core/types/task.type.ts'
import { computed } from 'vue'

const { task } = defineProps<{
  task: Task
  expanded?: boolean
  selected?: boolean
  selectedTaskId?: string
}>()

const emit = defineEmits<{
  expand: []
  select: [id: string]
}>()

const subTasks = computed(() => task.subtasks ?? [])

const hasSubTasks = computed(() => subTasks.value.length > 0)
</script>
