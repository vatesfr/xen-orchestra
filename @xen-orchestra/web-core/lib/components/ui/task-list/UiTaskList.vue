<template>
  <div v-for="taskItem of taskItems" :key="taskItem.id" class="task">
    <div class="task-item">
      <UiButtonIcon
        v-if="taskItem.source.tasks?.length"
        class="toggle"
        accent="brand"
        :icon="taskItem.flags.expanded ? faAngleDown : faAngleRight"
        size="small"
        @click="taskItem.toggleFlag('expanded')"
      />
      <UiTaskItem :task="taskItem.source" />
    </div>
    <div class="sub-tasks">
      <UiTaskList
        v-if="taskItem.source.tasks?.length && taskItem.flags.expanded"
        :tasks="taskItem.source.tasks"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'
import { useCollection } from '@core/packages/collection'
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import UiButtonIcon from '../button-icon/UiButtonIcon.vue'

const { tasks, depth = 0 } = defineProps<{
  tasks: Task[]
  depth?: number
}>()

const { items: taskItems } = useCollection(() => tasks, {
  flags: ['expanded'],
})
</script>

<style lang="postcss" scoped>
.task {
  .task-item {
    display: flex;
    align-items: center;
  }

  .sub-tasks {
    margin-left: 2rem;
  }
}
</style>
