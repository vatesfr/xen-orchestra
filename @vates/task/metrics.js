'use strict'

const assert = require('node:assert').strict

class Metric {
  constructor({ historyInterval, unit }) {
    // samples (`[timestamp, value]`)
    this.history = []
    // only grows, see TaskMetrics
    this.historyInterval = historyInterval
    this.recent = []
    this.total = undefined
    this.unit = unit
    this.value = 0
  }

  toJSON() {
    const { history, recent, total, unit, value } = this
    const json = { value, recent: recent.slice(), history: history.slice() }
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
 * Cumulative metrics of a task (bytes read, bytes written…), with a bounded history to draw charts
 *
 * The metrics are emitted in the `metrics` property of the task, throttled. Each metric is:
 *
 * - `value`: the latest value
 * - `total`: the expected final value, if known
 * - `unit`: the unit of the values, if defined (`bytes`, `blocks`…)
 * - `recent`: the latest samples (`[timestamp, value]`), one per emit, to compute the current speed
 * - `history`: samples covering the whole duration of the task, at most `historySize`
 *
 * The history interval starts at the emit interval and is doubled when the history is full: every other sample is
 * dropped, which loses resolution, not volume, as the values are cumulative.
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
   * Optional: an undeclared metric has no unit
   *
   * @param {string} name
   * @param {object} [opts]
   * @param {string} [opts.unit]
   */
  define(name, { unit } = {}) {
    assert(!this.#metrics.has(name), `metric ${name} is already defined`)

    this.#metrics.set(name, new Metric({ historyInterval: this.#minEmitInterval, unit }))
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
    this.#getMetric(name).value += delta
    this.#maybeEmit()
  }

  /**
   * Sets the expected final value of a metric
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

    const metrics = {}
    for (const [name, metric] of this.#metrics) {
      this.#sample(metric, now, isFinal)
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
}
exports.TaskMetrics = TaskMetrics
