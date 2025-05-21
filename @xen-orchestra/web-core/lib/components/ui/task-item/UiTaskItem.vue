<!-- WIP -->
<template>
  <div class="ui-task-item">
    <div class="content">
      <div class="typo-body-bold">
        {{ task.label }}
      </div>
      <UiTag v-if="task.type" accent="info" variant="secondary">{{ task.type }}</UiTag>
      <div v-if="hasSubTasks" class="subtasks">
        <VtsIcon :icon="faCircleNotch" accent="current" />
        <span class="typo-body-regular-small">{{ $t('tasks.n-subtasks', { n: subTasksCount }) }}</span>
      </div>
    </div>
    <div class="informations typo-body-regular-small">
      <!-- todo add user link. wating user page -->
      <span v-if="task.start" class="start">
        {{ `${$t('started-at')} ${started}` }}
      </span>
      <span v-if="task.end" class="end">
        {{ `${$t('task.estimated-end')} ${end}` }}
      </span>
      <UiCircleProgressBar v-if="task.progress" accent="info" size="small" :value="task.progress" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useTimeAgo } from '@vueuse/core'
import { computed } from 'vue'
import UiCircleProgressBar from '../circle-progress-bar/UiCircleProgressBar.vue'

export type Task = {
  id: string
  start?: number
  end?: number
  type?: string
  label?: string
  progress?: number
  warningsCount?: number
  infosCount?: number
  tasks?: Task[]
}

const { task } = defineProps<{
  task: Task
}>()

const subTasks = computed(() => task.tasks ?? [])
const subTasksCount = computed(() => subTasks.value.length)
const hasSubTasks = computed(() => subTasksCount.value > 0)
const started = typeof task.start === 'number' ? useTimeAgo(() => task.start as number) : undefined
const end = typeof task.end === 'number' ? useTimeAgo(() => task.end as number) : undefined
</script>

<style lang="postcss" scoped>
.ui-task-item {
  width: 100%;
  margin: 0 2.4rem;
  display: flex;
  justify-content: space-between;

  &:not(:last-child) {
    border-bottom: 0.1rem solid var(--color-neutral-border);
  }

  .informations,
  .content {
    display: flex;
    align-items: center;
    gap: 1.6rem;
    padding: 0.4rem 0;
  }

  .start + .end::before {
    content: '•';
    margin-right: 0.8rem;
  }

  .typo-body-regular-small {
    color: var(--color-neutral-txt-secondary);
  }

  .subtasks {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
}
</style>
