<template>
  <div v-for="taskItem of taskItems" :key="taskItem.id" class="vts-tree-item">
    <div class="ui-tree-item-label">
      <template v-if="depth != 0">
        <VtsTreeLine v-for="i in depth - 1" :key="i" :half-height="false" :right="false" />
        <VtsTreeLine :half-height="!taskItem.flags.expanded" right />
      </template>
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
    <div>
      <UiTaskList
        v-if="taskItem.source.tasks?.length && taskItem.flags.expanded"
        :tasks="taskItem.source.tasks"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsTreeLine from '@core/components/tree/VtsTreeLine.vue'
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
