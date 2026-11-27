import { filterTasksByName, filterTaskTree, findTask, getTaskLabel, hasSubtask } from '@core/utils/task.util.ts'
import { createTaskItem } from '@core-test/create-task-item.ts'

const grandchild = createTaskItem({ id: 'grandchild', name: 'Transfer' })
const child = createTaskItem({ id: 'child', name: 'Export', subtasks: [grandchild] })
const sibling = createTaskItem({ id: 'sibling', name: 'Snapshot' })
const root = createTaskItem({ id: 'root', name: 'Backup job', subtasks: [child, sibling] })
const other = createTaskItem({ id: 'other', name: 'Migration' })
const tasks = [root, other]

const namePartsTask = createTaskItem({
  id: 'name-parts',
  name: 'vm.migrate',
  nameParts: [{ text: 'Migrate ' }, { text: 'VM 1', to: '/vm/1' }],
})

describe('hasSubtask', () => {
  it('is true for a direct subtask', () => {
    expect(hasSubtask(root, 'child')).toBe(true)
  })

  it('is true for a nested subtask', () => {
    expect(hasSubtask(root, 'grandchild')).toBe(true)
  })

  it('is false for the task itself', () => {
    expect(hasSubtask(root, 'root')).toBe(false)
  })

  it('is false for a task outside its subtree', () => {
    expect(hasSubtask(root, 'other')).toBe(false)
  })
})

describe('findTask', () => {
  it('finds a top-level task', () => {
    expect(findTask(tasks, 'other')).toBe(other)
  })

  it('finds a nested subtask', () => {
    expect(findTask(tasks, 'grandchild')).toBe(grandchild)
  })

  it('is undefined for an unknown id', () => {
    expect(findTask(tasks, 'unknown')).toBeUndefined()
  })
})

describe('getTaskLabel', () => {
  it('joins the texts of the name parts', () => {
    expect(getTaskLabel(namePartsTask)).toBe('Migrate VM 1')
  })

  it('falls back to the name without name parts', () => {
    expect(getTaskLabel(root)).toBe('Backup job')
  })

  it('is empty without name nor name parts', () => {
    expect(getTaskLabel({})).toBe('')
  })
})

describe('filterTaskTree', () => {
  it('keeps a matching task with all its subtasks', () => {
    expect(filterTaskTree(tasks, task => task.id === 'root')).toEqual([root])
  })

  it('keeps the parents of a matching subtask, with only the branch leading to it', () => {
    expect(filterTaskTree(tasks, task => task.id === 'grandchild')).toEqual([
      { ...root, subtasks: [{ ...child, subtasks: [grandchild] }] },
    ])
  })

  it('drops the tasks with no match in their subtree', () => {
    expect(filterTaskTree(tasks, task => task.id === 'other')).toEqual([other])
  })

  it('leaves the source tasks unchanged', () => {
    filterTaskTree(tasks, task => task.id === 'grandchild')

    expect(root.subtasks).toEqual([child, sibling])
  })
})

describe('filterTasksByName', () => {
  it('returns the tasks unchanged for a blank search', () => {
    expect(filterTasksByName(tasks, '  ')).toBe(tasks)
  })

  it('matches the label regardless of case and surrounding spaces', () => {
    expect(filterTasksByName(tasks, '  MIGRATION ')).toEqual([other])
  })

  it('matches a subtask and keeps its parents', () => {
    expect(filterTasksByName(tasks, 'transfer')).toEqual([{ ...root, subtasks: [child] }])
  })

  it('matches the label built from the name parts, not the raw name', () => {
    expect(filterTasksByName([namePartsTask], 'migrate vm')).toEqual([namePartsTask])
    expect(filterTasksByName([namePartsTask], 'vm.migrate')).toEqual([])
  })
})
