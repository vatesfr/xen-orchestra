import { createTaskCollectionState, taskFields } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoTask } from '@vates/types'
import { toValue } from 'vue'

export const useXoHostTasksCollection = defineRemoteResource({
  url: (hostId: string) => `/rest/v0/hosts/${hostId}/tasks?fields=${taskFields.join(',')}`,
  watchCollection: watchCollectionWrapper<XoTask>({
    collectionId: 'hostTask',
    resource: 'task',
    fields: taskFields,
    predicate(task, context) {
      if (context === undefined || context.args === undefined || Array.isArray(task)) {
        return true
      }

      const [id] = context.args
      const hostId = toValue(id)

      return task.properties.objectId === hostId || task.properties.params?.id === hostId
    },
  }),
  initialData: () => [] as XoTask[],
  state: createTaskCollectionState,
})
