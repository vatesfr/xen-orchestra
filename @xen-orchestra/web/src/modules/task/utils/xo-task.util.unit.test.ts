import { getTaskTransfer, type TransferTask } from '@/modules/task/utils/xo-task.util.ts'
import { describe, expect, it } from 'vitest'

function createTask({ start = 0, end, properties = {}, tasks }: Partial<TransferTask> = {}): TransferTask {
  return { start, end, properties, tasks }
}

const NOW = 10_000

describe('getTaskTransfer', () => {
  it('returns undefined when nothing is transferred', () => {
    expect(getTaskTransfer(createTask({ tasks: [createTask()] }), NOW)).toBeUndefined()
  })

  it('computes the speed of a running transfer since its own start', () => {
    const disk = createTask({ start: 8_000, properties: { size: 100, transferredSize: 50 } })

    expect(getTaskTransfer(disk, NOW)).toEqual({ size: 100, transferredSize: 50, bytesPerSecond: 25 })
  })

  it('keeps the average speed of an ended transfer', () => {
    const disk = createTask({ start: 0, end: 5_000, properties: { size: 10_000, transferredSize: 10_000 } })

    expect(getTaskTransfer(disk, NOW)).toEqual({ size: 10_000, transferredSize: 10_000, bytesPerSecond: 2_000 })
  })

  it('computes the average speed of an ended parent over its own duration', () => {
    const root = createTask({
      start: 0,
      end: 4_000,
      tasks: [
        createTask({ start: 1_000, end: 2_000, properties: { transferredSize: 1_000 } }),
        createTask({ start: 2_000, end: 3_000, properties: { transferredSize: 1_000 } }),
      ],
    })

    expect(getTaskTransfer(root, NOW)?.bytesPerSecond).toBe(500)
  })

  it('sums the subtasks up to the root, and only counts the speed of the running ones', () => {
    const running = createTask({ start: 9_000, properties: { size: 100, transferredSize: 40 } })
    const ended = createTask({ start: 0, end: 5_000, properties: { size: 10, transferredSize: 10 } })
    // backup VM > export > transfer > disks
    const root = createTask({ tasks: [createTask({ tasks: [createTask({ tasks: [running, ended] })] })] })

    expect(getTaskTransfer(root, NOW)).toEqual({ size: 110, transferredSize: 50, bytesPerSecond: 40 })
  })

  it('does not count twice the subtasks of a task reporting its own transfer', () => {
    const vm = createTask({
      start: 0,
      properties: { transferredSize: 1_000 },
      tasks: [createTask({ properties: { transferredSize: 1_000 } })],
    })

    expect(getTaskTransfer(vm, NOW)).toEqual({ size: undefined, transferredSize: 1_000, bytesPerSecond: 100 })
  })

  it('does not know the total size if a transfer does not report it', () => {
    const root = createTask({
      tasks: [
        createTask({ properties: { size: 100, transferredSize: 10 } }),
        createTask({ properties: { transferredSize: 10 } }),
      ],
    })

    expect(getTaskTransfer(root, NOW)?.size).toBeUndefined()
  })
})
