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

  it('emits the total and the unit', () => {
    const task = createTask()
    const metrics = new TaskMetrics(task)
    metrics.define('bytesRead', { unit: 'bytes' })
    metrics.setTotal('bytesRead', 10)

    metrics.add('bytesRead', 1)
    metrics.add('other', 1)
    metrics.flush()

    const { bytesRead, other } = task.emitted.at(-1)
    assert.equal(bytesRead.total, 10)
    assert.equal(bytesRead.unit, 'bytes')
    assert.equal(other.total, undefined)
    assert.equal(other.unit, undefined)
  })

  it('rejects a metric defined twice', () => {
    const metrics = new TaskMetrics(createTask())

    metrics.define('a')
    assert.throws(() => metrics.define('a'), /already defined/)
  })
})
