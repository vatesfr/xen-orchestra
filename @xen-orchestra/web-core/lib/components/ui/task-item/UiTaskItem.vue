<template>
  <li class="ui-task-item">
    <div class="content">
      <UiButtonIcon
        v-if="hasSubTasks"
        :target-scale="{ x: 2, y: 3 }"
        class="toggle"
        accent="brand"
        :icon="expanded ? faAngleDown : faAngleRight"
        size="small"
        @click.stop="emit('expend')"
      />
      <div v-if="task.label" class="typo-body-bold">
        {{ task.label }}
      </div>
      <UiTag v-if="task.tag" accent="info" variant="secondary">{{ task.tag }}</UiTag>
      <div v-if="hasSubTasks" class="subtasks">
        <VtsIcon :icon="faCircleNotch" accent="current" />
        <span class="typo-body-regular-small">{{ $t('tasks.n-subtasks', { n: subTasksCount }) }}</span>
      </div>
      <UiInfo v-if="task.errored" class="typo-body-regular-small" accent="danger">{{ `1 ${$t('errors')}` }}</UiInfo>
      <UiInfo v-if="task.warningsCount && task.warningsCount !== 0" class="typo-body-regular-small" accent="warning">
        {{ task.warningsCount + ' ' + $t('warnings', task.warningsCount!) }}
      </UiInfo>
      <UiInfo v-if="task.infosCount && task.infosCount !== 0" class="typo-body-regular-small" accent="info">
        {{ task.infosCount + ' ' + $t('infos', task.infosCount!) }}
      </UiInfo>
    </div>
    <div class="informations typo-body-regular-small">
      <span v-if="task.start" class="start">
        {{ `${$t('started-at')} ${started}` }}
      </span>
      <span v-if="task.end" class="end">
        {{ `${$t('task.estimated-end')} ${end}` }}
      </span>
      <UiCircleProgressBar v-if="task.progress" accent="info" size="small" :value="task.progress" />
      <span v-else class="circle-hero" />
    </div>
  </li>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { faCircleNotch, faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { useTimeAgo } from '@vueuse/core'
import { computed } from 'vue'
import UiButtonIcon from '../button-icon/UiButtonIcon.vue'
import UiCircleProgressBar from '../circle-progress-bar/UiCircleProgressBar.vue'
import UiInfo from '../info/UiInfo.vue'

export type TaskStatus = 'pending' | 'success' | 'failure' | 'interrupted'

export type Task = {
  id: string
  start: number
  errored: boolean
  status: TaskStatus
  end?: number
  tag?: string
  label?: string
  progress?: number
  warningsCount?: number
  infosCount?: number
  tasks?: Task[]
}

const props = defineProps<{
  task: Task
  expanded?: boolean
}>()

const emit = defineEmits<{ expend: [] }>()

const subTasks = computed(() => props.task.tasks ?? [])
const subTasksCount = computed(() => subTasks.value.length)
const hasSubTasks = computed(() => subTasksCount.value > 0)
const started = typeof props.task.start === 'number' ? useTimeAgo(() => props.task.start as number) : undefined
const end = typeof props.task.end === 'number' ? useTimeAgo(() => props.task.end as number) : undefined
</script>

<style lang="postcss" scoped>
.ui-task-item {
  width: 100%;
  margin: 0 0.4rem;
  display: flex;
  justify-content: space-between;

  &:not(:last-child) {
    border-bottom: 0.1rem solid var(--color-neutral-border);
  }

  .subtasks {
    display: flex;
    align-items: center;
    gap: 0.4rem;
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
    margin-inline-end: 0.8rem;
  }

  .typo-body-regular-small {
    color: var(--color-neutral-txt-secondary);
  }

  .circle-hero {
    height: 4rem;
    width: 4rem;
  }
}
</style>
