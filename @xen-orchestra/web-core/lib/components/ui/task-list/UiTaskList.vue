<template>
  <div v-for="taskItem of taskItems" :key="taskItem.id" class="vts-tree-item">
    <div class="ui-tree-item-label">
      <template v-if="depth != 0">
        <VtsTreeLine
          v-for="i in depth - 1"
          :key="i"
          :half-height="taskItem.id === taskItems[taskItems.length - 1].id && !taskItem.flags.expanded"
          :right="taskItem.id === taskItems[taskItems.length - 1].id && !taskItem.flags.expanded"
          :half-width="taskItem.id === taskItems[taskItems.length - 1].id && !taskItem.flags.expanded"
        />
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
        :tasks="[task2, task]"
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

const task2: Task = {
  errored: false,
  id: 'dfdfv' + Date.now(),
  status: 'success',
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  tag: 'cassé',
  label: "c'est cassé",
  progress: 42,
}
const task4: Task = {
  errored: true,
  status: 'success',
  id: 'sdfghj' + Date.now(),
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  tag: 'cassé',
  label: "c'est cassé",
  progress: 42,
}

const task: Task = {
  errored: false,
  status: 'success',
  id: 'efzefsd' + Date.now(),
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  tag: 'cassé',
  label: "c'est cassé",
  progress: 42,
  warningsCount: 4,
  tasks: [task4, task2],
}
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
