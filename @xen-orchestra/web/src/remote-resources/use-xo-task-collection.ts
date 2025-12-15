import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { convertTaskToCore } from '@/utils/convert-task-to-core.util.ts'
import { watchCollectionWrapper } from '@/utils/sse.util'
import { findTaskById } from '@/utils/xo-records/task.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoTask } from '@vates/types'
import { computed } from 'vue'

const ONE_DAY = 24 * 60 * 60 * 1000

const taskFields: (keyof XoTask)[] = ['id', 'start', 'end', 'properties', 'infos', 'warnings', 'status', 'progress', 'tasks', 'result'] as const

export const useXoTaskCollection = defineRemoteResource({
  url: `/rest/v0/tasks?fields=${taskFields}`,
  watchCollection: watchCollectionWrapper({ resource: 'task', fields: taskFields }),
  initialData: () => [] as XoTask[],
  state: (tasks, context) => {
    const lastDayTasks = computed(() => {
      const now = Date.now()
      return tasks.value.filter(task => now - task.start < ONE_DAY).map(task => convertTaskToCore(task))
    })

    const sortedTasks = computed(() => {
      return [...tasks.value].sort((a, b) => b.start - a.start)
    })

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
  },
})
