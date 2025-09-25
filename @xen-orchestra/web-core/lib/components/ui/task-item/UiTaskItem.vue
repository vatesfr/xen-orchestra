<template>
  <li class="ui-task-item" :data-depth="depth">
    <div class="container">
      <div class="content">
        <div v-for="index in depth - 1" :key="index" class="tree-line">
          <div class="tree-line-vertical" />
        </div>
        <UiButtonIcon
          v-if="hasSubTasks"
          v-tooltip="expanded ? t('core.close') : t('core.open')"
          accent="brand"
          :icon="expanded ? 'fa:angle-down' : 'fa:angle-right'"
          size="small"
          :target-scale="{ x: 1.5, y: 2 }"
          @click="emit('expand')"
        />
        <div v-else class="h-space" />

        <div v-if="task.name" class="typo-body-bold">
          <UiLink :to="`#task-${task.id}`" size="medium">
            {{ task.name }}
          </UiLink>
        </div>

        <UiTag v-if="task?.type" accent="info" variant="secondary">
          {{ task.type }}
        </UiTag>
        <UiInfo v-if="task.status === 'failure' || task.status === 'interrupted'" accent="danger" />
        <UiInfo v-if="task.warning?.length" accent="warning" />
        <UiInfo v-if="task.infos?.length" accent="info" />
        <UiCounter v-if="hasSubTasks" :value="subTasksCount" accent="muted" variant="primary" size="small" />
      </div>
      <div class="content typo-body-regular-small">
        <div v-if="task?.userName" class="user">
          {{ t('by') }}
          <UiAccountMenuButton size="small" />
          {{ task.userName }}
        </div>

        <span v-if="task.start" class="start-time">
          {{ `${t('task.started')} ${started}` }}
        </span>
        <span v-if="task.end" class="end-time">
          {{ `${t('task.estimated-end')} ${end}` }}
        </span>
        <div class="progress">
          <UiCircleProgressBar
            v-if="task.progress"
            :accent="task.status === 'failure' || task.status === 'interrupted' ? 'danger' : 'info'"
            size="small"
            :value="task.progress"
          />
        </div>
        <div class="actions">
          <div class="cancel">
            <UiButtonIcon v-if="task.status === 'pending'" icon="fa:close" size="medium" accent="danger" />
          </div>
          <UiButtonIcon icon="fa:eye" size="medium" accent="brand" />
        </div>
      </div>
    </div>
    <template v-if="hasSubTasks && expanded">
      <UiTaskList :tasks="subTasks" :depth="depth" />
    </template>
  </li>
</template>

<script lang="ts" setup>
import UiAccountMenuButton from '@core/components/ui/account-menu-button/UiAccountMenuButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useTimeAgo } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiButtonIcon from '../button-icon/UiButtonIcon.vue'
import UiCircleProgressBar from '../circle-progress-bar/UiCircleProgressBar.vue'
import UiInfo from '../info/UiInfo.vue'

export type Task = {
  id: string
  infos?: { data: unknown; message: string }[]
  name?: string
  progress?: number
  type?: string
  userName?: string
  start: number
  end?: number
  status: 'failure' | 'interrupted' | 'pending' | 'success'
  tasks?: Task[]
  warning?: { data: unknown; message: string }[]
}

const { task } = defineProps<{
  task: Task
  expanded?: boolean
  depth: number
}>()

const emit = defineEmits<{
  expand: []
}>()

const { t } = useI18n()

const subTasks = computed(() => task.tasks ?? [])
const subTasksCount = computed(() => subTasks.value.length)
const hasSubTasks = computed(() => subTasksCount.value > 0)

const started = useTimeAgo(() => task.start)
const end = useTimeAgo(() => task.end ?? 0)
</script>

<style lang="postcss" scoped>
.ui-task-item {
  &[data-depth='1']:last-child {
    border-bottom: 0.1rem solid var(--color-neutral-border);
  }

  .container {
    display: flex;
    justify-content: space-between;
    height: 4.8rem;

    &::after {
      content: '';
      width: 100%;
      height: 0.1rem;
      background: var(--color-neutral-border);
      position: absolute;
      clip-path: inset(0 0 0 calc(4rem * v-bind(depth - 1)));
    }

    .content {
      display: flex;
      align-items: center;
      gap: 1.6rem;
      padding: 0.4rem 1.6rem;
      color: var(--color-neutral-txt-secondary);
    }

    .tree-line {
      flex: 0 0 1em;
      align-self: stretch;
      display: flex;
      align-items: center;
      justify-content: center;

      .tree-line-vertical {
        width: 0.1rem;
        background: var(--color-brand-txt-base);
        height: calc(100% + 0.8rem);
      }
    }

    .h-space {
      width: 1.8rem;
    }

    .user {
      display: flex;
      align-items: center;
    }

    .user::after {
      content: '•';
      margin-inline-start: 1.6rem;
    }

    .start-time + .end-time::before {
      content: '•';
      margin-inline-end: 1.6rem;
    }

    .progress {
      display: flex;
      width: 4rem;
    }

    .actions {
      display: flex;
      gap: 1.6rem;

      .cancel {
        width: calc(4rem - 1.6rem);
      }
    }
  }
}
</style>
