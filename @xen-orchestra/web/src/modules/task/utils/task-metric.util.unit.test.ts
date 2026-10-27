import {
  getSpeedSeries,
  getTaskMetric,
  getValueAt,
  sumSamples,
  type MetricSample,
  type TaskTree,
} from '@/modules/task/utils/task-metric.util.ts'
import { describe, expect, it } from 'vitest'

const NOW = 100_000

function createTask({ start = 0, end, properties = {}, tasks }: Partial<TaskTree> = {}): TaskTree {
  return { start, end, properties, tasks }
}

function createSource({
  start = 0,
  end,
  value,
  total,
  unit = 'bytes',
  recent = [],
  history = [],
}: {
  start?: number
  end?: number
  value: number
  total?: number
  unit?: string
  recent?: MetricSample[]
  history?: MetricSample[]
}): TaskTree {
  return createTask({
    start,
    end,
    properties: { metrics: { bytesRead: { unit, value, total, recent, history } } },
  })
}

describe('getValueAt', () => {
  const samples: MetricSample[] = [
    [10, 100],
    [20, 300],
  ]

  it('is 0 before the first sample', () => {
    expect(getValueAt(samples, 5)).toBe(0)
  })

  it('interpolates between two samples', () => {
    expect(getValueAt(samples, 15)).toBe(200)
  })

  it('keeps the last value after the last sample', () => {
    expect(getValueAt(samples, 50)).toBe(300)
  })
})

describe('sumSamples', () => {
  it('sums children whose samples are not aligned', () => {
    const a = {
      isPending: false,
      samples: [
        [0, 0],
        [10, 100],
        [20, 200],
      ] as MetricSample[],
    }
    const b = {
      isPending: false,
      samples: [
        [5, 0],
        [15, 50],
      ] as MetricSample[],
    }

    expect(sumSamples([a, b])).toEqual([
      [0, 0],
      [5, 50],
      [10, 125],
      [15, 200],
      [20, 250],
    ])
  })

  it('stops at the earliest latest sample of the running children', () => {
    const running = {
      isPending: true,
      samples: [
        [0, 0],
        [10, 100],
      ] as MetricSample[],
    }
    const ahead = {
      isPending: true,
      samples: [
        [0, 0],
        [12, 120],
      ] as MetricSample[],
    }
    const ended = {
      isPending: false,
      samples: [
        [0, 0],
        [5, 50],
      ] as MetricSample[],
    }

    const samples = sumSamples([running, ahead, ended])

    expect(samples.at(-1)).toEqual([10, 100 + 100 + 50])
  })

  it('resamples on a regular grid when there are too many samples', () => {
    const children = Array.from({ length: 10 }, (_, i) => ({
      isPending: false,
      samples: [
        [i, 0],
        [100 + i, 10],
      ] as MetricSample[],
    }))

    const samples = sumSamples(children, 5)

    expect(samples.map(([time]) => time)).toEqual([0, 27.25, 54.5, 81.75, 109])
    expect(samples.at(-1)).toEqual([109, 100])
  })
})

describe('getTaskMetric', () => {
  it('returns undefined when the metric is not reported', () => {
    expect(getTaskMetric(createTask({ tasks: [createTask()] }), 'bytesRead', { now: NOW })).toBeUndefined()
  })

  it('uses the slope of the recent samples as the current speed of a running source', () => {
    const source = createSource({
      value: 3_000,
      total: 10_000,
      recent: [
        [90_000, 1_000],
        [95_000, 2_000],
        [NOW, 3_000],
      ],
    })

    expect(getTaskMetric(source, 'bytesRead', { now: NOW })).toMatchObject({
      value: 3_000,
      total: 10_000,
      speed: 200,
    })
  })

  it('decreases the current speed of a source without new sample', () => {
    const source = createSource({
      value: 2_000,
      recent: [
        [50_000, 1_000],
        [60_000, 2_000],
      ],
    })

    // the latest sample is 40 s old: the speed is computed until NOW - 10 s
    expect(getTaskMetric(source, 'bytesRead', { now: NOW })?.speed).toBe(25)
  })

  it('uses the average speed of an ended source', () => {
    const source = createSource({ end: 50_000, value: 10_000 })

    expect(getTaskMetric(source, 'bytesRead', { now: NOW })?.speed).toBe(200)
  })

  it('sums the values, and only the speeds of the running sources', () => {
    const running = createSource({
      value: 1_000,
      total: 2_000,
      recent: [
        [90_000, 0],
        [NOW, 1_000],
      ],
    })
    const ended = createSource({ end: 50_000, value: 5_000, total: 5_000 })
    // backup VM > read > disks
    const root = createTask({ tasks: [createTask({ tasks: [running, ended] })] })

    expect(getTaskMetric(root, 'bytesRead', { now: NOW })).toMatchObject({
      value: 6_000,
      total: 7_000,
      speed: 100,
    })
  })

  it('uses the average speed over its own duration once the parent has ended', () => {
    const root = createTask({
      start: 0,
      end: 40_000,
      tasks: [createSource({ start: 10_000, end: 20_000, value: 4_000 })],
    })

    expect(getTaskMetric(root, 'bytesRead', { now: NOW })?.speed).toBe(100)
  })

  it('does not count twice the subtasks of a task reporting the metric', () => {
    const source = createSource({ end: 10_000, value: 1_000 })
    source.tasks = [createSource({ end: 10_000, value: 1_000 })]

    expect(getTaskMetric(source, 'bytesRead', { now: NOW })?.value).toBe(1_000)
  })

  it('does not know the total if a source does not report it', () => {
    const root = createTask({
      tasks: [createSource({ value: 1, total: 10 }), createSource({ value: 1 })],
    })

    expect(getTaskMetric(root, 'bytesRead', { now: NOW })?.total).toBeUndefined()
  })

  it('merges the history and the recent samples, from 0 at the start of the source', () => {
    const source = createSource({
      start: 1_000,
      end: 30_000,
      value: 300,
      history: [
        [2_000, 50],
        [20_000, 200],
      ],
      recent: [
        [20_000, 200],
        [30_000, 300],
      ],
    })

    expect(getTaskMetric(source, 'bytesRead', { now: NOW })?.samples).toEqual([
      [1_000, 0],
      [2_000, 50],
      [20_000, 200],
      [30_000, 300],
    ])
  })
})

describe('getSpeedSeries', () => {
  it('computes the speed between consecutive samples with a small window', () => {
    expect(
      getSpeedSeries(
        [
          [0, 0],
          [2_000, 1_000],
          [4_000, 1_000],
          [5_000, 2_000],
        ],
        { minWindow: 1, maxPoints: Infinity }
      )
    ).toEqual([
      { timestamp: 2_000, value: 500 },
      { timestamp: 4_000, value: 0 },
      { timestamp: 5_000, value: 1_000 },
    ])
  })

  it('smooths a burst right after the start', () => {
    // 100 MB prefetched in 10 ms, then 10 MB/s for 60 s
    const samples: MetricSample[] = [
      [0, 0],
      [10, 100e6],
      ...Array.from({ length: 12 }, (_, i): MetricSample => [(i + 1) * 5_000, 100e6 + (i + 1) * 50e6]),
    ]

    const speeds = getSpeedSeries(samples).map(({ value }) => value)

    // no 10 GB/s spike: the burst is averaged over at least 10 s
    expect(Math.max(...speeds)).toBeLessThan(25e6)
    expect(speeds.at(-1)).toBe(10e6)
  })

  it('averages the whole series when it is shorter than the window', () => {
    expect(
      getSpeedSeries([
        [0, 0],
        [1_000, 500],
        [2_000, 2_000],
      ])
    ).toEqual([{ timestamp: 2_000, value: 1_000 }])
  })

  it('ignores a series without duration', () => {
    expect(
      getSpeedSeries([
        [0, 0],
        [0, 10],
      ])
    ).toEqual([])
  })
})

describe('getTaskMetric unit', () => {
  it('keeps the unit shared by the sources', () => {
    const root = createTask({ tasks: [createSource({ value: 1 }), createSource({ value: 2 })] })

    expect(getTaskMetric(root, 'bytesRead', { now: NOW })).toMatchObject({ unit: 'bytes' })
  })

  it('does not know the unit if the sources differ', () => {
    const root = createTask({ tasks: [createSource({ value: 1 }), createSource({ value: 2, unit: 'blocks' })] })

    expect(getTaskMetric(root, 'bytesRead', { now: NOW })?.unit).toBeUndefined()
  })
})
