<!-- v3 -->
<template>
  <div class="ui-task-item">
    <div v-if="task.name" v-tooltip class="text-ellipsis typo-body-regular">
      {{ task.name }}
    </div>
    <div class="container">
      <div class="content">
        <UiTag v-if="task.tag" accent="neutral" variant="primary" size="medium">
          {{ task.tag }}
        </UiTag>
        <div v-if="task.subtasks" class="subtasks">
          <VtsIcon accent="current" class="icon" :icon="faCircleNotch" />
          <p class="typo-form-info text-ellipsis">
            {{ t('tasks.n-subtasks', { n: subtasks }) }}
          </p>
        </div>
        <UiInfo v-for="(item, index) in messageTypes" :key="index" v-tooltip :accent="item.type as any">
          {{ item.message }}
        </UiInfo>
      </div>
      <div class="content">
        <div class="user typo-body-regular-small">
          <div v-if="user" v-tooltip class="user-name text-ellipsis">
            <span>{{ t('by') }}</span>
            <UiUserLink :username="user" />
          </div>
          <span v-if="taskIsComplete" class="text-ellipsis">
            {{ $t('task.finished') }}
            <VtsRelativeTime v-if="task.end" :date="task.end" />
          </span>
          <span v-else class="text-ellipsis">
            {{ $t('task.started') }}
            <VtsRelativeTime v-if="task.start" :date="task.start" />
          </span>
        </div>
        <div class="progress-circle-bar">
          <UiCircleProgressBar
            v-if="circleProgress"
            :accent="getEffectiveStatus"
            size="small"
            :value="circleProgress"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import UiCircleProgressBar, {
  type CircleProgressBarAccent,
} from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiUserLink from '@core/components/ui/user-link/UiUserLink.vue'
import { useMapper } from '@core/composables/mapper.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { Message, Task, TaskStatus } from '@core/types/task.type.ts'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { task, user } = defineProps<{
  task: Task
  user?: string
}>()

const { t } = useI18n()

const taskIsComplete = computed(() => {
  if (!task.end || !task.start) {
    return
  }

  return task.end >= task.start || task.progress === 100
})

const countSubtasks = (task: Task): number => {
  if (!task.subtasks || task.subtasks.length === 0) {
    return 0
  }

  return task.subtasks.length + task.subtasks.reduce((sum: number, subtask: any) => sum + countSubtasks(subtask), 0)
}

const subtasks = computed(() => countSubtasks(task))

const circleProgress = computed(() => {
  if (['success', 'failure'].includes(task.status)) {
    return 100
  } else {
    return task.progress
  }
})

const getEffectiveStatus = computed<CircleProgressBarAccent>(() => {
  const evaluate = (task: Task) => {
    const subtasks = task.subtasks || []

    if (subtasks.length === 0) {
      return useMapper<TaskStatus, CircleProgressBarAccent>(
        () => task.status,
        {
          pending: 'warning',
          interrupted: 'warning',
          success: 'info',
          failure: 'danger',
        },
        () => 'info'
      ).value
    }

    const subStatuses = subtasks.map(evaluate)
    const allFailure = subStatuses.every(status => status === 'danger')
    const someFailure = subStatuses.some(status => status === 'danger')
    const allSuccess = subStatuses.every(status => status === 'info')

    if (allFailure) {
      return 'danger'
    }
    if (someFailure) {
      return 'warning'
    }
    if (allSuccess) {
      return 'info'
    }

    return 'warning'
  }

  return evaluate(task)
})

const generateMessages = (task: Task) => {
  const results = {
    info: { count: 0, messages: [] as Message[] },
    danger: { count: 0, messages: [] as Message[] },
    warning: { count: 0, messages: [] as Message[] },
  }

  const accumulate = (task: Task) => {
    const infos = task.infos || []
    const errors = task.errors || []
    const warnings = task.warnings || []

    results.info.count += infos.length
    results.info.messages.push(...infos)

    results.danger.count += errors.length
    results.danger.messages.push(...errors)

    results.warning.count += warnings.length
    results.warning.messages.push(...warnings)

    task.subtasks?.forEach(accumulate)
  }

  accumulate(task)

  return [
    ...(results.info.count > 0
      ? [{ type: 'info', message: t('information', { n: results.info.count }), messages: results.info.messages }]
      : []),
    ...(results.danger.count > 0
      ? [{ type: 'danger', message: t('error', { n: results.danger.count }), messages: results.danger.messages }]
      : []),
    ...(results.warning.count > 0
      ? [{ type: 'warning', message: t('warning', { n: results.warning.count }), messages: results.warning.messages }]
      : []),
  ]
}
const messageTypes = computed(() => generateMessages(task))
</script>

<style scoped lang="postcss">
.ui-task-item {
  padding: 0.2rem;
  margin-right: 1.6rem;
  display: flex;
  height: 4.8rem;
  align-items: center;
  cursor: pointer;
  gap: 1.6rem;
  padding-inline: 0.8rem;

  .container {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;

    .content {
      display: flex;
      gap: 1.6rem;
      align-items: center;

      /*keep the same space even iif circleProgress is undefined*/
      .progress-circle-bar {
        height: 40px;
        width: 40px;
      }
      .subtasks {
        display: flex;
        gap: 0.8rem;
        align-items: center;
      }
    }
  }

  .user {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1rem;
    color: var(--color-neutral-txt-secondary);

    > div {
      display: flex;
      gap: 0.4rem;
    }

    > span::before {
      content: '•';
      margin: 0 0.5rem;
    }

    span:first-of-type::before {
      content: '';
    }

    &:has(.user-name) > span::before {
      content: '•';
      margin: 0 0.5rem;
    }
  }

  .user:has(.user-name) > div > span:first-child {
    margin: 0 0.5rem;
  }
}
</style>
