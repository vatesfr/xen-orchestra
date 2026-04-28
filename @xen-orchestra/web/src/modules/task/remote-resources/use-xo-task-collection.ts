import { convertXoTaskToCore } from '@/modules/task/utils/convert-xo-task-to-core.util.ts'
import { findTaskById } from '@/modules/task/utils/xo-task.util.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import type { ResourceContext } from '@core/packages/remote-resource/types.ts'
import type { Task } from '@core/types/task.type'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoTask } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { ref, watch, type Ref } from 'vue'

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
  const lastDayTasks = ref<Task[]>([])

  watch(sortedTasks, tasks => {
    const now = Date.now()

    const tmpLastDayTasks: Task[] = []

    tasks.forEach(task => {
      if (now - task.start < ONE_DAY) {
        tmpLastDayTasks.push(convertXoTaskToCore(task))
      }
    })

    lastDayTasks.value = tmpLastDayTasks
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
  url: `${BASE_URL}/tasks?fields=${taskFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'task', fields: taskFields }),
  initialData: () => [] as FrontXoTask[],
  state: createTaskCollectionState,
})
