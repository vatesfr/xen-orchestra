import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import {
  getHighestSeverity,
  getTaskLastActivity,
  getTaskSeverity,
  getUnreadTaskIds,
  pruneReadActivity,
} from '@/modules/task/utils/xo-tasks-unread.util.ts'
import { findTask } from '@core/utils/task.util.ts'
import { createSharedComposable, useLocalStorage } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, onScopeDispose, readonly, ref, toValue, watch } from 'vue'

// Longer than the last day window of the tasks, as a margin
const READ_ACTIVITY_RETENTION = 32 * 60 * 60 * 1000

export const useXoTasksUnread = createSharedComposable(() => {
  const { lastDayTasks } = useXoTaskCollection()

  // Only the first visit uses the client clock; afterwards it is always a task (server) timestamp
  const lastSeenAt = useLocalStorage('my-tasks.last-seen-at', Date.now())

  // Tasks opened since everything was last marked as read, with their last activity at that time
  const readActivityById = useLocalStorage<Record<string, number>>('my-tasks.read-activity-by-id', {})

  function markAllAsRead() {
    lastSeenAt.value = Math.max(lastSeenAt.value, ...lastDayTasks.value.map(task => getTaskLastActivity(task)))
    readActivityById.value = {}
  }

  // The task shown by the task side panel, on whichever page
  const openedTaskId = ref<string>()

  // Called by the task side panel with the task it shows, which stays opened until the panel unmounts
  function trackOpenedTask(taskId: MaybeRefOrGetter<string | undefined>) {
    watch(
      () => toValue(taskId),
      id => {
        openedTaskId.value = id
      },
      { immediate: true }
    )

    onScopeDispose(() => {
      openedTaskId.value = undefined
    })
  }

  const openedTask = computed(() =>
    openedTaskId.value === undefined ? undefined : findTask(lastDayTasks.value, openedTaskId.value)
  )

  const openedTaskLastActivity = computed(() => openedTask.value && getTaskLastActivity(openedTask.value))

  watch(
    [openedTaskId, openedTaskLastActivity],
    ([taskId, lastActivity]) => {
      if (taskId !== undefined && lastActivity !== undefined) {
        // Delete the oldest tasks that are no longer relevant, and add the opened task with its last activity
        readActivityById.value = {
          ...pruneReadActivity(readActivityById.value, lastActivity - READ_ACTIVITY_RETENTION),
          [taskId]: lastActivity,
        }
      }
    },
    { immediate: true }
  )

  const unreadTaskIds = computed(() => getUnreadTaskIds(lastDayTasks.value, lastSeenAt.value, readActivityById.value))

  const unreadTasks = computed(() => lastDayTasks.value.filter(task => unreadTaskIds.value.has(task.id)))

  const unreadCount = computed(() => unreadTasks.value.length)

  const unreadSeverity = computed(() => getHighestSeverity(unreadTasks.value.map(task => getTaskSeverity(task))))

  return {
    openedTaskId: readonly(openedTaskId),
    trackOpenedTask,
    unreadTaskIds,
    unreadCount,
    unreadSeverity,
    markAllAsRead,
  }
})
