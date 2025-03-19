<template>
  <div class="ui-task-item">
    <UiButtonIcon :icon="faChevronRight" size="medium" accent="brand" />
    <div class="content">
      <div class="left-side text-ellipsis">
        <div v-tooltip class="text-ellipsis">
          <slot />
        </div>
        <UiTag accent="neutral" variant="primary" size="medium">{{ label }}</UiTag>
        <div class="info">
          <div v-if="!subtask" class="subtasks">
            <VtsIcon accent="current" class="icon" :icon="faCircleNotch" />
            <p class="typo-form-info text-ellipsis">
              {{ t('tasks.n-subtasks', { n: 4 }) }}
            </p>
          </div>
          <UiInfo v-for="info in infos" :key="info.id" :accent="info.accent">
            {{ getTypeMessage(info) }}
          </UiInfo>
        </div>
      </div>
      <div class="right-side">
        <div class="user typo-body-regular-small">
          <span>{{ t('by') }}</span>
          <UiUserLink :username="user" />
          <span> {{ t('task.started-ago', { time: timeAgo }) }} </span>
          <span>{{ t('task.estimated-end-in', { time: convertSeconds(estimate) }) }} </span>
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
import { vTooltip } from '@core/directives/tooltip.directive'
import { faChevronRight, faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { start, estimate, label, infos, user } = defineProps<{
  start: number
  estimate: number
  user: string
  label: string
  subtask?: object
  infos: {
    id: number
    accent: InfoAccent
    message: string
    count: number
  }[]
}>()
const { t } = useI18n()
export type InfoAccent = 'info' | 'warning' | 'danger'
const currentTimestamp = ref(Math.floor(Date.now() / 1000))

const getTypeMessage = (info: { accent: InfoAccent; count: number }) => {
  const typeKey = info.accent === 'info' ? 'information' : info.accent === 'warning' ? 'warning' : 'error'
  return t(typeKey, { n: info.count })
}

const convertSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  return minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, '0')}m`
}

const getTimeAgo = (timestamp: number): string => {
  const secondsElapsed = currentTimestamp.value - timestamp
  const hours = Math.floor(secondsElapsed / 3600)
  const minutes = Math.floor((secondsElapsed % 3600) / 60)

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? String(minutes).padStart(2, '0') : ''}m`
  }
  return `${minutes}m`
}

const timeAgo = computed(() => getTimeAgo(start))

let interval: number | undefined

onMounted(() => {
  interval = setInterval(() => {
    currentTimestamp.value = Math.floor(Date.now() / 1000)
  }, 60000)
})

onUnmounted(() => {
  clearInterval(interval)
})
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
