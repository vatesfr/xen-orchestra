import {
  createTaskCollectionState,
  taskFields,
  type FrontXoTask,
} from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { toValue } from 'vue'

export const useXoVmTasksCollection = defineRemoteResource({
  url: (vmId: string) => `${BASE_URL}/vms/${vmId}/tasks?fields=${taskFields.join(',')}`,
  initWatchCollection: () =>
    useWatchCollection<FrontXoTask>({
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
  initialData: () => [] as FrontXoTask[],
  state: createTaskCollectionState,
})
