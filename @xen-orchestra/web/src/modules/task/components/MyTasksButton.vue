<template>
  <div class="my-tasks-button">
    <UiCircleProgressBar
      v-if="pendingProgress !== undefined"
      v-bind="pendingProgress"
      accent="brand"
      size="small"
      no-value
      class="progress"
    />
    <UiButtonIcon
      v-tooltip="{ content: t('tasks:my-tasks'), placement: 'bottom-end' }"
      :aria-label="ariaLabel"
      accent="brand"
      :counter
      icon="fa:bars-progress"
      size="medium"
      @click="rightSidebar.toggleExpand()"
    />
  </div>
</template>

<script lang="ts" setup>
import { useXoTasksPending } from '@/modules/task/composables/xo-tasks-pending.composable.ts'
import { useXoTasksUnread } from '@/modules/task/composables/xo-tasks-unread.composable.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useRightSidebarStore } from '@core/packages/sidebar'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const rightSidebar = useRightSidebarStore()

const { unreadCount, unreadSeverity } = useXoTasksUnread()

const { pendingCount, pendingProgress } = useXoTasksPending()

// Pending tasks are counted until they are all done, then unread tasks are counted
const badge = computed(() => {
  if (pendingCount.value > 0) {
    return {
      count: pendingCount.value,
      defaultAccent: 'info',
      ariaLabels: {
        danger: t('tasks:my-tasks-n-pending-with-failures', pendingCount.value),
        warning: t('tasks:my-tasks-n-pending-with-warnings', pendingCount.value),
        default: t('tasks:my-tasks-n-pending', pendingCount.value),
      },
    } as const
  }

  if (unreadCount.value > 0) {
    return {
      count: unreadCount.value,
      defaultAccent: 'success',
      ariaLabels: {
        danger: t('tasks:my-tasks-n-unread-with-failures', unreadCount.value),
        warning: t('tasks:my-tasks-n-unread-with-warnings', unreadCount.value),
        default: t('tasks:my-tasks-n-unread', unreadCount.value),
      },
    } as const
  }

  return undefined
})

const counter = computed(() => {
  if (badge.value === undefined) {
    return undefined
  }

  return { value: badge.value.count, accent: unreadSeverity.value ?? badge.value.defaultAccent }
})

const ariaLabel = computed(() => {
  if (badge.value === undefined) {
    return t('tasks:my-tasks')
  }

  return badge.value.ariaLabels[unreadSeverity.value ?? 'default']
})
</script>

<style lang="postcss" scoped>
.my-tasks-button {
  position: relative;
  display: inline-flex;

  .progress {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
}
</style>
