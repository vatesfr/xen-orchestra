import MyTasksButton from '@/modules/task/components/MyTasksButton.vue'
import type { TaskSeverity } from '@/modules/task/utils/xo-tasks-unread.util.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoTaskCollection, taskCollectionMock } from '@/test/mock-xo-task-collection.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import { useRightSidebarStore } from '@core/packages/sidebar'
import { createTaskItem } from '@core-test/create-task-item.ts'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

mockXoTaskCollection()

// Tasks started before it are read, tasks started after it are unread
const LAST_SEEN_AT = 200

const SEVERITY_OVERRIDES: Record<TaskSeverity, Partial<Task>> = {
  danger: { status: 'failure' },
  warning: { warnings: [{ message: 'warning', data: null }] },
}

beforeEach(() => {
  taskCollectionMock.reset()
  localStorage.setItem('my-tasks.last-seen-at', String(LAST_SEEN_AT))
})

function mountButton() {
  const wrapper = mount(MyTasksButton, { global: createGlobalTestConfig() })

  return { wrapper, button: wrapper.getComponent(UiButtonIcon), rightSidebar: useRightSidebarStore() }
}

// Read pending tasks, and unread done ones, the first of which has the given severity
async function setTasks({
  pending = 0,
  unread = 0,
  severity,
}: {
  pending?: number
  unread?: number
  severity?: TaskSeverity
}) {
  taskCollectionMock.lastDayTasks.value = [
    ...Array.from({ length: pending }, (_, index) => createTaskItem({ id: `pending-${index}`, start: 100 })),
    ...Array.from({ length: unread }, (_, index) =>
      createTaskItem({
        id: `unread-${index}`,
        status: 'success',
        start: 300,
        end: 400,
        ...(index === 0 && severity !== undefined ? SEVERITY_OVERRIDES[severity] : {}),
      })
    ),
  ]

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
    expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-pending', 2))
  })

  it('uses the danger accent when an unread task failed', async () => {
    const { button } = mountButton()

    await setTasks({ pending: 2, unread: 5, severity: 'danger' })

    expect(button.props('counter')).toEqual({ value: 2, accent: 'danger' })
    expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-pending-with-failures', 2))
  })

  it('uses the warning accent when an unread task has warnings', async () => {
    const { button } = mountButton()

    await setTasks({ pending: 2, unread: 5, severity: 'warning' })

    expect(button.props('counter')).toEqual({ value: 2, accent: 'warning' })
    expect(button.attributes('aria-label')).toBe(t('tasks:my-tasks-n-pending-with-warnings', 2))
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
})

describe('progress ring', () => {
  it('is hidden while no batch of tasks is running', () => {
    const { wrapper } = mountButton()

    expect(wrapper.findComponent(UiCircleProgressBar).exists()).toBe(false)
  })

  it('shows the progress of the running batch', async () => {
    const { wrapper } = mountButton()

    taskCollectionMock.lastDayTasks.value = [20, 30, 50].map((progress, index) =>
      createTaskItem({ id: `pending-${index}`, start: 100, progress })
    )
    await nextTick()

    const progressBar = wrapper.getComponent(UiCircleProgressBar)

    expect(progressBar.props('value')).toBe(100)
    expect(progressBar.props('maxValue')).toBe(300)
  })
})

it('opens the sidebar', async () => {
  const { button, rightSidebar } = mountButton()

  rightSidebar.toggleExpand(false)
  await button.trigger('click')

  expect(rightSidebar.isExpanded).toBe(true)
})

it('closes the sidebar', async () => {
  const { button, rightSidebar } = mountButton()

  rightSidebar.toggleExpand(true)
  await button.trigger('click')

  expect(rightSidebar.isExpanded).toBe(false)
})
