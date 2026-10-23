'use strict'

const assert = require('node:assert').strict
const { afterEach, beforeEach, describe, it, mock } = require('node:test')

const { Task } = require('./index.js')
const { TaskMetrics } = require('./metrics.js')

const EMIT_INTERVAL = 5e3

// started task recording its `metrics` property
function createTask() {
  const emitted = []
  const task = new Task({
    onProgress(event) {
      if (event.type === 'property' && event.name === 'metrics') {
        emitted.push(event.value)
      }
    },
  })
  task.start()
  task.emitted = emitted
  return task
}

describe('TaskMetrics', () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ['Date'], now: 0 })
  })
  afterEach(() => {
    mock.timers.reset()
  })

  it('emits the cumulative values, throttled', () => {
    const task = createTask()
    const metrics = new TaskMetrics(task)

    metrics.add('bytesRead', 10)
    metrics.add('bytesRead', 10) // throttled
    mock.timers.tick(EMIT_INTERVAL)
    metrics.add('bytesRead', 10)

    assert.deepEqual(
      task.emitted.map(_ => _.bytesRead.value),
      [10, 30]
    )
  })

  it('always emits the final value', () => {
    const task = createTask()
    const metrics = new TaskMetrics(task)

    metrics.add('bytesRead', 10)
    mock.timers.tick(1e3)
    metrics.add('bytesRead', 10) // throttled
    metrics.flush()

    const last = task.emitted.at(-1).bytesRead
    assert.equal(last.value, 20)
    assert.deepEqual(last.history.at(-1), [1e3, 20])
    // the first sample is kept
    assert.deepEqual(last.history[0], [0, 10])
  })

  it('keeps a bounded number of recent samples', () => {
    const task = createTask()
    const metrics = new TaskMetrics(task, { recentSize: 3 })

    for (let i = 1; i <= 10; i++) {
      metrics.add('bytesRead', 1)
      mock.timers.tick(EMIT_INTERVAL)
    }

    assert.deepEqual(task.emitted.at(-1).bytesRead.recent, [
      [7 * EMIT_INTERVAL, 8],
      [8 * EMIT_INTERVAL, 9],
      [9 * EMIT_INTERVAL, 10],
    ])
  })

  it('keeps a bounded history covering the whole duration, without total', () => {
    const task = createTask()
    const historySize = 10
    const metrics = new TaskMetrics(task, { historySize })

    const nbEmits = 1000
    for (let i = 1; i <= nbEmits; i++) {
      metrics.add('bytesRead', 1)
      mock.timers.tick(EMIT_INTERVAL)
    }
    metrics.flush()

    const { history } = task.emitted.at(-1).bytesRead
    assert.ok(history.length <= historySize, `${history.length} samples`)
    assert.ok(history.length >= historySize / 2, `${history.length} samples`)
    // covers the whole duration
    assert.deepEqual(history[0], [0, 1])
    assert.deepEqual(history.at(-1), [nbEmits * EMIT_INTERVAL, nbEmits])
    // sorted, and the values are cumulative
    for (let i = 1; i < history.length; i++) {
      assert.ok(history[i][0] > history[i - 1][0])
      assert.ok(history[i][1] >= history[i - 1][1])
    }
  })

  it('spreads the history over the expected duration when the total is known', () => {
    const task = createTask()
    const historySize = 10
    const metrics = new TaskMetrics(task, { historySize })
    const nbEmits = 200
    metrics.setTotal('bytesRead', nbEmits)

    let nbHistoryDecimations = 0
    let previousLength = 0
    for (let i = 1; i <= nbEmits; i++) {
      metrics.add('bytesRead', 1)
      const { length } = task.emitted.at(-1).bytesRead.history
      if (length < previousLength) {
        nbHistoryDecimations++
      }
      previousLength = length
      mock.timers.tick(EMIT_INTERVAL)
    }
    metrics.flush()

    const { history, total } = task.emitted.at(-1).bytesRead
    assert.equal(total, nbEmits)
    assert.ok(history.length <= historySize, `${history.length} samples`)
    // the ETA spaces the samples from the start: at most the early samples, taken before the ETA is known, are merged
    assert.ok(nbHistoryDecimations <= 1, `${nbHistoryDecimations} decimations`)
    assert.ok(history.length >= historySize - 2, `${history.length} samples`)
  })

  it('handles several metrics independently', () => {
    const task = createTask()
    const metrics = new TaskMetrics(task, { historySize: 4 })

    for (let i = 1; i <= 100; i++) {
      metrics.add('bytesRead', 2)
      metrics.add('bytesWritten', 1)
      mock.timers.tick(EMIT_INTERVAL)
    }
    metrics.flush()

    const { bytesRead, bytesWritten } = task.emitted.at(-1)
    assert.equal(bytesRead.value, 200)
    assert.equal(bytesWritten.value, 100)
    for (const { history } of [bytesRead, bytesWritten]) {
      assert.ok(history.length >= 2 && history.length <= 4, `${history.length} samples`)
      assert.equal(history.at(-1)[0], 100 * EMIT_INTERVAL)
    }
  })

  it('emits copies, not the internal state', () => {
    const task = createTask()
    const metrics = new TaskMetrics(task)

    metrics.add('bytesRead', 1)
    const first = task.emitted[0].bytesRead
    mock.timers.tick(EMIT_INTERVAL)
    metrics.add('bytesRead', 1)

    assert.equal(first.value, 1)
    assert.equal(first.recent.length, 1)
  })

  it('ignores the updates once the task has ended', () => {
    const task = createTask()
    const metrics = new TaskMetrics(task)

    metrics.add('bytesRead', 1)
    task.success()
    mock.timers.tick(EMIT_INTERVAL)
    metrics.add('bytesRead', 1)
    metrics.flush()

    assert.equal(task.emitted.length, 1)
  })

  it('emits the unit and the aggregation', () => {
    const task = createTask()
    const metrics = new TaskMetrics(task)
    metrics.define('bytesRead', { unit: 'bytes' })

    metrics.add('bytesRead', 1)
    metrics.add('other', 1)
    metrics.flush()

    const { bytesRead, other } = task.emitted.at(-1)
    assert.equal(bytesRead.unit, 'bytes')
    assert.equal(bytesRead.aggregation, 'decimation')
    assert.equal(other.unit, undefined)
    assert.equal(other.aggregation, 'decimation')
  })

  it('rejects an unknown aggregation or a metric defined twice', () => {
    const metrics = new TaskMetrics(createTask())

    assert.throws(() => metrics.define('a', { aggregation: 'p42' }), /unknown aggregation/)
    metrics.define('b')
    assert.throws(() => metrics.define('b'), /already defined/)
  })

  it('keeps a spike between two emits with the max aggregation', () => {
    const task = createTask()
    const metrics = new TaskMetrics(task)
    metrics.define('queueDepth', { aggregation: 'max' })

    for (const value of [1, 2, 100, 3]) {
      metrics.set('queueDepth', value)
      mock.timers.tick(1e3)
    }
    metrics.flush()

    const { history, value } = task.emitted.at(-1).queueDepth
    assert.equal(value, 3)
    assert.deepEqual(history, [[3e3, 100]])
  })

  it('summarizes all the values of an interval', () => {
    // exact quantiles below the sketch size
    for (const [aggregation, expected] of [
      ['mean', 10.5],
      ['median', 10],
      ['p95', 19],
      ['min', 1],
      ['max', 20],
    ]) {
      const task = createTask()
      const metrics = new TaskMetrics(task)
      metrics.define('gauge', { aggregation })

      for (let value = 1; value <= 20; value++) {
        metrics.set('gauge', value)
      }
      metrics.flush()

      assert.equal(task.emitted.at(-1).gauge.history[0][1], expected, aggregation)
    }
  })

  it('keeps the mean exact when merging the history points', () => {
    const task = createTask()
    const historySize = 4
    const metrics = new TaskMetrics(task, { historySize })
    metrics.define('gauge', { aggregation: 'mean' })

    for (let i = 0; i < 1000; i++) {
      metrics.set('gauge', i % 2 === 0 ? 0 : 10)
      mock.timers.tick(1e3)
    }
    metrics.flush()

    const { history } = task.emitted.at(-1).gauge
    assert.ok(history.length <= historySize, `${history.length} samples`)
    for (const [, mean] of history) {
      assert.equal(mean, 5)
    }
  })

  it('approximates the quantiles beyond the sketch size', () => {
    const task = createTask()
    const metrics = new TaskMetrics(task)
    metrics.define('gauge', { aggregation: 'p95' })

    // shuffled values from 1 to 1000
    const values = Array.from({ length: 1000 }, (_, i) => ((i * 7919) % 1000) + 1)
    for (const value of values) {
      metrics.set('gauge', value)
    }
    metrics.flush()

    const [[, p95]] = task.emitted.at(-1).gauge.history
    assert.ok(Math.abs(p95 - 950) <= 30, `p95: ${p95}`)
  })

  it('does not favor the latest values in the quantiles', () => {
    const task = createTask()
    const metrics = new TaskMetrics(task)
    metrics.define('gauge', { aggregation: 'median' })

    // increasing values: a biased sketch would keep the highest ones
    for (let value = 1; value <= 1000; value++) {
      metrics.set('gauge', value)
    }
    metrics.flush()

    const [[, median]] = task.emitted.at(-1).gauge.history
    assert.ok(Math.abs(median - 500) <= 30, `median: ${median}`)
  })
})
