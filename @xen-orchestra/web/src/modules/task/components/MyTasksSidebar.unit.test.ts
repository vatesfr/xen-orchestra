import MyTasksSidebar from '@/modules/task/components/MyTasksSidebar.vue'
import type { useXoTasksUnread } from '@/modules/task/composables/xo-tasks-unread.composable.ts'
import type { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { mount } from '@vue/test-utils'

const { unreadCount, markAllAsRead } = await vi.hoisted(async () => {
  const { ref } = await import('vue')

  return { unreadCount: ref(0), markAllAsRead: vi.fn() }
})

vi.mock(import('@/modules/task/composables/xo-tasks-unread.composable.ts'), async () => {
  const { computed, ref } = await import('vue')

  return {
    useXoTasksUnread: (() => ({
      openedTaskId: computed(() => undefined),
      unreadTaskIds: ref(new Set()),
      unreadCount,
      markAllAsRead,
    })) as unknown as typeof useXoTasksUnread,
  }
})

vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), async () => {
  const { ref } = await import('vue')

  return {
    useXoTaskCollection: (() => ({
      lastDayTasks: ref([]),
      areTasksReady: ref(true),
      hasTaskFetchError: ref(false),
    })) as unknown as typeof useXoTaskCollection,
  }
})

beforeEach(() => {
  unreadCount.value = 0
  markAllAsRead.mockReset()
})

function mountSidebar() {
  return mount(MyTasksSidebar, { global: createGlobalTestConfig() })
}

async function openMenu(wrapper: ReturnType<typeof mountSidebar>) {
  await wrapper.getComponent(UiButtonIcon).trigger('click')

  return wrapper.getComponent(MenuItem)
}

it('shows the link to all tasks next to the title', () => {
  const title = mountSidebar().get('.header .title')

  expect(title.text()).toBe(`${t('tasks:my-tasks')}${t('tasks:see-all')}`)
  expect(title.getComponent(UiLink).attributes('href')).toBe('/tasks')
})

it('offers to mark all tasks as read', async () => {
  unreadCount.value = 2

  const item = await openMenu(mountSidebar())

  expect(item.text()).toBe(t('tasks:mark-all-as-read'))

  await item.get('.menu-trigger').trigger('click')

  expect(markAllAsRead).toHaveBeenCalledOnce()
})

it('cannot mark all tasks as read when none is unread', async () => {
  const item = await openMenu(mountSidebar())

  expect(item.props('disabled')).toBe(true)
})
