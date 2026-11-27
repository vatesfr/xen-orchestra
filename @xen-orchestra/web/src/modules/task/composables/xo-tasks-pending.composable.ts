import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { getBatchProgress } from '@/modules/task/utils/xo-tasks-pending.util.ts'
import { keepIfEqual } from '@/shared/utils/keep-if-equal.util.ts'
import { createSharedComposable } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

export const useXoTasksPending = createSharedComposable(() => {
  const { lastDayTasks } = useXoTaskCollection()

  const pendingTaskIds = computed<string[]>(previousIds =>
    keepIfEqual(
      previousIds,
      lastDayTasks.value.filter(task => task.status === 'pending').map(task => task.id)
    )
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

  const pendingProgress = computed<ReturnType<typeof getBatchProgress> | undefined>(previousProgress =>
    keepIfEqual(
      previousProgress,
      batchTaskIds.value.size === 0 ? undefined : getBatchProgress(lastDayTasks.value, batchTaskIds.value)
    )
  )

  return { pendingCount, pendingProgress }
})
