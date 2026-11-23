import VtsTaskItem from '@core/components/task/VtsTaskItem.vue'
import VtsTaskList from '@core/components/task/VtsTaskList.vue'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { createTaskItem } from '@core-test/create-task-item.ts'
import { mount } from '@vue/test-utils'

// root > child > grandchild, and other > other-child
function createTasks(rootOverrides: Partial<Task> = {}) {
  return [
    createTaskItem({
      id: 'root',
      subtasks: [createTaskItem({ id: 'child', subtasks: [createTaskItem({ id: 'grandchild' })] })],
      ...rootOverrides,
    }),
    createTaskItem({ id: 'other', subtasks: [createTaskItem({ id: 'other-child' })] }),
  ]
}

function mountTaskList(props: { selectedTaskId?: string; autoCollapseCompleted?: boolean; expandAll?: boolean } = {}) {
  return mount(VtsTaskList, { props: { tasks: createTasks(), ...props }, global: createGlobalTestConfig() })
}

type TaskListWrapper = ReturnType<typeof mountTaskList>

// The subtasks of a collapsed task are not rendered
function getShownTaskIds(wrapper: TaskListWrapper) {
  return wrapper.findAllComponents(VtsTaskItem).map(item => item.props('task').id)
}

async function toggleTask(wrapper: TaskListWrapper, id: string) {
  const item = wrapper.findAllComponents(VtsTaskItem).find(candidate => candidate.props('task').id === id)

  if (item === undefined) {
    throw new Error(`Task "${id}" not shown`)
  }

  await item.get('.toggle').trigger('click')
}

it('shows only the top-level tasks by default', () => {
  expect(getShownTaskIds(mountTaskList())).toEqual(['root', 'other'])
})

it('shows the subtasks of a task once expanded', async () => {
  const wrapper = mountTaskList()

  await toggleTask(wrapper, 'root')

  expect(getShownTaskIds(wrapper)).toEqual(['root', 'child', 'other'])
})

describe('expandAll', () => {
  it('expands every task', () => {
    expect(getShownTaskIds(mountTaskList({ expandAll: true }))).toEqual([
      'root',
      'child',
      'grandchild',
      'other',
      'other-child',
    ])
  })

  it('expands the tasks added while on', async () => {
    const wrapper = mountTaskList({ expandAll: true })

    await wrapper.setProps({
      tasks: [...createTasks(), createTaskItem({ id: 'new', subtasks: [createTaskItem({ id: 'new-child' })] })],
    })

    expect(getShownTaskIds(wrapper)).toContain('new-child')
  })

  it('collapses back the tasks it expanded when turned off', async () => {
    const wrapper = mountTaskList({ expandAll: true })

    await wrapper.setProps({ expandAll: false })

    expect(getShownTaskIds(wrapper)).toEqual(['root', 'other'])
  })

  it('keeps the tasks expanded before it was turned on', async () => {
    const wrapper = mountTaskList()

    await toggleTask(wrapper, 'root')
    await wrapper.setProps({ expandAll: true })
    await wrapper.setProps({ expandAll: false })

    expect(getShownTaskIds(wrapper)).toEqual(['root', 'child', 'other'])
  })

  it('expands back a task collapsed while on once turned off', async () => {
    const wrapper = mountTaskList()

    await toggleTask(wrapper, 'root')
    await wrapper.setProps({ expandAll: true })
    await toggleTask(wrapper, 'root')

    expect(getShownTaskIds(wrapper)).toEqual(['root', 'other', 'other-child'])

    await wrapper.setProps({ expandAll: false })

    expect(getShownTaskIds(wrapper)).toEqual(['root', 'child', 'other'])
  })

  it('expands every task again each time it is turned on', async () => {
    const wrapper = mountTaskList({ expandAll: true })

    await toggleTask(wrapper, 'root')
    await wrapper.setProps({ expandAll: false })
    await wrapper.setProps({ expandAll: true })

    expect(getShownTaskIds(wrapper)).toEqual(['root', 'child', 'grandchild', 'other', 'other-child'])
  })
})

describe('selectedTaskId', () => {
  it('expands the parents of the selected task', () => {
    expect(getShownTaskIds(mountTaskList({ selectedTaskId: 'grandchild' }))).toEqual([
      'root',
      'child',
      'grandchild',
      'other',
    ])
  })

  it('expands a parent collapsed by the user again when another of its subtasks is selected', async () => {
    const wrapper = mountTaskList({ selectedTaskId: 'grandchild' })

    await toggleTask(wrapper, 'root')
    await wrapper.setProps({ selectedTaskId: 'child' })

    expect(getShownTaskIds(wrapper)).toEqual(['root', 'child', 'other'])
  })

  it('keeps the parents of a task selected while expandAll is on expanded once it turns off', async () => {
    const wrapper = mountTaskList({ expandAll: true })

    await wrapper.setProps({ selectedTaskId: 'grandchild' })
    await wrapper.setProps({ expandAll: false })

    expect(getShownTaskIds(wrapper)).toEqual(['root', 'child', 'grandchild', 'other'])
  })

  it('expands a parent collapsed while expandAll is on again when one of its subtasks is selected', async () => {
    const wrapper = mountTaskList({ expandAll: true })

    await toggleTask(wrapper, 'root')
    await wrapper.setProps({ selectedTaskId: 'child' })

    expect(getShownTaskIds(wrapper)).toContain('child')
  })
})

describe('autoCollapseCompleted', () => {
  it('collapses a task when it completes', async () => {
    const wrapper = mountTaskList({ autoCollapseCompleted: true })

    await toggleTask(wrapper, 'root')
    await wrapper.setProps({ tasks: createTasks({ status: 'success', end: 100 }) })

    expect(getShownTaskIds(wrapper)).toEqual(['root', 'other'])
  })

  it('collapses a completed task only once, so it stays expanded when expanded again', async () => {
    const wrapper = mountTaskList({ autoCollapseCompleted: true })

    await wrapper.setProps({ tasks: createTasks({ status: 'success', end: 100 }) })
    await toggleTask(wrapper, 'root')
    await wrapper.setProps({ tasks: createTasks({ status: 'success', end: 100 }) })

    expect(getShownTaskIds(wrapper)).toEqual(['root', 'child', 'other'])
  })

  it('collapses nothing while off', async () => {
    const wrapper = mountTaskList()

    await toggleTask(wrapper, 'root')
    await wrapper.setProps({ tasks: createTasks({ status: 'success', end: 100 }) })

    expect(getShownTaskIds(wrapper)).toEqual(['root', 'child', 'other'])
  })
})
