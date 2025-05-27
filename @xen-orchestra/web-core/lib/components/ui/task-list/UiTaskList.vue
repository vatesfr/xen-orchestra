<template>
  <div v-for="taskItem of taskItems" :key="taskItem.id" class="vts-tree-item">
    <ul class="ui-tree-item-label">
      <template v-if="depth != 0">
        <VtsTreeLine
          v-for="depthIndex in depth - 1"
          :key="taskItem.id + depthIndex"
          :half-height="
            taskItem.id === taskItems[taskItems.length - 1].id &&
            !taskItem.flags.expanded &&
            deepest &&
            depthIndex == depth - 1
          "
          :right="
            taskItem.id === taskItems[taskItems.length - 1].id &&
            !taskItem.flags.expanded &&
            deepest &&
            depthIndex == depth - 1
          "
          :half-width="
            taskItem.id === taskItems[taskItems.length - 1].id &&
            !taskItem.flags.expanded &&
            deepest &&
            depthIndex == depth - 1
          "
        />
        <VtsTreeLine :half-height="!taskItem.flags.expanded" right />
      </template>
      <UiTaskItem
        :task="taskItem.source"
        :expanded="taskItem.flags.expanded"
        @expend="taskItem.toggleFlag('expanded')"
      />
    </ul>
    <div>
      <UiTaskList
        v-if="taskItem.source.tasks?.length && taskItem.flags.expanded"
        :tasks="taskItem.source.tasks"
        :depth="depth + 1"
        :deepest="taskItem.id === taskItems[taskItems.length - 1].id"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsTreeLine from '@core/components/tree/VtsTreeLine.vue'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'
import { useCollection } from '@core/packages/collection'

const {
  tasks,
  depth = 0,
  deepest = false,
} = defineProps<{
  tasks: Task[]
  depth?: number
  deepest?: boolean
}>()
const { items: taskItems } = useCollection(() => tasks, {
  flags: ['expanded'],
})
</script>

<style lang="postcss" scoped>
.vts-tree-item {
  .ui-tree-item-label {
    display: flex;
    align-items: center;

    &:hover {
      background-color: var(--color-brand-background-hover);
    }

    &:active {
      background-color: var(--color-brand-background-active);
    }

    &.selected {
      background-color: var(--color-brand-background-selected);
    }

    &.disabled {
      background-color: var(--color-neutral-background-disabled);
    }

    &:focus {
      border: 0.2rem solid var(--color-info-txt-base);
      border-radius: 0.4rem;
    }
  }
}
</style>
