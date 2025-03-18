<template>
  <div class="ui-task-item">
    <UiButtonIcon :icon="faChevronRight" size="medium" accent="brand" />
    <div class="content">
      <div class="left-side">
        <slot />
        <UiTag accent="neutral" variant="primary" size="medium">{{ label }}</UiTag>
        <div class="info">
          <UiInfo v-for="info in infos" :key="info.id" :accent="info.accent">
            {{ getTypeMessage(info) }}
          </UiInfo>
        </div>
      </div>
      <div class="right-side">
        <div class="user typo-body-regular-small">
          <span>{{ t('by') }}</span>
          <UiUserLink :username="user" />
          <span> {{ t('task.started-ago', { time: getTimeAgo(start) }) }} </span>
          <span>{{ t('task.estimated-end-in', { time: convertSeconds(estimate) }) }} </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiUserLink from '@core/components/ui/user-link/UiUserLink.vue'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { useI18n } from 'vue-i18n'

const { start, estimate, label, infos, user } = defineProps<{
  start: number
  estimate: number
  user: string
  label: string
  infos: {
    id: number
    accent: InfoAccent
    message: string
    count: number
  }[]
}>()
const { t } = useI18n()
export type InfoAccent = 'info' | 'warning' | 'danger'

const convertSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  return minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, '0')}m`
}

const getTimeAgo = (timestamp: number): string => {
  const secondsElapsed = Math.floor(Date.now() / 1000) - timestamp
  const hours = Math.floor(secondsElapsed / 3600)
  const minutes = Math.floor((secondsElapsed % 3600) / 60)

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? String(minutes).padStart(2, '0') : ''}m`
  }
  return `${minutes}m`
}

const getTypeMessage = (info: { accent: InfoAccent; count: number }) => {
  const typeKey = info.accent === 'info' ? 'information' : info.accent === 'warning' ? 'warning' : 'error'
  return t(typeKey, { n: info.count })
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
  .content {
    width: 100%;
    display: flex;
    justify-content: space-between;
    .left-side {
      display: flex;
      gap: 1.6rem;
      align-items: center;
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
