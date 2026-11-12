<!-- v10 -->
<template>
  <div class="ui-task-item">
    <div class="layout">
      <VtsTaskName class="name" :task size="small" />

      <div class="meta">
        <div v-if="shouldShowInfos || hasSubTasks" class="infos">
          <UiCounter v-if="hasSubTasks" :value="subTasksCount" accent="brand" variant="secondary" size="small" />
          <UiInfo v-if="hasInfos" accent="info" />
          <UiInfo v-if="hasWarnings" accent="warning" />
          <UiInfo v-if="isError" accent="danger" />
        </div>
        <span v-if="task.end" class="time typo-body-regular-small">
          {{ `${t('task:ended')} ${end}` }}
        </span>
      </div>

      <div class="progress">
        <UiCircleProgressBar :accent="progressAccent" size="small" :value="progress" />
      </div>
      <div v-if="showEyeIcon" class="actions">
        <UiButtonIcon icon="fa:eye" size="small" accent="brand" @click="emit('select', task.id)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsTaskName from '@core/components/task/VtsTaskName.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import { useTimeAgo } from '@core/composables/locale-time-ago.composable.ts'
import { logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

export type TaskStatus = 'failure' | 'interrupted' | 'pending' | 'success'

export type TaskObjectSegment = {
  text: string
  to?: RouteLocationRaw
}

export type Task = {
  id: string
  infos?: { data: unknown; message: string }[]
  name?: string
  nameParts?: TaskObjectSegment[]
  to?: LinkOptions['to']
  progress?: number
  tag?: string
  userName?: string
  start?: number
  end?: number
  status: TaskStatus
  subtasks?: Task[]
  warnings?: { data: unknown; message: string }[]
}

const { task, showEyeIcon = false } = defineProps<{
  task: Task
  showEyeIcon?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const { t } = useI18n()

const subTasksCount = computed(() => task.subtasks?.length ?? 0)

const hasSubTasks = computed(() => subTasksCount.value > 0)

const isError = computed(() => task.status === 'failure' || task.status === 'interrupted')

const end = useTimeAgo(() => task.end ?? 0)

const hasWarnings = computed(() => task.warnings && task.warnings.length > 0)

const hasInfos = computed(() => task.infos && task.infos.length > 0)

const shouldShowInfos = logicOr(isError, hasWarnings, hasInfos)

const progressAccent = computed(() => (isError.value ? 'danger' : 'info'))

// TODO remove when progress is available for all tasks
const progress = computed(() => {
  if (task.status === 'pending' && !task.end) {
    return task.progress ? task.progress : 0
  }

  return task.progress ? task.progress : 100
})
</script>

<style lang="postcss" scoped>
.ui-task-item {
  container: ui-task-item / inline-size;
  flex: 1;
  min-width: 0;
  padding-block: 0.8rem;
  padding-inline: 0.4rem;

  .layout {
    display: grid;
    grid-template-areas: 'name infos . time progress actions';
    grid-template-columns: auto auto 1fr auto auto auto;
    align-items: center;
    gap: 1.6rem;
    min-height: 3.2rem;
    color: var(--color-neutral-txt-secondary);
  }

  .name {
    grid-area: name;
    min-width: 0;
    word-break: break-word;
  }

  .meta {
    display: contents;
  }

  .infos {
    grid-area: infos;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .time {
    grid-area: time;
  }

  .progress {
    grid-area: progress;
    display: flex;
    width: 4rem;
  }

  .actions {
    grid-area: actions;
    display: flex;
  }

  .progress:not(:has(+ .actions)) {
    margin-inline-end: 2.4rem;
  }

  @container ui-task-item (max-width: 50rem) {
    .layout {
      grid-template-areas:
        'name progress actions'
        'meta progress actions';
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 0.4rem 0.8rem;
    }

    .meta {
      grid-area: meta;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.8rem;

      &:empty {
        display: none;
      }
    }

    .progress:not(:has(+ .actions)) {
      margin-inline-end: 0;
    }
  }
}
</style>
