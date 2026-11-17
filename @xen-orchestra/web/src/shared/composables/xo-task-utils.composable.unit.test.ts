import type { FrontXoTask, useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { nextTick, ref } from 'vue'

const { task } = vi.hoisted(() => ({
  task: { value: undefined } as { value: unknown },
}))

// The task collection would open an SSE subscription
vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => ({
  useXoTaskCollection: (() => ({
    useGetTaskById: () => task.value,
  })) as unknown as typeof useXoTaskCollection,
}))

const TASK_ID = 'task-123' as FrontXoTask['id']

const currentTask = ref<FrontXoTask>()

beforeEach(() => {
  currentTask.value = undefined
  task.value = currentTask
})

afterEach(() => {
  vi.useRealTimers()
})

function createTask(status: FrontXoTask['status'], result?: FrontXoTask['result']) {
  return { id: TASK_ID, status, result } as FrontXoTask
}

function monitorTask() {
  const { monitorTask } = useXoTaskUtils()

  return monitorTask<{ readRate: number }>(TASK_ID)
}

it('resolves with the result of a task already over', async () => {
  currentTask.value = createTask('success', { readRate: 42 })

  await expect(monitorTask()).resolves.toEqual({ readRate: 42 })
})

it('resolves with the result once the task succeeds', async () => {
  const promise = monitorTask()

  currentTask.value = createTask('pending')
  await nextTick()

  currentTask.value = createTask('success', { readRate: 42 })

  await expect(promise).resolves.toEqual({ readRate: 42 })
})

it('rejects with the error of a failed task', async () => {
  const promise = monitorTask()

  currentTask.value = createTask('failure', { name: 'TaskError', message: 'Benchmark failed' })

  await expect(promise).rejects.toMatchObject({ name: 'TaskError', message: 'Benchmark failed' })
})

it('rejects a task failed without error details', async () => {
  currentTask.value = createTask('failure')

  await expect(monitorTask()).rejects.toThrow(`Task ${TASK_ID} failed without error details`)
})

it('rejects a task interrupted', async () => {
  currentTask.value = createTask('interrupted', { message: 'Server restarted' })

  await expect(monitorTask()).rejects.toThrow('Server restarted')
})

it('rejects when the task is never received', async () => {
  vi.useFakeTimers()

  const promise = monitorTask()

  vi.advanceTimersByTime(2000)

  await expect(promise).rejects.toThrow(`task ID: ${TASK_ID} never received`)
})

it('keeps waiting for a pending task past the reception delay', async () => {
  vi.useFakeTimers()

  currentTask.value = createTask('pending')

  const onSettled = vi.fn()
  const promise = monitorTask().then(onSettled, onSettled)

  vi.advanceTimersByTime(2000)
  await Promise.resolve()

  expect(onSettled).not.toHaveBeenCalled()

  currentTask.value = createTask('success', { readRate: 42 })
  await promise

  expect(onSettled).toHaveBeenCalledWith({ readRate: 42 })
})
