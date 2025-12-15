import { createTaskCollectionState, taskFields } from '@/remote-resources/use-xo-task-collection.ts'
import { watchCollectionWrapper } from '@/utils/sse.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoTask } from '@vates/types'

export const useXoHostTasksCollection = defineRemoteResource({
  url: (hostId: string) => `/rest/v0/hosts/${hostId}/tasks?fields=${taskFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'task', fields: taskFields }),
  initialData: () => [] as XoTask[],
  state: createTaskCollectionState,
})
