import type { FrontXoTask, useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { getErrorTaskId, isMonitoredTaskError, useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { nextTick, ref } from 'vue'

const { useGetTaskByIdMock } = vi.hoisted(() => ({
  useGetTaskByIdMock: vi.fn(),
}))

vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => ({
  useXoTaskCollection: (() => ({ useGetTaskById: useGetTaskByIdMock })) as unknown as typeof useXoTaskCollection,
}))

const TASK_ID = 'task-1' as FrontXoTask['id']

function createFailedTask(result: FrontXoTask['result']) {
  return {
    id: TASK_ID,
    start: 0,
    status: 'failure',
    properties: {},
    result,
  } as FrontXoTask
}

// The task reaches the store through the stream, after `monitorTask` has started watching it
async function monitorFailedTask(result: FrontXoTask['result']) {
  const task = ref<FrontXoTask | undefined>(undefined)

  useGetTaskByIdMock.mockReturnValue(task)

  const { wrapper } = mountComposable(() => useXoTaskUtils())

  const monitoring = wrapper.vm.monitorTask(TASK_ID).catch((error: unknown) => error)

  task.value = createFailedTask(result)
  await nextTick()

  return monitoring
}

beforeEach(() => {
  useGetTaskByIdMock.mockReset()
})

describe('monitorTask', () => {
  it('rejects with the task ID and the message when the task fails', async () => {
    const error: unknown = await monitorFailedTask({
      message: 'VM_INCOMPATIBLE_WITH_THIS_HOST(OpaqueRef:host, OpaqueRef:vm)',
      name: 'XapiError',
    })

    expect(isMonitoredTaskError(error)).toBe(true)
    expect(getErrorTaskId(error)).toBe(TASK_ID)
    expect((error as Error).message).toBe('VM_INCOMPATIBLE_WITH_THIS_HOST(OpaqueRef:host, OpaqueRef:vm)')
    expect((error as Error).name).toBe('XapiError')
  })

  it('rejects with a fallback message when the task result is missing', async () => {
    const error: unknown = await monitorFailedTask(undefined)

    expect(getErrorTaskId(error)).toBe(TASK_ID)
    expect((error as Error).message).toBe(`Task ${TASK_ID} failed without error details`)
  })
})
