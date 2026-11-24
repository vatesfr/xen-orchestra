import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { getTaskAverageReadingSpeed, getTaskReadingSpeed } from '@/modules/task/utils/xo-task.util.ts'

function createTask(overrides: Partial<FrontXoTask> = {}): FrontXoTask {
  return { id: 'task' as FrontXoTask['id'], start: 0, status: 'pending', properties: {}, ...overrides }
}

describe('getTaskReadingSpeed', () => {
  it('returns the speed of a running source', () => {
    expect(getTaskReadingSpeed(createTask({ properties: { speed: 100 } }))).toBe(100)
  })

  it('sums the speeds of the running subtasks', () => {
    const task = createTask({
      tasks: [
        createTask({
          tasks: [createTask({ properties: { speed: 100 } }), createTask({ properties: { speed: 50 } })],
        }),
        createTask({ status: 'success', end: 1, properties: { speed: 200 } }),
        createTask(),
      ],
    })

    expect(getTaskReadingSpeed(task)).toBe(150)
  })

  it('has no speed once ended', () => {
    const task = createTask({ status: 'success', end: 1, tasks: [createTask({ properties: { speed: 100 } })] })

    expect(getTaskReadingSpeed(task)).toBeUndefined()
  })

  it('has no speed once interrupted, even without end date', () => {
    expect(getTaskReadingSpeed(createTask({ status: 'interrupted', properties: { speed: 100 } }))).toBeUndefined()
  })

  it('has no speed without running source', () => {
    expect(getTaskReadingSpeed(createTask({ tasks: [createTask()] }))).toBeUndefined()
  })
})

describe('getTaskAverageReadingSpeed', () => {
  it('returns the bytes read by an ended source over its duration', () => {
    const task = createTask({ status: 'success', end: 2e3, properties: { bytesRead: 500 } })

    expect(getTaskAverageReadingSpeed(task)).toBe(250)
  })

  it('sums the bytes read by the subtasks over the duration of the task', () => {
    const task = createTask({
      status: 'failure',
      end: 10e3,
      tasks: [
        createTask({ status: 'success', end: 2e3, properties: { bytesRead: 1e3 } }),
        createTask({ status: 'failure', start: 2e3, end: 4e3, properties: { bytesRead: 3e3 } }),
        createTask({ status: 'success', start: 4e3, end: 10e3 }),
      ],
    })

    expect(getTaskAverageReadingSpeed(task)).toBe(400)
  })

  it('has no average speed while running, or once interrupted without end date', () => {
    expect(getTaskAverageReadingSpeed(createTask({ properties: { speed: 100 } }))).toBeUndefined()
    expect(
      getTaskAverageReadingSpeed(createTask({ status: 'interrupted', properties: { bytesRead: 100 } }))
    ).toBeUndefined()
  })

  it('has no average speed without source read', () => {
    expect(getTaskAverageReadingSpeed(createTask({ status: 'success', end: 1e3 }))).toBeUndefined()
  })
})
