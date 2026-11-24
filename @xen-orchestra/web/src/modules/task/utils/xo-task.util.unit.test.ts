import { getTaskSpeed } from '@/modules/task/utils/xo-task.util.ts'
import { describe, expect, it } from 'vitest'

describe('getTaskSpeed', () => {
  it('returns the speed of a running source', () => {
    expect(getTaskSpeed({ properties: { speed: 100 } })).toBe(100)
  })

  it('sums the speeds of the running subtasks', () => {
    const task = {
      properties: {},
      tasks: [
        { properties: {}, tasks: [{ properties: { speed: 100 } }, { properties: { speed: 50 } }] },
        { properties: { speed: 200 }, end: 1 },
        { properties: {} },
      ],
    }

    expect(getTaskSpeed(task)).toBe(150)
  })

  it('has no speed once ended', () => {
    expect(getTaskSpeed({ end: 1, properties: {}, tasks: [{ properties: { speed: 100 } }] })).toBeUndefined()
  })

  it('has no speed without running source', () => {
    expect(getTaskSpeed({ properties: {}, tasks: [{ properties: {} }] })).toBeUndefined()
  })
})
