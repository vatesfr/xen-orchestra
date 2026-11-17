<template>
  <UiButtonIcon
    v-tooltip="{ content: t('tasks:my-tasks'), placement: 'bottom-end' }"
    :aria-label="ariaLabel"
    accent="brand"
    :counter
    icon="fa:bars-progress"
    size="medium"
    @click="toggleSidebar()"
  />
</template>

<script lang="ts" setup>
import { useXoTasksUnread } from '@/modules/task/composables/xo-tasks-unread.composable.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useRightSidebarStore } from '@core/packages/sidebar'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const rightSidebar = useRightSidebarStore()

const { unreadCount, unreadSeverity, markAllAsRead } = useXoTasksUnread()

function toggleSidebar() {
  if (rightSidebar.isExpanded) {
    markAllAsRead()
  }

  rightSidebar.toggleExpand()
}

const hasCounter = computed(() => !rightSidebar.isExpanded && unreadCount.value > 0)

const counter = computed(() => {
  if (!hasCounter.value) {
    return undefined
  }

  if (unreadSeverity.value === 'danger') {
    return { value: '×', accent: 'danger' } as const
  }

  if (unreadSeverity.value === 'warning') {
    return { value: '!', accent: 'warning' } as const
  }

  return unreadCount.value
})

const ariaLabel = computed(() => {
  if (!hasCounter.value) {
    return t('tasks:my-tasks')
  }

  if (unreadSeverity.value === 'danger') {
    return t('tasks:my-tasks-n-unread-with-failures', unreadCount.value)
  }

  if (unreadSeverity.value === 'warning') {
    return t('tasks:my-tasks-n-unread-with-warnings', unreadCount.value)
  }

  return t('tasks:my-tasks-n-unread', unreadCount.value)
})
</script>
