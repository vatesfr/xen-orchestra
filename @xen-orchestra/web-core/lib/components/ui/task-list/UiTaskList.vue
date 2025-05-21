<template>
  <template v-for="taskItem of taskItems" :key="taskItem.id">
    <UiTaskItem :task="taskItem.source" />
    <UiTaskList
      v-if="taskItem.source.tasks?.length && taskItem.flags.expanded"
      :tasks="taskItem.source.tasks"
      class="sub-tasks"
      :depth="depth + 1"
    />
  </template>
</template>

<script lang="ts" setup>
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'
import { useCollection } from '@core/packages/collection'

const { tasks, depth = 0 } = defineProps<{
  tasks: Task[]
  depth?: number
}>()

const { items: taskItems } = useCollection(() => tasks, {
  flags: ['expanded'],
})
</script>

<style lang="postcss" scoped>
.sub-tasks {
  margin-left: 2rem;
}
</style>
