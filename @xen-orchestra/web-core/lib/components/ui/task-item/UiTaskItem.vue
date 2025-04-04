<!-- v3 -->
<template>
  <div class="ui-task-item">
    <div class="content">
      <div class="left-side text-ellipsis">
        <div v-tooltip class="text-ellipsis typo-body-regular">
          {{ task.name }}
        </div>
        <UiTag v-if="task.tag" accent="neutral" variant="primary" size="medium">
          {{ task.tag }}
        </UiTag>
        <div class="info">
          <div v-if="task.subtasks" class="subtasks">
            <VtsIcon accent="current" class="icon" :icon="faCircleNotch" />
            <p class="typo-form-info text-ellipsis">
              {{ t('tasks.n-subtasks', { n: subtasks }) }}
            </p>
          </div>
          <!--          <UiInfo v-if="hasResultName" :accent>{{ message }}</UiInfo> -->
        </div>
      </div>
      <div class="right-side">
        <div class="user typo-body-regular-small">
          <div v-if="user">
            <span>{{ t('by') }}</span>
            <UiUserLink :username="user" />
          </div>
          <span> {{ t('task.started-ago', { time: elapsedTime }) }} </span>
          <span v-if="task.progress">{{ t('task.estimated-end-in', { time: remainingTime }) }} </span>
          <div>
            <UiCircleProgressBar accent="info" size="small" :value="90" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
// import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiUserLink from '@core/components/ui/user-link/UiUserLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { Task } from '@core/types/task.type.ts'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useIntervalFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { task, user } = defineProps<{
  task: Task
  user?: string
}>()

const { t } = useI18n()
const now = ref(new Date())

const countSubtasks = (task: Task): number => {
  if (!task.subtasks || task.subtasks.length === 0) {
    return 0
  }
  return task.subtasks.length + task.subtasks.reduce((sum: number, subtask: any) => sum + countSubtasks(subtask), 0)
}

const subtasks = computed(() => countSubtasks(task))

// const hasResultName = computed(() => typeof task.result === 'object' && task.result?.name)

// const resultName = computed(() => (hasResultName.value ? (task.result as { name: string }).name : null))

// const accent = computed(() => {
//   // if (!resultName.value) return 'null'
//   // if (resultName.value.toLowerCase().includes('error')) return 'danger'
//   // if (resultName.value === 'Warning') return 'warning'
//   return 'info'
// })
//
// const messageKey = computed(() => {
//   // if (!resultName.value) return 'null'
//   // if (resultName.value.toLowerCase().includes('error')) return 'error'
//   // if (resultName.value === 'Warning') return 'warning'
//   return 'information'
// })

// const message = computed(() => {
//   return t(messageKey.value, { n: 1 })
// })

useIntervalFn(() => {
  now.value = new Date()
}, 60000)

const elapsedTime = computed(() => {
  if (!task.start) return
  const diff = now.value.getTime() - task.start
  const minutes = Math.floor(diff / 60000) % 60
  const hours = Math.floor(diff / 3600000)

  return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`
})

const remainingTime = computed(() => {
  if (!task.end) return
  const diff = task.end - now.value.getTime()
  if (diff <= 0) return '0m'

  const minutes = Math.floor(diff / 60000) % 60
  const hours = Math.floor(diff / 3600000)

  return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`
})
</script>

<style scoped lang="postcss">
.ui-task-item {
  padding: 0.2rem;
  display: flex;
  height: 4.8rem;
  align-items: center;
  cursor: pointer;

  .content {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding-inline: 0.8rem;

    .left-side {
      display: flex;
      gap: 1.6rem;
      align-items: center;

      .subtasks {
        display: flex;
        gap: 0.8rem;
      }

      .info {
        display: flex;
        gap: 0.8rem;
      }
    }
    .right-side {
      display: flex;

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
          content: ' •';
          margin: 0 0.5rem;
        }

        > span:last-child::after {
          content: '';
        }
      }
    }
  }
}
</style>
