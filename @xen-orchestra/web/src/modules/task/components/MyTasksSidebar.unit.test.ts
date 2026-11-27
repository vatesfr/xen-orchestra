import MyTasksSidebar from '@/modules/task/components/MyTasksSidebar.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoTaskCollection, taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import VtsTaskList from '@core/components/task/VtsTaskList.vue'
import { createTaskItem } from '@core-test/create-task-item.ts'
import { findLink } from '@core-test/find-links.ts'
import { clickMenuItem, openMoreActions } from '@core-test/menu.ts'
import { mount } from '@vue/test-utils'

mockXoTaskCollection()

// Tasks started after it are unread
const LAST_SEEN_AT = 200

beforeEach(() => {
  taskCollectionMock.reset()
  localStorage.setItem('my-tasks.last-seen-at', String(LAST_SEEN_AT))
})

function mountSidebar() {
  return mount(MyTasksSidebar, { global: createGlobalTestConfig() })
}

it('shows the link to all tasks next to the title', () => {
  const title = mountSidebar().get('.header .title')

  expect(title.text()).toBe(`${t('tasks:my-tasks')}${t('tasks:see-all')}`)
  expect(findLink(title)?.href).toBe('/tasks')
})

it('offers to mark all tasks as read', async () => {
  taskCollectionMock.lastDayTasks.value = [createTaskItem({ id: 'new', status: 'success', start: 300, end: 400 })]

  const wrapper = mountSidebar()
  const taskList = wrapper.getComponent(VtsTaskList)
  const [item] = await openMoreActions(wrapper)

  expect(item.text()).toBe(t('tasks:mark-all-as-read'))
  expect(taskList.props('unreadTaskIds')).toEqual(new Set(['new']))

  await clickMenuItem(item)

  expect(taskList.props('unreadTaskIds')).toEqual(new Set())
})

it('cannot mark all tasks as read when none is unread', async () => {
  const [item] = await openMoreActions(mountSidebar())

  expect(item.props('disabled')).toBe(true)
})
