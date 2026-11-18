import type {
  FrontXoTask,
  useXoTaskCollection as realUseXoTaskCollection,
} from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { findById } from '@/test/find-by-id.ts'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

// Shared state of the mocked task collection: a test sets the tasks it needs, reset it in `beforeEach`
export const taskCollectionMock = {
  tasks: ref<FrontXoTask[]>([]),
  areTasksReady: ref(true),
  reset() {
    this.tasks.value = []
    this.areTasksReady.value = true
  },
}

function getTaskById(id: FrontXoTask['id'] | undefined) {
  return findById(taskCollectionMock.tasks.value, id)
}

// Use as `mockModule(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => import('@/test/mock-xo-task-collection.ts'))`
export const useXoTaskCollection = (() => ({
  tasks: taskCollectionMock.tasks,
  areTasksReady: taskCollectionMock.areTasksReady,
  getTaskById,
  useGetTaskById: (id: MaybeRefOrGetter<FrontXoTask['id'] | undefined>) => computed(() => getTaskById(toValue(id))),
})) as unknown as typeof realUseXoTaskCollection
