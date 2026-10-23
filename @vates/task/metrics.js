'use strict'

const assert = require('node:assert').strict

// recent samples used to compute the current speed and the ETA
const MIN_SAMPLES_FOR_ETA = 3

// maximum number of values per level of the sketch used to compute the quantiles
const SKETCH_SIZE = 32

const QUANTILES = { median: 0.5, p95: 0.95 }

const AGGREGATIONS = new Set(['decimation', 'max', 'mean', 'median', 'min', 'p95'])

// keeps the first sample, then only the ones at least `interval` after the previous kept one
function thin(samples, interval) {
  const kept = [samples[0]]
  for (let i = 1; i < samples.length; i++) {
    if (samples[i][0] - kept[kept.length - 1][0] >= interval) {
      kept.push(samples[i])
    }
  }
  return kept
}

/**
 * Bounded summary of values to compute approximate quantiles, with compactors by level (like a KLL sketch)
 *
 * The values of level `h` stand for 2^h observed values each. When a level exceeds SKETCH_SIZE values, it is sorted and
 * every other value is promoted to the next level, alternately starting with the first or the second one: only values
 * of the same weight are compacted together, so the old values are neither favored nor forgotten.
 */
class Sketch {
  #levels = [[]]
  // per level, whether the next compaction starts with the second value
  #offsets = []

  add(value) {
    this.#levels[0].push(value)
    this.#compact()
  }

  merge(other) {
    other.#levels.forEach((values, level) => {
      ;(this.#levels[level] ?? (this.#levels[level] = [])).push(...values)
    })
    this.#compact()
  }

  #compact() {
    const levels = this.#levels
    for (let level = 0; level < levels.length; level++) {
      const values = levels[level]
      if (values.length > SKETCH_SIZE) {
        values.sort((a, b) => a - b)
        // with an odd number of values, the last one stays at its level
        levels[level] = values.length % 2 === 0 ? [] : [values.pop()]
        const offset = this.#offsets[level] ? 1 : 0
        this.#offsets[level] = !this.#offsets[level]
        ;(levels[level + 1] ?? (levels[level + 1] = [])).push(...values.filter((_, i) => i % 2 === offset))
      }
    }
  }

  // nearest-rank quantile
  quantile(q) {
    const weighted = this.#levels.flatMap((values, level) => values.map(value => [value, 2 ** level]))
    weighted.sort(([a], [b]) => a - b)
    const totalWeight = weighted.reduce((sum, [, weight]) => sum + weight, 0)
    const rank = Math.max(1, Math.ceil(q * totalWeight))
    let cumulatedWeight = 0
    for (const [value, weight] of weighted) {
      cumulatedWeight += weight
      if (cumulatedWeight >= rank) {
        return value
      }
    }
    return weighted[weighted.length - 1][0]
  }
}

// summary of the values observed during a history interval
class Bucket {
  constructor(time, value) {
    this.count = 1
    this.max = value
    this.min = value
    this.start = time
    this.sum = value
    // time of the latest observation
    this.time = time
    this.sketch = new Sketch()
    this.sketch.add(value)
  }

  observe(time, value) {
    this.count++
    this.max = Math.max(this.max, value)
    this.min = Math.min(this.min, value)
    this.sum += value
    this.time = time
    this.sketch.add(value)
  }

  // `other` is the following bucket
  merge(other) {
    this.count += other.count
    this.max = Math.max(this.max, other.max)
    this.min = Math.min(this.min, other.min)
    this.sum += other.sum
    this.time = other.time
    this.sketch.merge(other.sketch)
    return this
  }

  aggregate(aggregation) {
    switch (aggregation) {
      case 'max':
        return this.max
      case 'mean':
        return this.sum / this.count
      case 'min':
        return this.min
      default:
        return this.sketch.quantile(QUANTILES[aggregation])
    }
  }
}

// merges each bucket into the previous kept one when they start less than `interval` apart
function thinBuckets(buckets, interval) {
  const kept = [buckets[0]]
  for (let i = 1; i < buckets.length; i++) {
    const previous = kept[kept.length - 1]
    if (buckets[i].start - previous.start >= interval) {
      kept.push(buckets[i])
    } else {
      previous.merge(buckets[i])
    }
  }
  return kept
}

class Metric {
  constructor({ aggregation = 'decimation', historyInterval, unit }) {
    assert(AGGREGATIONS.has(aggregation), `unknown aggregation ${aggregation}`)

    this.aggregation = aggregation
    // samples (`[timestamp, value]`) with the decimation, buckets otherwise
    this.history = []
    // only grows, see TaskMetrics
    this.historyInterval = historyInterval
    this.recent = []
    this.total = undefined
    this.unit = unit
    this.value = 0
  }

  get isAggregated() {
    return this.aggregation !== 'decimation'
  }

  toJSON() {
    const { aggregation, history, recent, total, unit, value } = this
    const json = {
      aggregation,
      value,
      recent: recent.slice(),
      history: this.isAggregated
        ? history.map(bucket => [bucket.time, bucket.aggregate(aggregation)])
        : history.slice(),
    }
    if (total !== undefined) {
      json.total = total
    }
    if (unit !== undefined) {
      json.unit = unit
    }
    return json
  }
}

/**
 * Metrics of a task (bytes read, bytes written, queue depth…), with a bounded history to draw charts
 *
 * The metrics are emitted in the `metrics` property of the task, throttled. Each metric is:
 *
 * - `value`: the latest value
 * - `total`: the expected final value, if known
 * - `unit`: the unit of the values, if defined (`bytes`, `blocks`…)
 * - `aggregation`: how the history summarizes the values of each interval
 * - `recent`: the latest samples (`[timestamp, value]`), one per emit, to compute the current speed
 * - `history`: samples covering the whole duration of the task, at most `historySize`
 *
 * The history interval only grows: it starts at the emit interval, is raised to `expectedDuration / (historySize - 1)`
 * once the ETA can be estimated, and is doubled when the history is full.
 *
 * Aggregations:
 *
 * - `decimation` (default): the history keeps some of the emitted values, the ones in excess are dropped. Lossless for
 *   a cumulative value (bytes read…): dropping a sample loses resolution, not volume
 * - `mean`, `median`, `p95`, `min`, `max`: each history point summarizes all the values set during its interval, for
 *   a gauge (queue depth, memory…). The merged points stay exact for `mean`, `min` and `max`, the quantiles are
 *   approximate beyond 32 values per point
 *
 * The metrics are bound to an explicit task, not to the current one: they can be updated from any async context. The
 * task must be started before the first update.
 */
class TaskMetrics {
  #historySize
  #lastEmitDate
  #metrics = new Map()
  #minEmitInterval
  #recentSize
  #task

  /**
   * @param {import('./index.js').Task} task
   * @param {object} [opts]
   * @param {number} [opts.historySize] maximum number of samples in the history
   * @param {number} [opts.minEmitInterval] minimum duration between two emits, in milliseconds
   * @param {number} [opts.recentSize] number of recent samples
   */
  constructor(task, { historySize = 20, minEmitInterval = 5e3, recentSize = 5 } = {}) {
    assert(historySize >= 2, 'historySize must be at least 2')
    assert(recentSize >= 2, 'recentSize must be at least 2')

    this.#historySize = historySize
    this.#minEmitInterval = minEmitInterval
    this.#recentSize = recentSize
    this.#task = task
  }

  /**
   * Declares a metric, before its first update
   *
   * Optional: an undeclared metric has no unit and uses the decimation
   *
   * @param {string} name
   * @param {object} [opts]
   * @param {'decimation' | 'mean' | 'median' | 'p95' | 'min' | 'max'} [opts.aggregation]
   * @param {string} [opts.unit]
   */
  define(name, { aggregation, unit } = {}) {
    assert(!this.#metrics.has(name), `metric ${name} is already defined`)

    this.#metrics.set(name, new Metric({ aggregation, historyInterval: this.#minEmitInterval, unit }))
  }

  #getMetric(name) {
    let metric = this.#metrics.get(name)
    if (metric === undefined) {
      metric = new Metric({ historyInterval: this.#minEmitInterval })
      this.#metrics.set(name, metric)
    }
    return metric
  }

  /**
   * Adds `delta` to a metric
   *
   * @param {string} name
   * @param {number} delta
   */
  add(name, delta) {
    const metric = this.#getMetric(name)
    this.#update(metric, metric.value + delta)
  }

  /**
   * Sets the value of a metric
   *
   * @param {string} name
   * @param {number} value
   */
  set(name, value) {
    this.#update(this.#getMetric(name), value)
  }

  /**
   * Sets the expected final value of a metric, used to estimate the ETA
   *
   * @param {string} name
   * @param {number | undefined} total
   */
  setTotal(name, total) {
    this.#getMetric(name).total = total
  }

  /**
   * Emits the metrics now, whatever the throttling, the latest values are always in the history
   *
   * To call once the task is done, before ending it
   */
  flush() {
    this.#emit({ isFinal: true })
  }

  #update(metric, value) {
    metric.value = value
    if (metric.isAggregated) {
      this.#observe(metric, Date.now(), value)
    }
    this.#maybeEmit()
  }

  #maybeEmit() {
    if (this.#lastEmitDate === undefined || Date.now() - this.#lastEmitDate >= this.#minEmitInterval) {
      this.#emit({ isFinal: false })
    }
  }

  #emit({ isFinal }) {
    const task = this.#task
    // ended task: late updates are ignored
    if (task.status !== 'pending') {
      return
    }

    const now = Date.now()
    this.#lastEmitDate = now

    for (const metric of this.#metrics.values()) {
      this.#sample(metric, now, isFinal)
    }

    const metrics = {}
    for (const [name, metric] of this.#metrics) {
      metrics[name] = metric.toJSON()
    }
    task.set('metrics', metrics)
  }

  #sample(metric, now, isFinal) {
    const sample = [now, metric.value]

    const { recent } = metric
    recent.push(sample)
    if (recent.length > this.#recentSize) {
      recent.shift()
    }

    this.#updateHistoryInterval(metric, now)

    // the aggregated history is fed by every update, see #observe()
    if (metric.isAggregated) {
      return
    }

    const { history } = metric
    const last = history[history.length - 1]
    if (last === undefined || now - last[0] >= metric.historyInterval) {
      history.push(sample)
    } else if (isFinal) {
      if (history.length > 1) {
        // the final value replaces the latest sample to keep the spacing
        history[history.length - 1] = sample
      } else {
        // but never the first one
        history.push(sample)
      }
    }

    if (history.length > this.#historySize) {
      // keep every other sample, and always the latest one
      metric.history = history.filter((_, i) => i % 2 === 0 || i === history.length - 1)
      metric.historyInterval *= 2
    }
  }

  #observe(metric, now, value) {
    const { history } = metric
    const current = history[history.length - 1]
    if (current === undefined || now - current.start >= metric.historyInterval) {
      history.push(new Bucket(now, value))
    } else {
      current.observe(now, value)
    }

    if (history.length > this.#historySize) {
      // merge the buckets two by two, the latest one stays alone if their number is odd
      const merged = []
      for (let i = 0; i < history.length; i += 2) {
        merged.push(i + 1 < history.length ? history[i].merge(history[i + 1]) : history[i])
      }
      metric.history = merged
      metric.historyInterval *= 2
    }
  }

  // raises the history interval so that the expected duration of the task fits in the history
  #updateHistoryInterval(metric, now) {
    const { history, recent, total, value } = metric
    if (total === undefined || recent.length < MIN_SAMPLES_FOR_ETA || history.length === 0) {
      return
    }
    const [firstTime, firstValue] = recent[0]
    const speed = (value - firstValue) / (now - firstTime)
    if (!(speed > 0)) {
      return
    }
    const historyStart = metric.isAggregated ? history[0].start : history[0][0]
    const expectedDuration = now - historyStart + Math.max(0, total - value) / speed
    // n samples cover n - 1 intervals
    const interval = expectedDuration / (this.#historySize - 1)
    if (interval > metric.historyInterval) {
      metric.historyInterval = interval
      // the samples taken before the ETA was known are too close
      metric.history = metric.isAggregated ? thinBuckets(history, interval) : thin(history, interval)
    }
  }
}
exports.TaskMetrics = TaskMetrics
