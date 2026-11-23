import { getTaskSpeed } from '@/modules/task/utils/xo-task.util.ts'
import { describe, expect, it } from 'vitest'

describe('getTaskSpeed', () => {
  it('returns the speed of a running source', () => {
    expect(getTaskSpeed({ status: 'pending', properties: { speed: 100 } })).toBe(100)
  })

  it('sums the speeds of the running subtasks', () => {
    const task = {
      status: 'pending' as const,
      properties: {},
      tasks: [
        {
          status: 'pending' as const,
          properties: {},
          tasks: [
            { status: 'pending' as const, properties: { speed: 100 } },
            { status: 'pending' as const, properties: { speed: 50 } },
          ],
        },
        { status: 'success' as const, properties: { speed: 200 } },
        { status: 'pending' as const, properties: {} },
      ],
    }

    expect(getTaskSpeed(task)).toBe(150)
  })

  it('has no speed once ended', () => {
    expect(
      getTaskSpeed({ status: 'success', properties: {}, tasks: [{ status: 'pending', properties: { speed: 100 } }] })
    ).toBeUndefined()
  })

  it('has no speed once interrupted, even without end date', () => {
    expect(getTaskSpeed({ status: 'interrupted', properties: { speed: 100 } })).toBeUndefined()
  })

  it('has no speed without running source', () => {
    expect(
      getTaskSpeed({ status: 'pending', properties: {}, tasks: [{ status: 'pending', properties: {} }] })
    ).toBeUndefined()
  })
})
