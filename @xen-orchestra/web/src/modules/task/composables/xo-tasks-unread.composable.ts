import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useRightSidebarStore } from '@core/packages/sidebar'
import { findTask, getTaskLastActivity, getTaskSeverity, getUnreadTaskIds } from '@core/utils/task.util.ts'
import { createSharedComposable, useLocalStorage } from '@vueuse/core'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

export const useXoTasksUnread = createSharedComposable(() => {
  const route = useRoute()
  const rightSidebar = useRightSidebarStore()
  const { lastDayTasks } = useXoTaskCollection()
  const routeTaskId = useRouteQuery('id')

  // Only the first visit uses the client clock; afterwards it is always a task (server) timestamp
  const lastSeenAt = useLocalStorage('my-tasks.last-seen-at', Date.now())

  // Tasks opened since the sidebar was last closed, with their last activity at that time
  const readActivityById = useLocalStorage<Record<string, number>>('my-tasks.read-activity-by-id', {})

  watch(
    () => rightSidebar.isExpanded,
    isExpanded => {
      if (isExpanded) {
        return
      }

      lastSeenAt.value = Math.max(lastSeenAt.value, ...lastDayTasks.value.map(task => getTaskLastActivity(task)))
      readActivityById.value = {}
    }
  )

  const openedTaskId = computed(() => (route.name === '/(site)/tasks' ? routeTaskId.value : undefined))

  const openedTask = computed(() =>
    openedTaskId.value === undefined ? undefined : findTask(lastDayTasks.value, openedTaskId.value)
  )

  const openedTaskLastActivity = computed(() => openedTask.value && getTaskLastActivity(openedTask.value))

  watch(
    [openedTaskId, openedTaskLastActivity],
    ([taskId, lastActivity]) => {
      if (taskId !== undefined && lastActivity !== undefined) {
        readActivityById.value = { ...readActivityById.value, [taskId]: lastActivity }
      }
    },
    { immediate: true }
  )

  const unreadTaskIds = computed(() => getUnreadTaskIds(lastDayTasks.value, lastSeenAt.value, readActivityById.value))

  const unreadTasks = computed(() => lastDayTasks.value.filter(task => unreadTaskIds.value.has(task.id)))

  const unreadCount = computed(() => unreadTasks.value.length)

  const unreadSeverity = computed(() => {
    const severities = unreadTasks.value.map(task => getTaskSeverity(task))

    if (severities.includes('danger')) {
      return 'danger'
    }

    if (severities.includes('warning')) {
      return 'warning'
    }

    return undefined
  })

  return { openedTaskId, unreadTaskIds, unreadCount, unreadSeverity }
})
