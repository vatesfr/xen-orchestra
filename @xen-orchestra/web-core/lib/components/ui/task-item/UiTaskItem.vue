<!-- v10 -->
<template>
  <li class="ui-task-item" :data-depth="depth" :class="{ selected }">
    <div class="container">
      <div class="tree-section">
        <div class="tree-lines">
          <div v-for="index in depth - 1" :key="index" class="tree-line">
            <div class="tree-line-vertical" />
          </div>
        </div>
        <UiButtonIcon
          v-if="hasSubTasks"
          v-tooltip="expanded ? t('action:close') : t('action:open')"
          accent="brand"
          :icon="expanded ? 'fa:angle-down' : 'fa:angle-right'"
          size="small"
          :target-scale="{ x: 1.5, y: 2 }"
          @click="emit('expand')"
        />
        <div v-else class="h-space" />
      </div>

      <div class="main-content">
        <div v-if="task.name" class="content-left">
          <UiLink size="medium">
            {{ task.name }}
          </UiLink>
          <div v-if="shouldShowInfos || hasSubTasks" class="infos">
            <UiCounter v-if="hasSubTasks" :value="subTasksCount" accent="brand" variant="secondary" size="small" />
            <UiInfo v-if="hasInfos" accent="info" />
            <UiInfo v-if="hasWarnings" accent="warning" />
            <UiInfo v-if="isError" accent="danger" />
          </div>
        </div>

        <div class="content-right typo-body-regular-small">
          <span v-if="task.end">
            {{ `${t('task:ended')} ${end}` }}
          </span>
          <div class="progress">
            <UiCircleProgressBar :accent="progressAccent" size="small" :value="progress" />
          </div>
          <div class="actions">
            <UiButtonIcon icon="fa:eye" size="medium" accent="brand" @click="emit('select', task.id)" />
          </div>
        </div>
      </div>
    </div>
    <template v-if="hasSubTasks && expanded">
      <UiTaskList :tasks="subTasks" :depth :selected-task-id="selectedTaskId" @select="id => emit('select', id)" />
    </template>
  </li>
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'
import { useTimeAgo } from '@core/composables/locale-time-ago.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive'
import { logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type Task = {
  id: string
  infos?: { data: unknown; message: string }[]
  name?: string
  progress?: number
  end?: number
  status: 'failure' | 'interrupted' | 'pending' | 'success'
  subtasks?: Task[]
  warnings?: { data: unknown; message: string }[]
}

const { task } = defineProps<{
  task: Task
  depth: number
  expanded?: boolean
  selected?: boolean
  selectedTaskId?: string
}>()

const emit = defineEmits<{
  expand: []
  select: [id: string]
}>()

const { t } = useI18n()

const subTasks = computed(() => task.subtasks ?? [])

const subTasksCount = computed(() => subTasks.value.length)

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
  &[data-depth='1']:last-child {
    border-bottom: 0.1rem solid var(--color-neutral-border);
  }

  &.selected {
    background-color: var(--color-brand-background-selected);
  }

  .container {
    display: flex;
    min-height: 4.8rem;
    position: relative;

    &::after {
      content: '';
      width: 100%;
      position: absolute;
      clip-path: inset(0 0 0 calc(4rem * v-bind(depth - 1)));
      height: 0.1rem;
      background: var(--color-neutral-border);
    }

    .tree-section {
      --line-container-base-width: 2.8rem;
      --line-width: 0.1rem;
      display: flex;
      align-items: center;
      padding-left: 1.6rem;
      gap: 0.4rem;

      .tree-lines {
        display: flex;
        align-self: stretch;
        min-width: calc(var(--line-container-base-width) * v-bind(depth - 1));
      }

      .tree-line {
        flex: 0 0 calc(var(--line-container-base-width) + var(--line-width));
        display: flex;
        align-items: center;
        justify-content: center;

        .tree-line-vertical {
          width: 0.1rem;
          background: var(--color-brand-txt-base);
          height: 100%;
        }
      }

      .h-space {
        width: 2.4rem;
      }
    }

    .main-content {
      display: flex;
      flex-direction: row;
      flex: 1;
      min-width: 0;
      gap: 1.6rem;
      padding: 0.4rem 1.6rem;
      justify-content: space-between;
      align-items: center;
    }

    .content-left {
      display: flex;
      gap: 1.6rem;
      align-items: center;
      flex-wrap: wrap;
      color: var(--color-neutral-txt-secondary);
      word-break: break-word;

      .infos {
        display: flex;
        align-items: center;
        gap: 0.8rem;
      }
    }

    .content-right {
      display: flex;
      align-items: center;
      gap: 1.6rem;
      color: var(--color-neutral-txt-secondary);
      flex-shrink: 0;

      .progress {
        display: flex;
        width: 4rem;
      }

      .actions {
        display: flex;
        gap: 1.6rem;
      }
    }
  }

  @media (max-width: 768px) {
    .container {
      .main-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.8rem;
        padding: 0.8rem;
      }

      .content-right {
        gap: 0.8rem;

        .actions {
          gap: 0.8rem;
        }
      }
    }
  }
}
</style>
