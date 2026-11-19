import type {
  FrontXoTask,
  useXoTaskCollection as realUseXoTaskCollection,
} from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { createMockCollection } from '@/test/find-by-id.ts'
import { ref } from 'vue'

// Shared state of the mocked task collection: a test sets the tasks it needs, reset it in `beforeEach`
export const taskCollectionMock = {
  tasks: ref<FrontXoTask[]>([]),
  areTasksReady: ref(true),
  reset() {
    this.tasks.value = []
    this.areTasksReady.value = true
  },
}

// Use as `mockModule(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => import('@/test/mock-xo-task-collection.ts'))`
export const useXoTaskCollection = (() => ({
  ...createMockCollection('Task', 'Tasks', taskCollectionMock.tasks, taskCollectionMock.areTasksReady),
})) as unknown as typeof realUseXoTaskCollection
