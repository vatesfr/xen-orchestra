import MyTasksButton from '@/modules/task/components/MyTasksButton.vue'
import type { useXoTasksUnread } from '@/modules/task/composables/xo-tasks-unread.composable.ts'
import type { TaskSeverity } from '@/modules/task/utils/xo-tasks-unread.util.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useRightSidebarStore } from '@core/packages/sidebar'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const { unreadCount, unreadSeverity, markAllAsRead } = await vi.hoisted(async () => {
  const { ref } = await import('vue')

  return {
    unreadCount: ref(0),
    unreadSeverity: ref<TaskSeverity | undefined>(undefined),
    markAllAsRead: vi.fn(),
  }
})

vi.mock(import('@/modules/task/composables/xo-tasks-unread.composable.ts'), () => ({
  useXoTasksUnread: (() => ({ unreadCount, unreadSeverity, markAllAsRead })) as unknown as typeof useXoTasksUnread,
}))

beforeEach(() => {
  localStorage.clear()
  unreadCount.value = 0
  unreadSeverity.value = undefined
  markAllAsRead.mockReset()
})

function mountButton() {
  const wrapper = mount(MyTasksButton, { global: createGlobalTestConfig() })

  return { wrapper, button: wrapper.getComponent(UiButtonIcon), rightSidebar: useRightSidebarStore() }
}

async function setUnread(count: number, severity?: TaskSeverity) {
  unreadCount.value = count
  unreadSeverity.value = severity

  await nextTick()
}

it('shows no counter when no task is unread', () => {
  const { button } = mountButton()

  expect(button.props('counter')).toBeUndefined()
  expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks'))
})

it('shows the number of unread tasks when none failed or has warnings', async () => {
  const { button } = mountButton()

  await setUnread(4)

  expect(button.props('counter')).toBe(4)
  expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-unread', 4))
})

it('shows a danger badge when an unread task failed', async () => {
  const { button } = mountButton()

  await setUnread(4, 'danger')

  expect(button.props('counter')).toEqual({ value: '×', accent: 'danger' })
  expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-unread-with-failures', 4))
})

it('shows a warning badge when an unread task has warnings', async () => {
  const { button } = mountButton()

  await setUnread(4, 'warning')

  expect(button.props('counter')).toEqual({ value: '!', accent: 'warning' })
  expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-unread-with-warnings', 4))
})

it('hides the counter while the sidebar is open', async () => {
  const { button, rightSidebar } = mountButton()

  rightSidebar.toggleExpand(true)
  await setUnread(4, 'danger')

  expect(button.props('counter')).toBeUndefined()
  expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks'))
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
