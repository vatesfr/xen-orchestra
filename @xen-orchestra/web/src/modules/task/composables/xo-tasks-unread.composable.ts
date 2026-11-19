import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import {
  getBatchProgress,
  getTaskLastActivity,
  getTaskSeverity,
  getUnreadTaskIds,
  type TaskSeverity,
} from '@/modules/task/utils/xo-tasks-unread.util.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { findTask } from '@core/utils/task.util.ts'
import { createSharedComposable, useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export const useXoTasksUnread = createSharedComposable(() => {
  const route = useRoute()
  const { lastDayTasks } = useXoTaskCollection()
  const routeTaskId = useRouteQuery('id')

  // Only the first visit uses the client clock; afterwards it is always a task (server) timestamp
  const lastSeenAt = useLocalStorage('my-tasks.last-seen-at', Date.now())

  // Tasks opened since the sidebar was last closed, with their last activity at that time
  const readActivityById = useLocalStorage<Record<string, number>>('my-tasks.read-activity-by-id', {})

  function markAllAsRead() {
    lastSeenAt.value = Math.max(lastSeenAt.value, ...lastDayTasks.value.map(task => getTaskLastActivity(task)))
    readActivityById.value = {}
  }

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

  const unreadSeverity = computed((): TaskSeverity | undefined => {
    const severities = unreadTasks.value.map(task => getTaskSeverity(task))

    if (severities.includes('danger')) {
      return 'danger'
    }

    if (severities.includes('warning')) {
      return 'warning'
    }

    return undefined
  })

  const pendingTaskIds = computed(() =>
    lastDayTasks.value.filter(task => task.status === 'pending').map(task => task.id)
  )

  const pendingCount = computed(() => pendingTaskIds.value.length)

  // Tasks running at page load plus the ones started since, kept until none of them is pending anymore
  const batchTaskIds = ref(new Set<string>())

  watch(
    pendingTaskIds,
    taskIds => {
      batchTaskIds.value = taskIds.length === 0 ? new Set() : new Set([...batchTaskIds.value, ...taskIds])
    },
    { immediate: true }
  )

  const pendingProgress = computed(() =>
    batchTaskIds.value.size === 0 ? undefined : getBatchProgress(lastDayTasks.value, batchTaskIds.value)
  )

  return { openedTaskId, unreadTaskIds, unreadCount, unreadSeverity, pendingCount, pendingProgress, markAllAsRead }
})
