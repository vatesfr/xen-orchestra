import { useXoTaskNameResolver } from '@/modules/task/composables/xo-task-name-resolver.composable.ts'
import { convertXoTaskToCore } from '@/modules/task/utils/convert-xo-task-to-core.util.ts'
import { findTaskById, getTaskRoute } from '@/modules/task/utils/xo-task.util.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import type { ResourceContext } from '@core/packages/remote-resource/types.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoTask } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { computed, type Ref } from 'vue'

export type FrontXoTask = Pick<XoTask, (typeof taskFields)[number]>

const ONE_DAY = 24 * 60 * 60 * 1000

export const taskFields = [
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
] as const satisfies readonly (keyof XoTask)[]

export function createTaskCollectionState<TArgs extends any[] = []>(
  tasks: Ref<FrontXoTask[]>,
  context: ResourceContext<TArgs>
) {
  const sortedTasks = useSorted(tasks, (task1, task2) => task2.start - task1.start)
  const { resolveTaskName } = useXoTaskNameResolver()

  const lastDayTasks = computed(() => {
    const now = Date.now()

    return sortedTasks.value
      .filter(task => now - task.start < ONE_DAY)
      .map(task =>
        convertXoTaskToCore(task, {
          to: task => getTaskRoute(task.id),
          nameResolver: resolveTaskName,
        })
      )
  })

  const getTaskById = (taskId: FrontXoTask['id']) => {
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
  url: `${BASE_URL}/tasks?fields=${taskFields.join(',')}&ndjson=true`,
  stream: true,
  initWatchCollection: () => useWatchCollection({ resource: 'task', fields: taskFields }),
  initialData: () => [] as FrontXoTask[],
  state: createTaskCollectionState,
})
