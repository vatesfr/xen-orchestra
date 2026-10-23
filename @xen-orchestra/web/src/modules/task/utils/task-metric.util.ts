import type { XoTask } from '@vates/types'

/** `[timestamp, cumulative value]` */
export type MetricSample = [timestamp: number, value: number]

export type TaskTree = Pick<XoTask, 'start' | 'end' | 'properties'> & { tasks?: TaskTree[] }

export type TaskMetric = {
  /** unit of the values, unknown if the sources don't report the same one */
  unit: string | undefined
  /** how the history of the sources summarizes their values, see `@vates/task/metrics` */
  aggregation: string | undefined
  value: number
  /** expected final value, unknown if one of the sources doesn't report it */
  total: number | undefined
  /** per second: the current speed of the sources still running, or the average speed once the task has ended */
  speed: number
  /** cumulative samples, sorted, to draw a chart */
  samples: MetricSample[]
}

// a metric as emitted by `TaskMetrics` from `@vates/task/metrics`
type RawMetric = {
  unit?: string
  aggregation?: string
  value: number
  total?: number
  recent?: MetricSample[]
  history?: MetricSample[]
}

type ConsolidatedMetric = TaskMetric & { isPending: boolean }

// without a new sample for this long, the current speed of a source decreases
const STALE_DELAY = 10e3

const DEFAULT_MAX_SAMPLES = 60

function isSample(sample: unknown): sample is MetricSample {
  return Array.isArray(sample) && typeof sample[0] === 'number' && typeof sample[1] === 'number'
}

function getRawMetric(task: TaskTree, name: string): RawMetric | undefined {
  const metrics = task.properties.metrics as Record<string, unknown> | undefined
  const metric = metrics?.[name] as Partial<RawMetric> | undefined

  if (metric === undefined || typeof metric.value !== 'number') {
    return undefined
  }

  return {
    unit: typeof metric.unit === 'string' ? metric.unit : undefined,
    // emitted since the aggregations were introduced
    aggregation: typeof metric.aggregation === 'string' ? metric.aggregation : 'decimation',
    value: metric.value,
    total: typeof metric.total === 'number' ? metric.total : undefined,
    recent: Array.isArray(metric.recent) ? metric.recent.filter(isSample) : [],
    history: Array.isArray(metric.history) ? metric.history.filter(isSample) : [],
  }
}

// the history is the skeleton of the curve, the recent samples refine its end
function getOwnSamples(task: TaskTree, { history = [], recent = [] }: RawMetric): MetricSample[] {
  const valueByTime = new Map<number, number>()
  for (const [time, value] of [...history, ...recent]) {
    valueByTime.set(time, value)
  }
  const samples = [...valueByTime].sort(([a], [b]) => a - b)

  // the source started from 0 when its task started
  const first = samples[0]
  if (first !== undefined && first[1] > 0 && task.start < first[0]) {
    samples.unshift([task.start, 0])
  }

  return samples
}

function getAverageSpeed(task: TaskTree, value: number, now: number) {
  const elapsedMs = (task.end ?? now) - task.start

  return elapsedMs > 0 ? (value * 1e3) / elapsedMs : 0
}

// slope of the recent samples, decreasing if no sample has been received for a while
function getCurrentSpeed(task: TaskTree, { value, recent = [] }: RawMetric, now: number) {
  const first = recent[0]
  const last = recent.at(-1)

  if (first === undefined || last === undefined || recent.length < 2) {
    return getAverageSpeed(task, value, now)
  }

  const end = Math.max(last[0], now - STALE_DELAY)

  return end > first[0] ? ((last[1] - first[1]) * 1e3) / (end - first[0]) : 0
}

/**
 * Value of a cumulative series at `time`: 0 before its first sample, linear between two samples, the last value after
 */
export function getValueAt(samples: MetricSample[], time: number): number {
  const first = samples[0]
  const last = samples.at(-1)

  if (first === undefined || last === undefined || time < first[0]) {
    return 0
  }
  if (time >= last[0]) {
    return last[1]
  }

  // samples are sorted: find the first one after `time`
  let i = 1
  while (samples[i][0] <= time) {
    i++
  }
  const [t0, v0] = samples[i - 1]
  const [t1, v1] = samples[i]

  return v0 + ((v1 - v0) * (time - t0)) / (t1 - t0)
}

/**
 * Sums the cumulative series of the children, whose samples are not aligned
 *
 * Each child is evaluated at the times of all the samples, interpolating between its own ones.
 *
 * A child still running only knows its value up to its latest sample: the sum stops at the earliest latest sample of
 * the running children, otherwise a child not reported yet would make the curve flatten then jump.
 */
export function sumSamples(
  children: { samples: MetricSample[]; isPending: boolean }[],
  maxSamples = DEFAULT_MAX_SAMPLES
): MetricSample[] {
  let watermark = Infinity
  for (const { samples, isPending } of children) {
    const last = samples.at(-1)
    if (isPending && last !== undefined) {
      watermark = Math.min(watermark, last[0])
    }
  }

  let times = [...new Set(children.flatMap(({ samples }) => samples.map(([time]) => time)))]
    .filter(time => time <= watermark)
    .sort((a, b) => a - b)

  // many children: resample on a regular grid
  if (times.length > maxSamples) {
    const start = times[0]
    const step = (times[times.length - 1] - start) / (maxSamples - 1)
    times = Array.from({ length: maxSamples }, (_, i) => start + i * step)
  }

  return times.map(time => [time, children.reduce((sum, { samples }) => sum + getValueAt(samples, time), 0)])
}

// the value shared by all the items, undefined if they differ
function getCommonValue(values: (string | undefined)[]): string | undefined {
  return values.every(value => value === values[0]) ? values[0] : undefined
}

function consolidate(task: TaskTree, name: string, now: number, maxSamples: number): ConsolidatedMetric | undefined {
  const isPending = task.end === undefined
  const raw = getRawMetric(task, name)

  // a task reporting the metric is a source: its subtasks are not visited, so the same values are never counted twice
  if (raw !== undefined) {
    return {
      unit: raw.unit,
      aggregation: raw.aggregation,
      value: raw.value,
      total: raw.total,
      speed: isPending ? getCurrentSpeed(task, raw, now) : 0,
      samples: getOwnSamples(task, raw),
      isPending,
    }
  }

  const children = (task.tasks ?? [])
    .map(subtask => consolidate(subtask, name, now, maxSamples))
    .filter(child => child !== undefined)

  if (children.length === 0) {
    return undefined
  }

  return {
    unit: getCommonValue(children.map(child => child.unit)),
    aggregation: getCommonValue(children.map(child => child.aggregation)),
    value: children.reduce((sum, child) => sum + child.value, 0),
    total: children.every(child => child.total !== undefined)
      ? children.reduce((sum, child) => sum + child.total!, 0)
      : undefined,
    // only the children still running have a speed
    speed: children.reduce((sum, child) => sum + child.speed, 0),
    samples: sumSamples(children, maxSamples),
    isPending,
  }
}

/**
 * Consolidates a metric (`bytesRead`…) reported in the `metrics` property of a task and its subtasks
 *
 * - value and total: sum of the sources
 * - speed: while running, sum of the current speeds of the sources still running; once ended, value / duration
 * - samples: sum of the sources' series, to draw a chart
 * - unit and aggregation: the ones of the sources, if they all share them
 *
 * The sums are meant for cumulative metrics (`decimation` aggregation): a sum of medians or of p95 is not the median or
 * the p95 of the whole.
 */
export function getTaskMetric(
  task: TaskTree,
  name: string,
  { now = Date.now(), maxSamples = DEFAULT_MAX_SAMPLES } = {}
): TaskMetric | undefined {
  const metric = consolidate(task, name, now, maxSamples)

  if (metric === undefined) {
    return undefined
  }

  const { isPending, ...taskMetric } = metric
  if (!isPending) {
    taskMetric.speed = getAverageSpeed(task, taskMetric.value, now)
  }

  return taskMetric
}

/**
 * Speed (per second) of a cumulative series, averaged over a sliding window ending at each sample
 *
 * Consecutive samples can be very close (the first read blocks, already prefetched, right after the start, or the
 * samples of different sources in a consolidated series): the speed between them is meaningless. The window lasts at
 * least `minWindow`, and at least `1 / maxPoints` of the whole series, so the chart has the same smoothness whatever
 * the duration.
 *
 * @param opts.minWindow in milliseconds
 */
export function getSpeedSeries(
  samples: MetricSample[],
  { minWindow = 10e3, maxPoints = 30 } = {}
): { timestamp: number; value: number }[] {
  const first = samples[0]
  const last = samples.at(-1)
  if (first === undefined || last === undefined || last[0] <= first[0]) {
    return []
  }

  // a series shorter than the window: a single average
  const window = Math.min(last[0] - first[0], Math.max(minWindow, (last[0] - first[0]) / maxPoints))

  const series: { timestamp: number; value: number }[] = []
  // latest sample at least `window` before the current one
  let start = 0
  for (let i = 1; i < samples.length; i++) {
    const [time, value] = samples[i]
    while (start + 1 < i && time - samples[start + 1][0] >= window) {
      start++
    }

    const [startTime, startValue] = samples[start]
    if (time - startTime >= window) {
      series.push({ timestamp: time, value: ((value - startValue) * 1e3) / (time - startTime) })
    }
  }

  return series
}
