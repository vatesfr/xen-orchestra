import {
  getBatchProgress,
  getTaskLastActivity,
  getTaskSeverity,
  getUnreadTaskIds,
} from '@/modules/task/utils/xo-tasks-unread.util.ts'
import { createTaskItem } from '@/test/create-task-item.ts'

describe('getTaskLastActivity', () => {
  it('is the start of a task without end nor subtasks', () => {
    expect(getTaskLastActivity(createTaskItem({ start: 100 }))).toBe(100)
  })

  it('is the end of a finished task', () => {
    expect(getTaskLastActivity(createTaskItem({ start: 100, end: 150 }))).toBe(150)
  })

  it('is the latest start or end anywhere in the subtree', () => {
    const task = createTaskItem({
      start: 100,
      end: 200,
      subtasks: [createTaskItem({ start: 110, subtasks: [createTaskItem({ start: 120, end: 300 })] })],
    })

    expect(getTaskLastActivity(task)).toBe(300)
  })
})

describe('getUnreadTaskIds', () => {
  // A root started before `readUntil` (200), with one subtask ended after it
  const tree = createTaskItem({
    id: 'root',
    start: 100,
    subtasks: [createTaskItem({ id: 'a', start: 110, end: 300 }), createTaskItem({ id: 'old', start: 120, end: 150 })],
  })

  it('is empty when nothing happened after the read time', () => {
    expect(getUnreadTaskIds([createTaskItem({ id: 'task', start: 100, end: 150 })], 200, {}).size).toBe(0)
  })

  it('contains a task with its own activity after the read time', () => {
    expect([...getUnreadTaskIds([createTaskItem({ id: 'task', start: 300 })], 200, {})]).toEqual(['task'])
  })

  it('contains an unread subtask and its parents, not its read siblings', () => {
    expect([...getUnreadTaskIds([tree], 200, {})].sort()).toEqual(['a', 'root'])
  })

  it('no longer contains a parent once its only unread subtask is read', () => {
    expect(getUnreadTaskIds([tree], 200, { a: 300 }).size).toBe(0)
  })

  it('keeps a parent with its own activity after its subtask is read', () => {
    const task = createTaskItem({ ...tree, end: 400 })

    expect([...getUnreadTaskIds([task], 200, { a: 300 })]).toEqual(['root'])
  })

  it('applies a read time recorded on a parent to its subtasks', () => {
    expect(getUnreadTaskIds([tree], 200, { root: 300 }).size).toBe(0)
  })

  it('contains a task read before its newer activity', () => {
    const task = createTaskItem({
      ...tree,
      subtasks: [...(tree.subtasks ?? []), createTaskItem({ id: 'b', start: 350 })],
    })

    expect([...getUnreadTaskIds([task], 200, { root: 300 })].sort()).toEqual(['b', 'root'])
  })
})

describe('getTaskSeverity', () => {
  it('is danger for a failed task', () => {
    expect(getTaskSeverity(createTaskItem({ status: 'failure' }))).toBe('danger')
  })

  it('is danger for an interrupted task', () => {
    expect(getTaskSeverity(createTaskItem({ status: 'interrupted' }))).toBe('danger')
  })

  it('is danger when a nested subtask failed, even next to warnings', () => {
    const task = createTaskItem({
      warnings: [{ message: 'warning', data: null }],
      subtasks: [createTaskItem({ subtasks: [createTaskItem({ status: 'failure' })] })],
    })

    expect(getTaskSeverity(task)).toBe('danger')
  })

  it('is warning for a task with warnings', () => {
    expect(getTaskSeverity(createTaskItem({ warnings: [{ message: 'warning', data: null }] }))).toBe('warning')
  })

  it('is warning when a subtask has warnings', () => {
    const task = createTaskItem({ subtasks: [createTaskItem({ warnings: [{ message: 'warning', data: null }] })] })

    expect(getTaskSeverity(task)).toBe('warning')
  })

  it('is undefined for a task without failure nor warnings', () => {
    expect(getTaskSeverity(createTaskItem({ status: 'success', subtasks: [createTaskItem()] }))).toBeUndefined()
  })
})

describe('getBatchProgress', () => {
  const tasks = [
    createTaskItem({ id: 'done', status: 'success', end: 100 }),
    createTaskItem({ id: 'failed', status: 'failure', end: 100 }),
    createTaskItem({ id: 'halfway', status: 'pending', progress: 50 }),
    createTaskItem({ id: 'unknown', status: 'pending' }),
    createTaskItem({ id: 'outside', status: 'success', end: 100 }),
  ]

  it('counts finished tasks as 100 and pending ones as their progress, or 0 when unknown', () => {
    expect(getBatchProgress(tasks, new Set(['done', 'failed', 'halfway', 'unknown']))).toEqual({
      value: 250,
      maxValue: 400,
    })
  })

  it('skips the batch tasks that are no longer listed', () => {
    expect(getBatchProgress(tasks, new Set(['halfway', 'gone']))).toEqual({ value: 50, maxValue: 100 })
  })
})
