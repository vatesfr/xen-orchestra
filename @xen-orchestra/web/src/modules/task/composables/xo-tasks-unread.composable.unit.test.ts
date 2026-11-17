import { useXoTasksUnread } from '@/modules/task/composables/xo-tasks-unread.composable.ts'
import type { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { createTaskItem } from '@/test/create-task-item.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'

const { lastDayTasks } = await vi.hoisted(async () => {
  const { ref } = await import('vue')

  return { lastDayTasks: ref<Task[]>([]) }
})

vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => ({
  useXoTaskCollection: (() => ({ lastDayTasks })) as unknown as typeof useXoTaskCollection,
}))

const LAST_SEEN_AT = 200

// A pending root started before the last sidebar close, whose subtask `a` ended after it
function createTree(subtasks: Task[] = []) {
  return createTaskItem({
    id: 'root',
    start: 100,
    subtasks: [createTaskItem({ id: 'a', status: 'success', start: 110, end: 300 }), ...subtasks],
  })
}

async function mountUnreadTasks(openedTaskId?: string) {
  const router = createTestRouter()

  await router.push(openedTaskId === undefined ? '/' : { name: '/(site)/tasks', query: { id: openedTaskId } })

  return mountComposable(() => useXoTasksUnread(), { router })
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('my-tasks.last-seen-at', String(LAST_SEEN_AT))
  lastDayTasks.value = []
})

describe('unreadTaskIds', () => {
  it('contains the tasks with activity after the last sidebar close, and their parents', async () => {
    lastDayTasks.value = [createTree(), createTaskItem({ id: 'old', start: 50, end: 150 })]

    const { wrapper } = await mountUnreadTasks()

    expect([...wrapper.vm.unreadTaskIds].sort()).toEqual(['a', 'root'])
  })

  it('no longer contains a parent once its only unread subtask is opened', async () => {
    lastDayTasks.value = [createTree()]

    const { wrapper } = await mountUnreadTasks('a')

    expect(wrapper.vm.unreadTaskIds.size).toBe(0)
  })

  it('contains none of the subtasks of an opened task', async () => {
    lastDayTasks.value = [createTree([createTaskItem({ id: 'b', status: 'success', start: 250, end: 280 })])]

    const { wrapper } = await mountUnreadTasks('root')

    expect(wrapper.vm.unreadTaskIds.size).toBe(0)
  })

  it('contains an opened task again when it has newer activity', async () => {
    lastDayTasks.value = [createTree()]

    const { wrapper } = await mountUnreadTasks()

    await wrapper.vm.$router.push({ name: '/(site)/tasks', query: { id: 'root' } })
    await wrapper.vm.$router.push('/')

    lastDayTasks.value = [createTree([createTaskItem({ id: 'c', status: 'failure', start: 400, end: 500 })])]

    expect([...wrapper.vm.unreadTaskIds].sort()).toEqual(['c', 'root'])
  })
})

describe('markAllAsRead', () => {
  it('clears every unread task until new activity arrives', async () => {
    lastDayTasks.value = [createTree()]

    const { wrapper } = await mountUnreadTasks()

    wrapper.vm.markAllAsRead()

    expect(wrapper.vm.unreadTaskIds.size).toBe(0)

    lastDayTasks.value = [createTree(), createTaskItem({ id: 'new', start: 600 })]

    expect([...wrapper.vm.unreadTaskIds]).toEqual(['new'])
  })
})

describe('unreadCount', () => {
  it('counts the unread top-level tasks only', async () => {
    lastDayTasks.value = [createTree(), createTaskItem({ id: 'new', start: 600 })]

    const { wrapper } = await mountUnreadTasks()

    expect(wrapper.vm.unreadCount).toBe(2)
  })
})

describe('unreadSeverity', () => {
  it('is danger when an unread task has a failed subtask', async () => {
    lastDayTasks.value = [createTree([createTaskItem({ id: 'b', status: 'failure', start: 120, end: 130 })])]

    const { wrapper } = await mountUnreadTasks()

    expect(wrapper.vm.unreadSeverity).toBe('danger')
  })

  it('is warning when an unread task has warnings', async () => {
    lastDayTasks.value = [createTaskItem({ id: 'new', start: 600, warnings: [{ message: 'warning', data: null }] })]

    const { wrapper } = await mountUnreadTasks()

    expect(wrapper.vm.unreadSeverity).toBe('warning')
  })

  it('is undefined when no unread task has a failure or warnings', async () => {
    lastDayTasks.value = [createTree()]

    const { wrapper } = await mountUnreadTasks()

    expect(wrapper.vm.unreadSeverity).toBeUndefined()
  })
})

describe('openedTaskId', () => {
  it('is the task id from the tasks page URL', async () => {
    const { wrapper } = await mountUnreadTasks('root')

    expect(wrapper.vm.openedTaskId).toBe('root')
  })

  it('is undefined outside the tasks page', async () => {
    const { wrapper } = await mountUnreadTasks()

    expect(wrapper.vm.openedTaskId).toBeUndefined()
  })
})
