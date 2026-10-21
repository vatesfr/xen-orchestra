import { getTaskRead, type TaskTree } from '@/modules/task/utils/xo-task.util.ts'
import { describe, expect, it } from 'vitest'

function createTask({ start = 0, end, properties = {}, tasks }: Partial<TaskTree> = {}): TaskTree {
  return { start, end, properties, tasks }
}

const NOW = 10_000

describe('getTaskRead', () => {
  it('returns undefined when nothing is read', () => {
    expect(getTaskRead(createTask({ tasks: [createTask()] }), NOW)).toBeUndefined()
  })

  it('computes the speed of a running read since its own start', () => {
    const disk = createTask({ start: 8_000, properties: { bytesToRead: 100, bytesRead: 50 } })

    expect(getTaskRead(disk, NOW)).toEqual({ bytesToRead: 100, bytesRead: 50, bytesPerSecond: 25 })
  })

  it('keeps the average speed of an ended read', () => {
    const disk = createTask({ start: 0, end: 5_000, properties: { bytesToRead: 10_000, bytesRead: 10_000 } })

    expect(getTaskRead(disk, NOW)).toEqual({ bytesToRead: 10_000, bytesRead: 10_000, bytesPerSecond: 2_000 })
  })

  it('computes the average speed of an ended parent over its own duration', () => {
    const root = createTask({
      start: 0,
      end: 4_000,
      tasks: [
        createTask({ start: 1_000, end: 2_000, properties: { bytesRead: 1_000 } }),
        createTask({ start: 2_000, end: 3_000, properties: { bytesRead: 1_000 } }),
      ],
    })

    expect(getTaskRead(root, NOW)?.bytesPerSecond).toBe(500)
  })

  it('sums the subtasks up to the root, and only counts the speed of the running ones', () => {
    const running = createTask({ start: 9_000, properties: { bytesToRead: 100, bytesRead: 40 } })
    const ended = createTask({ start: 0, end: 5_000, properties: { bytesToRead: 10, bytesRead: 10 } })
    // backup VM > read > disks
    const root = createTask({ tasks: [createTask({ tasks: [createTask({ tasks: [running, ended] })] })] })

    expect(getTaskRead(root, NOW)).toEqual({ bytesToRead: 110, bytesRead: 50, bytesPerSecond: 40 })
  })

  it('does not count twice the subtasks of a task reporting its own read', () => {
    const vm = createTask({
      start: 0,
      properties: { bytesRead: 1_000 },
      tasks: [createTask({ properties: { bytesRead: 1_000 } })],
    })

    expect(getTaskRead(vm, NOW)).toEqual({ bytesToRead: undefined, bytesRead: 1_000, bytesPerSecond: 100 })
  })

  it('does not know the bytes to read if a read does not report them', () => {
    const root = createTask({
      tasks: [
        createTask({ properties: { bytesToRead: 100, bytesRead: 10 } }),
        createTask({ properties: { bytesRead: 10 } }),
      ],
    })

    expect(getTaskRead(root, NOW)?.bytesToRead).toBeUndefined()
  })
})
