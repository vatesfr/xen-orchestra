<template>
  <VtsTaskListLevel :tasks />
</template>

<script lang="ts" setup>
import VtsTaskListLevel from '@core/components/task/VtsTaskListLevel.vue'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { IK_TASK_LIST_CONTEXT } from '@core/utils/injection-keys.util.ts'
import { provide, type Ref, toRef } from 'vue'

export type TaskListContext = {
  selectedTaskId: Readonly<Ref<string | undefined>>
  showEyeIcon: Readonly<Ref<boolean>>
  autoCollapseCompleted: Readonly<Ref<boolean>>
  expandAll: Readonly<Ref<boolean>>
  unreadTaskIds: Readonly<Ref<ReadonlySet<string> | undefined>>
  select: (id: string) => void
}

const {
  tasks,
  selectedTaskId,
  showEyeIcon = false,
  autoCollapseCompleted = false,
  expandAll = false,
  unreadTaskIds,
} = defineProps<{
  tasks: Task[]
  selectedTaskId?: string
  showEyeIcon?: boolean
  autoCollapseCompleted?: boolean
  expandAll?: boolean
  unreadTaskIds?: ReadonlySet<string>
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

provide(IK_TASK_LIST_CONTEXT, {
  selectedTaskId: toRef(() => selectedTaskId),
  showEyeIcon: toRef(() => showEyeIcon),
  autoCollapseCompleted: toRef(() => autoCollapseCompleted),
  expandAll: toRef(() => expandAll),
  unreadTaskIds: toRef(() => unreadTaskIds),
  select: id => emit('select', id),
})
</script>
