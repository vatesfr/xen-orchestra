import { getBatchProgress } from '@/modules/task/utils/xo-tasks-pending.util.ts'
import { createTaskItem } from '@core-test/create-task-item.ts'

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
