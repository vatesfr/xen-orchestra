import MyTasksSidebar from '@/modules/task/components/MyTasksSidebar.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoTaskCollection, taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsTaskList from '@core/components/task/VtsTaskList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useRightSidebarStore } from '@core/packages/sidebar'
import { createTaskItem } from '@core-test/create-task-item.ts'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

mockXoTaskCollection()

const LAST_SEEN_AT = 200

const SLIDE_DURATION = 250

beforeEach(() => {
  taskCollectionMock.reset()
  localStorage.setItem('my-tasks.last-seen-at', String(LAST_SEEN_AT))
  localStorage.setItem('sidebar.right.expanded', 'true')
})

afterEach(() => {
  vi.useRealTimers()
})

function mountSidebar() {
  return mount(MyTasksSidebar, { global: createGlobalTestConfig() })
}

function hasTaskList(wrapper: ReturnType<typeof mountSidebar>) {
  return wrapper.findComponent(VtsTaskList).exists()
}

async function toggleSidebar(value: boolean) {
  useRightSidebarStore().toggleExpand(value)
  await nextTick()
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
  taskCollectionMock.lastDayTasks.value = [createTaskItem({ id: 'new', status: 'success', start: 300, end: 400 })]

  const wrapper = mountSidebar()
  const taskList = wrapper.getComponent(VtsTaskList)
  const item = await openMenu(wrapper)

  expect(item.text()).toBe(t('tasks:mark-all-as-read'))
  expect(taskList.props('unreadTaskIds')).toEqual(new Set(['new']))

  await item.get('.menu-trigger').trigger('click')

  expect(taskList.props('unreadTaskIds')).toEqual(new Set())
})

it('cannot mark all tasks as read when none is unread', async () => {
  const item = await openMenu(mountSidebar())

  expect(item.props('disabled')).toBe(true)
})

describe('task list rendering', () => {
  beforeEach(() => {
    taskCollectionMock.lastDayTasks.value = [createTaskItem({ id: 'task', status: 'success', start: 100, end: 150 })]
  })

  it('does not render the tasks while the sidebar is collapsed', async () => {
    localStorage.setItem('sidebar.right.expanded', 'false')

    const wrapper = mountSidebar()

    expect(hasTaskList(wrapper)).toBe(false)

    await toggleSidebar(true)

    expect(hasTaskList(wrapper)).toBe(true)
  })

  it('keeps rendering the tasks while the sidebar slides out', async () => {
    vi.useFakeTimers()

    const wrapper = mountSidebar()

    await toggleSidebar(false)
    vi.advanceTimersByTime(SLIDE_DURATION - 1)
    await nextTick()

    expect(hasTaskList(wrapper)).toBe(true)

    vi.advanceTimersByTime(1)
    await nextTick()

    expect(hasTaskList(wrapper)).toBe(false)
  })

  it('keeps rendering the tasks when the sidebar expands again while sliding out', async () => {
    vi.useFakeTimers()

    const wrapper = mountSidebar()

    await toggleSidebar(false)
    await toggleSidebar(true)
    vi.advanceTimersByTime(SLIDE_DURATION)
    await nextTick()

    expect(hasTaskList(wrapper)).toBe(true)
  })
})
