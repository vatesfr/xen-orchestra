import { reuseUnchangedTasks } from '@/modules/task/utils/reuse-unchanged-tasks.util.ts'
import { createTaskItem } from '@core-test/create-task-item.ts'

// Each call builds new objects, like a new conversion of the same raw tasks
function createTasks() {
  return [
    createTaskItem({
      id: 'root',
      start: 100,
      nameParts: [{ text: 'VM', to: { name: '/vm/[id]/dashboard', params: { id: 'vm' } } }],
      warnings: [{ message: 'warning', data: { size: 1 } }],
      subtasks: [createTaskItem({ id: 'sub-1', start: 110 }), createTaskItem({ id: 'sub-2', start: 120 })],
    }),
    createTaskItem({ id: 'other', start: 200 }),
  ]
}

it('returns the new tasks when there are no previous ones', () => {
  const tasks = createTasks()

  expect(reuseUnchangedTasks(undefined, tasks)).toBe(tasks)
})

it('returns the previous list when no task changed', () => {
  const previousTasks = createTasks()

  expect(reuseUnchangedTasks(previousTasks, createTasks())).toBe(previousTasks)
})

it('reuses the unchanged tasks and keeps the changed ones', () => {
  const previousTasks = createTasks()
  const nextTasks = createTasks()
  nextTasks[1].end = 300

  const tasks = reuseUnchangedTasks(previousTasks, nextTasks)

  expect(tasks).not.toBe(previousTasks)
  expect(tasks[0]).toBe(previousTasks[0])
  expect(tasks[1]).toBe(nextTasks[1])
})

it('reuses the unchanged subtasks of a changed task', () => {
  const previousTasks = createTasks()
  const nextTasks = createTasks()
  nextTasks[0].subtasks![1].end = 300

  const [root] = reuseUnchangedTasks(previousTasks, nextTasks)

  expect(root).not.toBe(previousTasks[0])
  expect(root).toEqual(nextTasks[0])
  expect(root.subtasks![0]).toBe(previousTasks[0].subtasks![0])
  expect(root.subtasks![1]).toBe(nextTasks[0].subtasks![1])
})

it('sees a change in the resolved name of a task', () => {
  const previousTasks = createTasks()
  const nextTasks = createTasks()
  nextTasks[0].nameParts![0].text = 'Renamed VM'

  const [root] = reuseUnchangedTasks(previousTasks, nextTasks)

  expect(root).not.toBe(previousTasks[0])
  expect(root).toEqual(nextTasks[0])
})

it('sees a change in the data of a warning', () => {
  const previousTasks = createTasks()
  const nextTasks = createTasks()
  nextTasks[0].warnings![0].data = { size: 2 }

  const [root] = reuseUnchangedTasks(previousTasks, nextTasks)

  expect(root).not.toBe(previousTasks[0])
  expect(root).toEqual(nextTasks[0])
})

it('sees a subtask being added', () => {
  const previousTasks = createTasks()
  const nextTasks = createTasks()
  nextTasks[1].subtasks = [createTaskItem({ id: 'new-sub' })]

  expect(reuseUnchangedTasks(previousTasks, nextTasks)[1]).toEqual(nextTasks[1])
})

it('reuses the tasks of a list with added, removed or moved tasks', () => {
  const previousTasks = createTasks()
  const [root, other] = createTasks()
  const newTask = createTaskItem({ id: 'new', start: 300 })

  const [addedTask, keptTask] = reuseUnchangedTasks(previousTasks, [newTask, other])

  expect(addedTask).toBe(newTask)
  expect(keptTask).toBe(previousTasks[1])

  const [firstTask, secondTask] = reuseUnchangedTasks(previousTasks, [other, root])

  expect(firstTask).toBe(previousTasks[1])
  expect(secondTask).toBe(previousTasks[0])
})
