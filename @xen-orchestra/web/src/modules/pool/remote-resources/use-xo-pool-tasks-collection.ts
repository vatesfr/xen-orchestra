import { createTaskCollectionState, taskFields } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoTask } from '@vates/types'
import { toValue } from 'vue'

export const useXoPoolTasksCollection = defineRemoteResource({
  url: (poolId: string) => `${BASE_URL}/pools/${poolId}/tasks?fields=${taskFields.join(',')}`,
  watchCollection: watchCollectionWrapper<XoTask>({
    collectionId: 'poolTask',
    resource: 'task',
    fields: taskFields,
    predicate(task, context) {
      if (context === undefined || context.args === undefined || Array.isArray(task)) {
        return true
      }

      const [id] = context.args
      const poolId = toValue(id)

      return task.properties.objectId === poolId || task.properties.params?.id === poolId
    },
  }),
  initialData: () => [] as XoTask[],
  state: createTaskCollectionState,
})
