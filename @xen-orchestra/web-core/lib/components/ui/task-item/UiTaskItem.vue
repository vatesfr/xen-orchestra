<!-- v11 -->
<template>
  <div class="ui-task-item" :class="{ selected }">
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
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useTimeAgo } from '@core/composables/locale-time-ago.composable.ts'
import type { Task } from '@core/types/task.type.ts'
import { logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: Task
  selected?: boolean
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
  display: flex;
  flex-direction: row;
  flex: 1;
  min-width: 0;
  min-height: 4.8rem;
  gap: 1.6rem;
  padding-block: 0.8rem;
  padding-inline: 0.4rem;
  justify-content: space-between;
  align-items: center;

  &.selected {
    background-color: var(--color-brand-background-selected);
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

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
    padding: 0.8rem;

    .content-right {
      gap: 0.8rem;

      .actions {
        gap: 0.8rem;
      }
    }
  }
}
</style>
