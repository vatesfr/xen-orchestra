import { convertTaskToCore } from '@/modules/task/utils/convert-task-to-core.util.ts'
import { findTaskById } from '@/modules/task/utils/task.util.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import type { ResourceContext } from '@core/packages/remote-resource/types.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoTask } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { computed, type Ref } from 'vue'

const ONE_DAY = 24 * 60 * 60 * 1000

export const taskFields: (keyof XoTask)[] = [
  'id',
  'start',
  'end',
  'properties',
  'infos',
  'warnings',
  'status',
  'progress',
  'tasks',
  'result',
] as const

export function createTaskCollectionState<TArgs extends any[] = []>(
  tasks: Ref<XoTask[]>,
  context: ResourceContext<TArgs>
) {
  const lastDayTasks = computed(() => {
    const now = Date.now()
    return tasks.value.filter(task => now - task.start < ONE_DAY).map(task => convertTaskToCore(task))
  })

  const sortedTasks = useSorted(tasks, (task1, task2) => task2.start - task1.start)

  const getTaskById = (taskId: XoTask['id']) => {
    return findTaskById(sortedTasks.value, taskId)
  }

  return {
    ...useXoCollectionState(tasks, {
      context,
      baseName: 'task',
    }),
    lastDayTasks,
    sortedTasks,
    getTaskById,
  }
}

export const useXoTaskCollection = defineRemoteResource({
  url: `${BASE_URL}/tasks?fields=${taskFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'task', fields: taskFields }),
  initialData: () => [] as XoTask[],
  state: createTaskCollectionState,
})
