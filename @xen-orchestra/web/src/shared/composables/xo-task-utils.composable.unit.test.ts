import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { createTask } from '@/test/create-task.ts'
import { taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { nextTick } from 'vue'

// The task collection would open an SSE subscription
mockModule(
  import('@/modules/task/remote-resources/use-xo-task-collection.ts'),
  () => import('@/test/mock-xo-task-collection.ts')
)

const TASK_ID = 'task-123' as FrontXoTask['id']

beforeEach(() => {
  taskCollectionMock.reset()
})

afterEach(() => {
  vi.useRealTimers()
})

function setTask(status: FrontXoTask['status'], result?: FrontXoTask['result']) {
  taskCollectionMock.tasks.value = [createTask({ id: TASK_ID, status, result })]
}

function monitorTask() {
  const { monitorTask } = useXoTaskUtils()

  return monitorTask<{ readRate: number }>(TASK_ID)
}

it('resolves with the result of a task already over', async () => {
  setTask('success', { readRate: 42 })

  await expect(monitorTask()).resolves.toEqual({ readRate: 42 })
})

it('resolves with the result once the task succeeds', async () => {
  const promise = monitorTask()

  setTask('pending')
  await nextTick()

  setTask('success', { readRate: 42 })

  await expect(promise).resolves.toEqual({ readRate: 42 })
})

it('rejects with the error of a failed task', async () => {
  const promise = monitorTask()

  setTask('failure', { name: 'TaskError', message: 'Benchmark failed' })

  await expect(promise).rejects.toMatchObject({ name: 'TaskError', message: 'Benchmark failed' })
})

it('rejects a task failed without error details', async () => {
  setTask('failure')

  await expect(monitorTask()).rejects.toThrow(`Task ${TASK_ID} failed without error details`)
})

it('rejects a task interrupted', async () => {
  setTask('interrupted', { message: 'Server restarted' })

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

  setTask('pending')

  const onSettled = vi.fn()
  const promise = monitorTask().then(onSettled, onSettled)

  vi.advanceTimersByTime(2000)
  await Promise.resolve()

  expect(onSettled).not.toHaveBeenCalled()

  setTask('success', { readRate: 42 })
  await promise

  expect(onSettled).toHaveBeenCalledWith({ readRate: 42 })
})
