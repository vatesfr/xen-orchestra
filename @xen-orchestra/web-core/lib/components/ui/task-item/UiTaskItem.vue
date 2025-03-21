<template>
  <div class="ui-task-item" :class="{ selected: selectedTaskId === task.id }" @click="selectedTaskId = task.id">
    <UiButtonIcon :icon="faChevronRight" size="medium" accent="brand" />
    <div class="content">
      <div class="left-side text-ellipsis">
        <div v-tooltip class="text-ellipsis typo-body-regular">
          {{ task.properties.name }}
        </div>
        <UiTag accent="neutral" variant="primary" size="medium">{{ task.properties.name }}</UiTag>
        <div class="info">
          <div class="subtasks">
            <VtsIcon accent="current" class="icon" :icon="faCircleNotch" />
            <p class="typo-form-info text-ellipsis">
              {{ t('tasks.n-subtasks', { n: 4 }) }}
            </p>
          </div>
          <UiInfo v-if="hasResultName" :accent>{{ message }}</UiInfo>
        </div>
      </div>
      <div class="right-side">
        <div class="user typo-body-regular-small">
          <span>{{ t('by') }}</span>
          <UiUserLink :username="getUser()" />
          <span> {{ t('task.started-ago', { time: elapsedTime }) }} </span>
          <span>{{ t('task.estimated-end-in', { time: remainingTime }) }} </span>
          <VtsIcon accent="current" class="icon" :icon="faCircleNotch" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiUserLink from '@core/components/ui/user-link/UiUserLink.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faChevronRight, faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useIntervalFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: TaskItem
}>()

type TaskProperties = {
  name: string
  objectId: string
  userId: string
}

type Result = { message: string; name: string; stack: string } | string

type TaskItem = {
  id: string
  properties: TaskProperties
  start: number
  status: string
  updatedAt: number
  end: number
  result: Result
}

const { t } = useI18n()
const now = ref(new Date())
const selectedTaskId = useRouteQuery('id')

const hasResultName = computed(() => typeof task.result === 'object' && task.result?.name)

const resultName = computed(() => (hasResultName.value ? (task.result as { name: string }).name : null))

const accent = computed(() => {
  if (resultName.value === 'Error') return 'danger'
  if (resultName.value === 'Warning') return 'warning'
  return 'info'
})

const messageKey = computed(() => {
  if (resultName.value === 'Error') return 'error'
  if (resultName.value === 'Warning') return 'warning'
  return 'information'
})

const message = computed(() => {
  return t(messageKey.value, { n: 2 })
})

useIntervalFn(() => {
  now.value = new Date()
}, 60000)

const elapsedTime = computed(() => {
  const diff = now.value.getTime() - task.start
  const minutes = Math.floor(diff / 60000) % 60
  const hours = Math.floor(diff / 3600000)

  return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`
})

const remainingTime = computed(() => {
  const diff = task.end - now.value.getTime()
  if (diff <= 0) return '0m'

  const minutes = Math.floor(diff / 60000) % 60
  const hours = Math.floor(diff / 3600000)

  return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`
})

// Todo: Get the username by it's ID
const getUser = () => {
  return 'Sébastian'
}
</script>

<style scoped lang="postcss">
.ui-task-item {
  margin: 16px;
  border-top: 1px solid var(--color-neutral-border);
  border-bottom: 1px solid var(--color-neutral-border);
  padding: 0.2rem;
  display: flex;
  height: 4.8rem;
  align-items: center;
  cursor: pointer;

  &:hover {
    background-color: var(--color-brand-background-hover);
  }
  &:active {
    background-color: var(--color-brand-background-active);
  }
  &.selected {
    background-color: var(--color-brand-background-selected);
  }
  &.disabled {
    cursor: not-allowed;
    background-color: var(--color-neutral-background-disabled);
  }
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
        font-size: 1rem;
        color: var(--color-neutral-txt-secondary);
        display: flex;
        gap: 0.4rem;
        align-items: center;
      }
    }
  }
}
</style>
