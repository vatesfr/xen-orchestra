<!-- WIP -->
<template>
  <li class="ui-quick-task-item">
    <div v-if="hasSubTasks" class="toggle" @click="toggleExpand()">
      <UiButtonIcon accent="brand" :icon="isExpanded ? faAngleDown : faAngleRight" size="small" />
    </div>
    <div class="content">
      <div class="typo-body-bold">
        {{ task.name }}
      </div>
      <div class="informations">
        <div class="line-1">
          <UiTag v-if="task.tag" accent="neutral" variant="primary">{{ task.tag }}</UiTag>
          <div v-if="hasSubTasks" class="subtasks">
            <VtsIcon :icon="faCircleNotch" accent="current" />
            <span class="typo-body-regular-small">{{ t('tasks.n-subtasks', { n: subTasksCount }) }}</span>
          </div>
        </div>
        <div v-if="task.start" class="line-2 typo-body-regular-small">
          {{ d(task.start, 'datetime_short') }}
          <template v-if="task.end">
            <VtsIcon :icon="faArrowRight" accent="current" />
            {{ d(new Date(task.end), 'datetime_short') }}
          </template>
        </div>
      </div>
      <VtsQuickTaskList v-if="hasSubTasks && isExpanded" :tasks="subTasks" sublist />
    </div>
  </li>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsQuickTaskList from '@core/components/task/VtsQuickTaskList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { faAngleDown, faAngleRight, faArrowRight, faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useToggle } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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

const props = defineProps<{
  task: Task
}>()

const { t, d } = useI18n()

const [isExpanded, toggleExpand] = useToggle()

const subTasks = computed(() => props.task.subtasks ?? [])
const subTasksCount = computed(() => subTasks.value.length)
const hasSubTasks = computed(() => subTasksCount.value > 0)
</script>

<style lang="postcss" scoped>
.ui-quick-task-item {
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
  }

  .informations {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .line-1 {
    display: flex;
    align-items: center;
    gap: 0.2rem 0.8rem;
  }

  .line-2 {
    color: var(--color-neutral-txt-secondary);
  }

  .subtasks {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
}
</style>
