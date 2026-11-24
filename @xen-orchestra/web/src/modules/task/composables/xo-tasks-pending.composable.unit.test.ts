import { useXoTasksPending } from '@/modules/task/composables/xo-tasks-pending.composable.ts'
import { mockXoTaskCollection, taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { createTaskItem } from '@core-test/create-task-item.ts'
import { nextTick } from 'vue'

mockXoTaskCollection()

const { lastDayTasks } = taskCollectionMock

function mountPendingTasks() {
  return mountComposable(() => useXoTasksPending())
}

beforeEach(() => {
  taskCollectionMock.reset()
})

describe('pendingCount', () => {
  it('counts the pending top-level tasks only', () => {
    lastDayTasks.value = [
      createTaskItem({
        id: 'root',
        status: 'pending',
        start: 100,
        subtasks: [createTaskItem({ id: 'sub', status: 'pending', start: 250 })],
      }),
      createTaskItem({ id: 'new', status: 'pending', start: 600 }),
      createTaskItem({ id: 'done', status: 'success', start: 600, end: 700 }),
    ]

    const { wrapper } = mountPendingTasks()

    expect(wrapper.vm.pendingCount).toBe(2)
  })
})

describe('pendingProgress', () => {
  it('follows the tasks running at load, not the ones finished before', () => {
    lastDayTasks.value = [
      createTaskItem({ id: 'running', status: 'pending', start: 300, progress: 40 }),
      createTaskItem({ id: 'done', status: 'success', start: 100, end: 200 }),
    ]

    const { wrapper } = mountPendingTasks()

    expect(wrapper.vm.pendingProgress).toEqual({ value: 40, maxValue: 100 })
  })

  it('adds newly started tasks and keeps the finished ones at 100', async () => {
    lastDayTasks.value = [createTaskItem({ id: 'first', status: 'pending', start: 300 })]

    const { wrapper } = mountPendingTasks()

    lastDayTasks.value = [
      createTaskItem({ id: 'first', status: 'success', start: 300, end: 400 }),
      createTaskItem({ id: 'second', status: 'pending', start: 350 }),
    ]
    await nextTick()

    expect(wrapper.vm.pendingProgress).toEqual({ value: 100, maxValue: 200 })
  })

  it('is cleared once every task of the batch is done, and the next batch starts fresh', async () => {
    lastDayTasks.value = [createTaskItem({ id: 'first', status: 'pending', start: 300 })]

    const { wrapper } = mountPendingTasks()

    lastDayTasks.value = [createTaskItem({ id: 'first', status: 'success', start: 300, end: 400 })]
    await nextTick()

    expect(wrapper.vm.pendingProgress).toBeUndefined()

    lastDayTasks.value = [...lastDayTasks.value, createTaskItem({ id: 'next', status: 'pending', start: 500 })]
    await nextTick()

    expect(wrapper.vm.pendingProgress).toEqual({ value: 0, maxValue: 100 })
  })
})
