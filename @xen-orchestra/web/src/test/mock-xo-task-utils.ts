import type { useXoTaskUtils as realUseXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'

// `monitorTask` waits for a task of the task collection, which would open an SSE subscription: a test sets what it
// answers (a task settling with no result after a reset), reset it in `beforeEach`
export const taskUtilsMock = {
  monitorTask: vi.fn(),
  reset() {
    this.monitorTask.mockReset()
    this.monitorTask.mockResolvedValue(undefined)
  },
}

type MockedPost = {
  mockImplementation(implementation: (url: string) => Promise<{ taskId: string }>): unknown
}

// Makes the mocked `fetchPost` answer each request with the task `task-of-<url>`, the one `monitorTask` then waits for
export function answerPostsWithTask(post: MockedPost) {
  post.mockImplementation(async (url: string) => ({ taskId: `task-of-${url}` }))
}

// Mocked with `mockXoTaskUtils()`
export const useXoTaskUtils = (() => ({
  monitorTask: taskUtilsMock.monitorTask,
})) as unknown as typeof realUseXoTaskUtils

// Replaces the module in every test of the file: call it at the top level of the test file
export function mockXoTaskUtils() {
  mockModule(import('@/shared/composables/xo-task-utils.composable.ts'), () => import('@/test/mock-xo-task-utils.ts'))
}
