import { getTaskAverageSpeed, getTaskSpeed } from '@/modules/task/utils/xo-task.util.ts'
import { describe, expect, it } from 'vitest'

describe('getTaskSpeed', () => {
  it('returns the speed of a running source', () => {
    expect(getTaskSpeed({ start: 0, status: 'pending', properties: { speed: 100 } })).toBe(100)
  })

  it('sums the speeds of the running subtasks', () => {
    const task = {
      start: 0,
      status: 'pending' as const,
      properties: {},
      tasks: [
        {
          start: 0,
          status: 'pending' as const,
          properties: {},
          tasks: [
            { start: 0, status: 'pending' as const, properties: { speed: 100 } },
            { start: 0, status: 'pending' as const, properties: { speed: 50 } },
          ],
        },
        { start: 0, end: 1, status: 'success' as const, properties: { speed: 200 } },
        { start: 0, status: 'pending' as const, properties: {} },
      ],
    }

    expect(getTaskSpeed(task)).toBe(150)
  })

  it('has no speed once ended', () => {
    expect(
      getTaskSpeed({
        start: 0,
        status: 'success',
        properties: {},
        tasks: [{ start: 0, status: 'pending', properties: { speed: 100 } }],
      })
    ).toBeUndefined()
  })

  it('has no speed once interrupted, even without end date', () => {
    expect(getTaskSpeed({ start: 0, status: 'interrupted', properties: { speed: 100 } })).toBeUndefined()
  })

  it('has no speed without running source', () => {
    expect(
      getTaskSpeed({
        start: 0,
        status: 'pending',
        properties: {},
        tasks: [{ start: 0, status: 'pending', properties: {} }],
      })
    ).toBeUndefined()
  })
})

describe('getTaskAverageSpeed', () => {
  it('returns the bytes read by an ended source over its duration', () => {
    expect(getTaskAverageSpeed({ start: 0, end: 2e3, status: 'success', properties: { bytesRead: 500 } })).toBe(250)
  })

  it('sums the bytes read by the subtasks over the duration of the task', () => {
    const task = {
      start: 0,
      end: 10e3,
      status: 'failure' as const,
      properties: {},
      tasks: [
        { start: 0, end: 2e3, status: 'success' as const, properties: { bytesRead: 1e3 } },
        { start: 2e3, end: 4e3, status: 'failure' as const, properties: { bytesRead: 3e3 } },
        { start: 4e3, end: 10e3, status: 'success' as const, properties: {} },
      ],
    }

    expect(getTaskAverageSpeed(task)).toBe(400)
  })

  it('has no average speed while running, or once interrupted without end date', () => {
    expect(getTaskAverageSpeed({ start: 0, status: 'pending', properties: { speed: 100 } })).toBeUndefined()
    expect(getTaskAverageSpeed({ start: 0, status: 'interrupted', properties: { bytesRead: 100 } })).toBeUndefined()
  })

  it('has no average speed without source read', () => {
    expect(getTaskAverageSpeed({ start: 0, end: 1e3, status: 'success', properties: {} })).toBeUndefined()
  })
})
