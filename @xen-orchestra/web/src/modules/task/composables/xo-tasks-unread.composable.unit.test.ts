import { useXoTasksUnread } from '@/modules/task/composables/xo-tasks-unread.composable.ts'
import { readLocalStorageJson } from '@/test/local-storage.ts'
import { mockXoTaskCollection, taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { createTaskItem } from '@core-test/create-task-item.ts'
import { type MaybeRefOrGetter, nextTick, ref } from 'vue'

mockXoTaskCollection()

const { lastDayTasks } = taskCollectionMock

const LAST_SEEN_AT = 200

// A pending root started before everything was last marked as read, whose subtask `a` ended after it
function createTree(subtasks: Task[] = []) {
  return createTaskItem({
    id: 'root',
    start: 100,
    subtasks: [createTaskItem({ id: 'a', status: 'success', start: 110, end: 300 }), ...subtasks],
  })
}

function mountUnreadTasks() {
  return mountComposable(() => useXoTasksUnread())
}

// Stands in for the task side panel showing `taskId`
function showInSidePanel(taskId: MaybeRefOrGetter<string | undefined>) {
  return mountComposable(() => {
    useXoTasksUnread().trackOpenedTask(taskId)

    return {}
  })
}

beforeEach(() => {
  taskCollectionMock.reset()
  localStorage.setItem('my-tasks.last-seen-at', String(LAST_SEEN_AT))
})

describe('unreadTaskIds', () => {
  it('contains the tasks with activity since everything was last marked as read, and their parents', () => {
    lastDayTasks.value = [createTree(), createTaskItem({ id: 'old', start: 50, end: 150 })]

    const { wrapper } = mountUnreadTasks()

    expect([...wrapper.vm.unreadTaskIds].sort()).toEqual(['a', 'root'])
  })

  it('keeps the same set when the tasks change without changing the unread ones', async () => {
    lastDayTasks.value = [createTree(), createTaskItem({ id: 'old', start: 50, end: 150 })]

    const { wrapper } = mountUnreadTasks()
    const unreadTaskIds = wrapper.vm.unreadTaskIds

    lastDayTasks.value = [createTree(), createTaskItem({ id: 'old', start: 50, end: 160 })]
    await nextTick()

    expect(wrapper.vm.unreadTaskIds).toBe(unreadTaskIds)
  })

  it('no longer contains a parent once its only unread subtask is opened', () => {
    lastDayTasks.value = [createTree()]

    const { wrapper } = mountUnreadTasks()

    showInSidePanel('a')

    expect(wrapper.vm.unreadTaskIds.size).toBe(0)
  })

  it('contains none of the subtasks of an opened task', () => {
    lastDayTasks.value = [createTree([createTaskItem({ id: 'b', status: 'success', start: 250, end: 280 })])]

    const { wrapper } = mountUnreadTasks()

    showInSidePanel('root')

    expect(wrapper.vm.unreadTaskIds.size).toBe(0)
  })

  it('contains an opened task again when it has newer activity', async () => {
    lastDayTasks.value = [createTree()]

    const shownTaskId = ref<string>()
    const { wrapper } = mountUnreadTasks()

    showInSidePanel(shownTaskId)

    shownTaskId.value = 'root'
    await nextTick()
    shownTaskId.value = undefined
    await nextTick()

    lastDayTasks.value = [createTree([createTaskItem({ id: 'c', status: 'failure', start: 400, end: 500 })])]

    expect([...wrapper.vm.unreadTaskIds].sort()).toEqual(['c', 'root'])
  })
})

describe('markAllAsRead', () => {
  it('clears every unread task until new activity arrives', () => {
    lastDayTasks.value = [createTree()]

    const { wrapper } = mountUnreadTasks()

    wrapper.vm.markAllAsRead()

    expect(wrapper.vm.unreadTaskIds.size).toBe(0)

    lastDayTasks.value = [createTree(), createTaskItem({ id: 'new', start: 600 })]

    expect([...wrapper.vm.unreadTaskIds]).toEqual(['new'])
  })
})

describe('read activity', () => {
  it('forgets the tasks read more than 32h before the activity of the one being opened', async () => {
    const hour = 60 * 60 * 1000

    localStorage.setItem('my-tasks.read-activity-by-id', JSON.stringify({ stale: 68 * hour - 1, kept: 68 * hour }))
    lastDayTasks.value = [createTaskItem({ id: 'opened', status: 'success', start: 90 * hour, end: 100 * hour })]

    showInSidePanel('opened')
    await nextTick()

    expect(readLocalStorageJson('my-tasks.read-activity-by-id')).toEqual({ kept: 68 * hour, opened: 100 * hour })
  })
})

describe('unreadCount', () => {
  it('counts the unread top-level tasks only', () => {
    lastDayTasks.value = [createTree(), createTaskItem({ id: 'new', start: 600 })]

    const { wrapper } = mountUnreadTasks()

    expect(wrapper.vm.unreadCount).toBe(2)
  })
})

describe('unreadSeverity', () => {
  it('is danger when an unread task has a failed subtask', () => {
    lastDayTasks.value = [createTree([createTaskItem({ id: 'b', status: 'failure', start: 120, end: 130 })])]

    const { wrapper } = mountUnreadTasks()

    expect(wrapper.vm.unreadSeverity).toBe('danger')
  })

  it('is danger when an unread task failed and another has warnings', () => {
    lastDayTasks.value = [
      createTaskItem({ id: 'warned', start: 600, warnings: [{ message: 'warning', data: null }] }),
      createTaskItem({ id: 'failed', status: 'failure', start: 600, end: 700 }),
    ]

    const { wrapper } = mountUnreadTasks()

    expect(wrapper.vm.unreadSeverity).toBe('danger')
  })

  it('is warning when an unread task has warnings', () => {
    lastDayTasks.value = [createTaskItem({ id: 'new', start: 600, warnings: [{ message: 'warning', data: null }] })]

    const { wrapper } = mountUnreadTasks()

    expect(wrapper.vm.unreadSeverity).toBe('warning')
  })

  it('is undefined when no unread task has a failure or warnings', () => {
    lastDayTasks.value = [createTree()]

    const { wrapper } = mountUnreadTasks()

    expect(wrapper.vm.unreadSeverity).toBeUndefined()
  })
})

describe('openedTaskId', () => {
  it('follows the task the side panel shows, until it shows none', async () => {
    const shownTaskId = ref<string | undefined>('root')
    const { wrapper } = mountUnreadTasks()

    showInSidePanel(shownTaskId)

    expect(wrapper.vm.openedTaskId).toBe('root')

    shownTaskId.value = undefined
    await nextTick()

    expect(wrapper.vm.openedTaskId).toBeUndefined()
  })

  it('is undefined once the side panel unmounts', () => {
    const { wrapper } = mountUnreadTasks()
    const panel = showInSidePanel('root')

    panel.wrapper.unmount()

    expect(wrapper.vm.openedTaskId).toBeUndefined()
  })
})
