import type {
  FrontXoTask,
  useXoTaskCollection as realUseXoTaskCollection,
} from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { createMockCollection } from '@/test/find-by-id.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { ref } from 'vue'

// Shared state of the mocked task collection: a test sets the tasks it needs, reset it in `beforeEach`.
// `lastDayTasks` holds the core tasks the task lists display, set apart from `tasks`
export const taskCollectionMock = {
  tasks: ref<FrontXoTask[]>([]),
  lastDayTasks: ref<Task[]>([]),
  areTasksReady: ref(true),
  hasTaskFetchError: ref(false),
  reset() {
    this.tasks.value = []
    this.lastDayTasks.value = []
    this.areTasksReady.value = true
    this.hasTaskFetchError.value = false
  },
}

// Mocked with `mockXoTaskCollection()`
export const useXoTaskCollection = (() => ({
  ...createMockCollection('Task', 'Tasks', taskCollectionMock.tasks, taskCollectionMock.areTasksReady),
  lastDayTasks: taskCollectionMock.lastDayTasks,
  hasTaskFetchError: taskCollectionMock.hasTaskFetchError,
})) as unknown as typeof realUseXoTaskCollection

// Replaces the module in every test of the file: call it at the top level of the test file
export function mockXoTaskCollection() {
  mockModule(
    import('@/modules/task/remote-resources/use-xo-task-collection.ts'),
    () => import('@/test/mock-xo-task-collection.ts')
  )
}
