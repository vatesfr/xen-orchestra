<!-- WIP -->
<template>
  <li class="ui-task-item">
    <div v-if="hasSubTasks" class="toggle" @click="toggleExpand()">
      <UiButtonIcon accent="brand" :icon="isExpanded ? faAngleDown : faAngleRight" size="small" />
    </div>
    <div class="content">
      <div class="typo-body-bold">
        {{ task.name }}
      </div>
      <UiTag v-if="task.tag" accent="info" variant="secondary">{{ task.tag }}</UiTag>
      <div v-if="hasSubTasks" class="subtasks">
        <VtsIcon :icon="faCircleNotch" accent="current" />
        <span class="typo-body-regular-small">{{ $t('tasks.n-subtasks', { n: subTasksCount }) }}</span>
      </div>
    </div>
    <div class="informations typo-body-regular-small">
      <template v-if="task.start">
        {{ `${$t('started-at')} ${started}` }}
      </template>
      <template v-if="task.start && task.end">
        <span class="interpunct" />
      </template>
      <template v-if="task.end">
        {{ `${$t('task.estimated-end')} ${end}` }}
      </template>
    </div>
    <VtsQuickTaskList v-if="hasSubTasks && isExpanded" :tasks="subTasks" sublist />
  </li>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsQuickTaskList from '@core/components/task/VtsQuickTaskList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { faAngleDown, faAngleRight, faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useTimeAgo, useToggle } from '@vueuse/core'
import { computed } from 'vue'

export type TaskStatus = 'pending' | 'success' | 'failure'

export type Task = {
  id: string | number
  name: string
  status: TaskStatus
  tag?: string
  start?: number
  end?: number
  subtasks?: Task[]
}

const { task } = defineProps<{
  task: Task
}>()

const [isExpanded, toggleExpand] = useToggle()

const subTasks = computed(() => task.subtasks ?? [])
const subTasksCount = computed(() => subTasks.value.length)
const hasSubTasks = computed(() => subTasksCount.value > 0)
const started = typeof task.start === 'number' ? useTimeAgo(() => task.start as number) : undefined
const end = typeof task.end === 'number' ? useTimeAgo(() => task.end as number) : undefined
</script>

<style lang="postcss" scoped>
.ui-task-item {
  display: flex;

  &:not(:last-child) {
    border-bottom: 0.1rem solid var(--color-neutral-border);
  }

  .toggle {
    padding: 0.4rem 0;
  }

  .content {
    flex: 1;
    padding: 0.4rem 0.4rem 0.4rem 0.8rem;
    display: flex;
    gap: 1.6rem;
  }

  .informations {
    display: flex;
    gap: 0.8rem;

    .interpunct::before {
      content: '•';
    }
  }

  .subtasks {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .typo-body-regular-small {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
