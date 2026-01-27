import { createTaskCollectionState, taskFields } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoTask } from '@vates/types'
import { toValue } from 'vue'

export const useXoVmTasksCollection = defineRemoteResource({
  url: (vmId: string) => `${BASE_URL}/vms/${vmId}/tasks?fields=${taskFields.join(',')}`,
  watchCollection: watchCollectionWrapper<XoTask>({
    collectionId: 'vmTask',
    resource: 'task',
    fields: taskFields,
    predicate(task, context) {
      if (context === undefined || context.args === undefined || Array.isArray(task)) {
        return true
      }

      const [id] = context.args
      const vmId = toValue(id)

      return task.properties.objectId === vmId || task.properties.params?.id === vmId
    },
  }),
  initialData: () => [] as XoTask[],
  state: createTaskCollectionState,
})
