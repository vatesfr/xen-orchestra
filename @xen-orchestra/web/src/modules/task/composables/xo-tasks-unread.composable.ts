import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useRightSidebarStore } from '@core/packages/sidebar'
import { getTaskLastActivity, getTaskSeverity } from '@core/utils/task.util.ts'
import { useLocalStorage } from '@vueuse/core'
import { computed, watch } from 'vue'

export function useXoTasksUnread() {
  const rightSidebar = useRightSidebarStore()
  const { lastDayTasks } = useXoTaskCollection()

  // Only the first visit uses the client clock; afterwards it is always a task (server) timestamp
  const lastSeenAt = useLocalStorage('my-tasks.last-seen-at', Date.now())

  watch(
    () => rightSidebar.isExpanded,
    () => {
      lastSeenAt.value = Math.max(lastSeenAt.value, ...lastDayTasks.value.map(task => getTaskLastActivity(task)))
    }
  )

  const unreadTasks = computed(() => lastDayTasks.value.filter(task => getTaskLastActivity(task) > lastSeenAt.value))

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

  return { unreadCount, unreadSeverity }
}
