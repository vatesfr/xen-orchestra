import type { FrontXoTask, useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { task } = await vi.hoisted(async () => {
  const { ref } = await import('vue')

  return { task: ref<FrontXoTask>() }
})

vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => ({
  useXoTaskCollection: (() => ({ useGetTaskById: () => task })) as unknown as typeof useXoTaskCollection,
}))

beforeEach(() => {
  vi.useRealTimers()
  task.value = undefined
})

const taskId = 'task-1' as FrontXoTask['id']

function createTask(status: FrontXoTask['status'], result?: Record<string, unknown>) {
  return { id: taskId, status, result } as FrontXoTask
}

function monitorTask() {
  return mountComposable(() => useXoTaskUtils()).wrapper.vm.monitorTask(taskId)
}

describe('monitorTask', () => {
  it('resolves with the result of a task which already succeeded', async () => {
    task.value = createTask('success', { value: 42 })

    await expect(monitorTask()).resolves.toEqual({ value: 42 })
  })

  it('rejects with the error of a task which already failed', async () => {
    task.value = createTask('failure', { message: 'plugin test failed' })

    await expect(monitorTask()).rejects.toThrow('plugin test failed')
  })

  it('resolves once a pending task succeeds', async () => {
    task.value = createTask('pending')
    const promise = monitorTask()

    task.value = createTask('success', { value: 42 })

    await expect(promise).resolves.toEqual({ value: 42 })
  })

  it('rejects once a pending task fails', async () => {
    task.value = createTask('pending')
    const promise = monitorTask()

    task.value = createTask('failure', { name: 'TestError', message: 'plugin test failed' })

    await expect(promise).rejects.toMatchObject({ name: 'TestError', message: 'plugin test failed' })
  })

  it('rejects once a pending task is interrupted', async () => {
    task.value = createTask('pending')
    const promise = monitorTask()

    task.value = createTask('interrupted', { message: 'server restarted' })

    await expect(promise).rejects.toThrow('server restarted')
  })

  it('rejects a failed task without error details', async () => {
    task.value = createTask('failure')

    await expect(monitorTask()).rejects.toThrow('Task task-1 failed without error details')
  })

  it('resolves a task received after the monitoring started', async () => {
    const promise = monitorTask()

    task.value = createTask('success', { value: 42 })

    await expect(promise).resolves.toEqual({ value: 42 })
  })

  it('rejects when the task is never received', async () => {
    vi.useFakeTimers()
    const promise = monitorTask()

    vi.advanceTimersByTime(2000)

    await expect(promise).rejects.toThrow('task ID: task-1 never received')
  })

  it('keeps waiting for a received task which lasts more than the timeout', async () => {
    vi.useFakeTimers()
    task.value = createTask('pending')
    const promise = monitorTask()

    vi.advanceTimersByTime(2000)
    task.value = createTask('success', { value: 42 })

    await expect(promise).resolves.toEqual({ value: 42 })
  })
})
