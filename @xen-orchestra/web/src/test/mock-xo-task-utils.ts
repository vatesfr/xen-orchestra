import type { useXoTaskUtils as realUseXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'

// `monitorTask` waits for a task of the task collection, which would open an SSE subscription: a test sets what it
// answers (a task settling with no result after a reset), reset it in `beforeEach`
export const taskUtilsMock = {
  monitorTask: vi.fn(),
  reset() {
    this.monitorTask.mockReset()
    this.monitorTask.mockResolvedValue(undefined)
  },
}

// Use as `mockModule(import('@/shared/composables/xo-task-utils.composable.ts'), () => import('@/test/mock-xo-task-utils.ts'))`
export const useXoTaskUtils = (() => ({
  monitorTask: taskUtilsMock.monitorTask,
})) as unknown as typeof realUseXoTaskUtils
