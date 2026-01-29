import {
  createTaskCollectionState,
  taskFields,
  type FrontXoTask,
} from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { toValue } from 'vue'

export const useXoHostTasksCollection = defineRemoteResource({
  url: (hostId: string) => `${BASE_URL}/hosts/${hostId}/tasks?fields=${taskFields.join(',')}`,
  initWatchCollection: () =>
    useWatchCollection<FrontXoTask>({
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
  initialData: () => [] as FrontXoTask[],
  state: createTaskCollectionState,
})
