import MyTasksButton from '@/modules/task/components/MyTasksButton.vue'
import type { useXoTasksUnread } from '@/modules/task/composables/xo-tasks-unread.composable.ts'
import type { TaskSeverity } from '@/modules/task/utils/xo-tasks-unread.util.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import { useRightSidebarStore } from '@core/packages/sidebar'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const { unreadCount, unreadSeverity, pendingCount, pendingProgress, markAllAsRead } = await vi.hoisted(async () => {
  const { ref } = await import('vue')

  return {
    unreadCount: ref(0),
    unreadSeverity: ref<TaskSeverity | undefined>(undefined),
    pendingCount: ref(0),
    pendingProgress: ref<{ value: number; maxValue: number } | undefined>(undefined),
    markAllAsRead: vi.fn(),
  }
})

vi.mock(import('@/modules/task/composables/xo-tasks-unread.composable.ts'), () => ({
  useXoTasksUnread: (() => ({
    unreadCount,
    unreadSeverity,
    pendingCount,
    pendingProgress,
    markAllAsRead,
  })) as unknown as typeof useXoTasksUnread,
}))

beforeEach(() => {
  localStorage.clear()
  unreadCount.value = 0
  unreadSeverity.value = undefined
  pendingCount.value = 0
  pendingProgress.value = undefined
  markAllAsRead.mockReset()
})

function mountButton() {
  const wrapper = mount(MyTasksButton, { global: createGlobalTestConfig() })

  return { wrapper, button: wrapper.getComponent(UiButtonIcon), rightSidebar: useRightSidebarStore() }
}

async function setTasks({
  pending = 0,
  unread = 0,
  severity,
}: {
  pending?: number
  unread?: number
  severity?: TaskSeverity
}) {
  pendingCount.value = pending
  unreadCount.value = unread
  unreadSeverity.value = severity

  await nextTick()
}

it('shows no counter when no task is pending nor unread', () => {
  const { button } = mountButton()

  expect(button.props('counter')).toBeUndefined()
  expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks'))
})

describe('while tasks are pending', () => {
  it('shows the number of pending tasks, not unread ones', async () => {
    const { button } = mountButton()

    await setTasks({ pending: 2, unread: 5 })

    expect(button.props('counter')).toEqual({ value: 2, accent: 'info' })
    expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-in-progress', 2))
  })

  it('uses the danger accent when an unread task failed', async () => {
    const { button } = mountButton()

    await setTasks({ pending: 2, unread: 5, severity: 'danger' })

    expect(button.props('counter')).toEqual({ value: 2, accent: 'danger' })
    expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-in-progress-with-failures', 2))
  })

  it('uses the warning accent when an unread task has warnings', async () => {
    const { button } = mountButton()

    await setTasks({ pending: 2, unread: 5, severity: 'warning' })

    expect(button.props('counter')).toEqual({ value: 2, accent: 'warning' })
    expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-in-progress-with-warnings', 2))
  })

  it('keeps the counter while the sidebar is open', async () => {
    const { button, rightSidebar } = mountButton()

    rightSidebar.toggleExpand(true)
    await setTasks({ pending: 2 })

    expect(button.props('counter')).toEqual({ value: 2, accent: 'info' })
  })
})

describe('once all tasks are done', () => {
  it('shows the number of unread tasks with the success accent', async () => {
    const { button } = mountButton()

    await setTasks({ unread: 4 })

    expect(button.props('counter')).toEqual({ value: 4, accent: 'success' })
    expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-unread', 4))
  })

  it('uses the danger accent when an unread task failed', async () => {
    const { button } = mountButton()

    await setTasks({ unread: 4, severity: 'danger' })

    expect(button.props('counter')).toEqual({ value: 4, accent: 'danger' })
    expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-unread-with-failures', 4))
  })

  it('uses the warning accent when an unread task has warnings', async () => {
    const { button } = mountButton()

    await setTasks({ unread: 4, severity: 'warning' })

    expect(button.props('counter')).toEqual({ value: 4, accent: 'warning' })
    expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-unread-with-warnings', 4))
  })

  it('hides the counter while the sidebar is open', async () => {
    const { button, rightSidebar } = mountButton()

    rightSidebar.toggleExpand(true)
    await setTasks({ unread: 4, severity: 'danger' })

    expect(button.props('counter')).toBeUndefined()
    expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks'))
  })
})

describe('progress ring', () => {
  it('is hidden while no batch of tasks is running', () => {
    const { wrapper } = mountButton()

    expect(wrapper.findComponent(UiCircleProgressBar).exists()).toBe(false)
  })

  it('shows the progress of the running batch', async () => {
    const { wrapper } = mountButton()

    pendingProgress.value = { value: 100, maxValue: 300 }
    await nextTick()

    const progressBar = wrapper.getComponent(UiCircleProgressBar)

    expect(progressBar.props('value')).toBe(100)
    expect(progressBar.props('maxValue')).toBe(300)
  })
})

it('opens the sidebar without marking tasks as read', async () => {
  const { button, rightSidebar } = mountButton()

  rightSidebar.toggleExpand(false)
  await button.trigger('click')

  expect(rightSidebar.isExpanded).toBe(true)
  expect(markAllAsRead).not.toHaveBeenCalled()
})

it('marks every task as read when it closes the sidebar', async () => {
  const { button, rightSidebar } = mountButton()

  rightSidebar.toggleExpand(true)
  await button.trigger('click')

  expect(rightSidebar.isExpanded).toBe(false)
  expect(markAllAsRead).toHaveBeenCalledOnce()
})
