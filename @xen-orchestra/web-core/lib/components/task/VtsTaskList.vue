<template>
  <VtsTreeList v-if="!sublist" class="vts-task-list">
    <VtsTaskItem
      v-for="task of tasksItems"
      :key="task.id"
      :task="task.source"
      :expanded="task.flags.expanded"
      :selected="selectedTaskId === task.id"
      :selected-task-id="selectedTaskId"
      @select="emit('select', $event)"
      @expand="task.toggleFlag('expanded')"
    />
  </VtsTreeList>
  <template v-else>
    <VtsTaskItem
      v-for="task of tasksItems"
      :key="task.id"
      :task="task.source"
      :expanded="task.flags.expanded"
      :selected="selectedTaskId === task.id"
      :selected-task-id="selectedTaskId"
      @select="emit('select', $event)"
      @expand="task.toggleFlag('expanded')"
    />
  </template>
</template>

<script lang="ts" setup>
import VtsTaskItem from '@core/components/task/VtsTaskItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import { useCollection } from '@core/packages/collection'
import type { Task } from '@core/types/task.type.ts'

const { tasks } = defineProps<{
  tasks: Task[]
  selectedTaskId?: string
  sublist?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const { items: tasksItems } = useCollection(() => tasks, {
  flags: ['expanded'],
})
</script>

<style scoped lang="postcss">
.vts-task-list {
  overflow-x: auto;
  overflow-y: hidden;
  padding-inline: 0.4rem 0.8rem;
}
</style>
