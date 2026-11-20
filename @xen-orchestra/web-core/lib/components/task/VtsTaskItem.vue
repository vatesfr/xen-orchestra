<template>
  <VtsTreeItem :expanded :node-id="task.id" :has-children="hasSubTasks">
    <VtsTaskItemLabel :selected="isSelected" @toggle="emit('expand')">
      <UiTaskItem :task :show-eye-icon :show-unread :unread="isUnread" @select="id => select(id)" />
    </VtsTaskItemLabel>
    <template v-if="hasSubTasks" #sublist>
      <VtsTaskListLevel :tasks="subTasks" />
    </template>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import VtsTaskItemLabel from '@core/components/task/VtsTaskItemLabel.vue'
import VtsTaskListLevel from '@core/components/task/VtsTaskListLevel.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTaskItem, { type Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { useTaskListContext } from '@core/composables/task-list-context.composable.ts'
import { computed } from 'vue'

const { task } = defineProps<{
  task: Task
  expanded?: boolean
}>()

const emit = defineEmits<{
  expand: []
}>()

const { selectedTaskId, showEyeIcon, unreadTaskIds, select } = useTaskListContext()

const subTasks = computed(() => task.subtasks ?? [])

const hasSubTasks = computed(() => subTasks.value.length > 0)

const isSelected = computed(() => selectedTaskId.value === task.id)

const showUnread = computed(() => unreadTaskIds.value !== undefined)

const isUnread = computed(() => unreadTaskIds.value?.has(task.id) ?? false)
</script>
